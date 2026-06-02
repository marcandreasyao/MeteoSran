import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";
import { PrismaClient } from '@prisma/client';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Neon cold-start retry helper.
// Neon serverless databases can take a few seconds to wake up.
// This wrapper retries any failed Prisma operation up to `maxRetries` times
// with exponential backoff before giving up and throwing the error.
const withRetry = async (operation, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (err) {
            const isConnectionError = err.errorCode === 'P1001' || err.message?.includes("Can't reach database");
            if (isConnectionError && attempt < maxRetries) {
                const delay = attempt * 1500; // 1.5s, 3s, 4.5s ...
                console.warn(`[MeteoSran Server] DB connection failed (attempt ${attempt}/${maxRetries}). Neon may be waking up. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw err;
            }
        }
    }
};
const app = express();
const PORT = process.env.PORT || 5005;

// SECURITY NOTE: I have redacted your AccuWeather key here. 
// Make sure to use process.env in production so bots don't steal it!
const ACCUWEATHER_API_KEY = process.env.ACCUWEATHER_API_KEY || 'YOUR_ACCUWEATHER_KEY_HERE';
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '1bd935b392a1cecddcf1c018a57e5511';
const ABIDJAN_LOCATION_KEY = '223019';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Keep-alive ping route
app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

// ─────────────────────────────────────────────────────────────────
// KEY HEALTH STATUS ENDPOINT
// GET /api/keys/status — returns live state of all Gemini API keys
// ─────────────────────────────────────────────────────────────────
app.get('/api/keys/status', (req, res) => {
    const now = Date.now();
    const status = geminiKeysState.map((ks, i) => {
        const cooldownRemainingMs = Math.max(0, ks.cooldownUntil - now);
        const state = ks.invalidKey
            ? 'invalid'
            : ks.billingExhausted && cooldownRemainingMs > 0
                ? 'billing_exhausted'
                : cooldownRemainingMs > 0
                    ? 'cooling_down'
                    : 'available';
        return {
            key: i + 1,
            label: ks.label,
            state,
            lastError: ks.lastError,
            failureCount: ks.failureCount,
            cooldownRemainingSeconds: Math.ceil(cooldownRemainingMs / 1000),
            totalRequests: ks.totalRequests,
            totalSuccess: ks.totalSuccess,
            successRate: ks.totalRequests > 0
                ? `${Math.round((ks.totalSuccess / ks.totalRequests) * 100)}%`
                : 'N/A',
        };
    });

    const availableCount = status.filter(k => k.state === 'available').length;
    res.json({
        totalKeys: geminiKeysState.length,
        availableKeys: availableCount,
        allExhausted: availableCount === 0,
        keys: status,
        timestamp: new Date().toISOString(),
    });
});

// Load multiple Gemini API keys for rotation safely without dynamic property access
const GEMINI_KEYS = [];
const geminiKeysList = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
    process.env.GEMINI_API_KEY_6,
    process.env.GEMINI_API_KEY_7,
    process.env.GEMINI_API_KEY_8,
    process.env.GEMINI_API_KEY_9,
    process.env.GEMINI_API_KEY_10
];
geminiKeysList.forEach(key => {
    if (key) GEMINI_KEYS.push(key);
});
// Fallback to original key if no numbered keys are found
if (GEMINI_KEYS.length === 0 && process.env.GEMINI_API_KEY) {
    GEMINI_KEYS.push(process.env.GEMINI_API_KEY);
}

if (GEMINI_KEYS.length === 0) {
    console.warn("[MeteoSran Server] Warning: No GEMINI_API_KEY found in server environment.");
} else {
    console.log(`[MeteoSran Server] Loaded ${GEMINI_KEYS.length} Gemini API keys for rotation.`);
}

// ============================================================
// ULTIMATE KEY ROTATION STATE
// Tracks: cooldowns, failure counts, billing exhaustion
// ============================================================

/**
 * Error types for smart key rotation:
 * - 'rate_limit'   : 429 Too Many Requests — temporary, use exponential backoff
 * - 'billing'      : RESOURCE_EXHAUSTED / credits depleted — long cooldown (10 min)
 * - 'auth'         : 401/403 invalid key — skip permanently
 * - 'server_error' : 5xx — short cooldown (15s)
 */
const geminiKeysState = GEMINI_KEYS.map((key, i) => ({
    key,
    label: `Key ${i + 1}`,
    cooldownUntil: 0,       // timestamp when this key can be used again
    failureCount: 0,        // consecutive failures (for exponential backoff)
    billingExhausted: false, // true = credits depleted, requires billing action
    invalidKey: false,      // true = bad API key, skip permanently
    lastError: null,        // last error type string
    totalRequests: 0,       // lifetime requests made with this key
    totalSuccess: 0,        // lifetime successes
}));

let currentKeyIndex = 0;

/**
 * Returns the next available Gemini API key that is not in cooldown.
 * Skips permanently-broken keys (billing exhausted, invalid).
 * Falls back to least-recently-available key if all are in cooldown.
 */
const getNextAvailableKey = () => {
    const now = Date.now();
    const totalKeys = geminiKeysState.length;
    if (totalKeys === 0) return null;

    // Pass 1: Find an available key (no cooldown, not permanently broken)
    for (let i = 0; i < totalKeys; i++) {
        const index = (currentKeyIndex + i) % totalKeys;
        const keyState = geminiKeysState.at(index);
        if (!keyState) continue;
        if (keyState.invalidKey) continue; // skip permanently bad keys
        if (keyState.cooldownUntil <= now) {
            currentKeyIndex = (index + 1) % totalKeys;
            return { key: keyState.key, index, state: keyState };
        }
    }

    // Pass 2: All usable keys are in cooldown — pick the soonest to recover
    let bestIndex = -1;
    let minCooldown = Infinity;
    for (let i = 0; i < totalKeys; i++) {
        const keyState = geminiKeysState.at(i);
        if (!keyState || keyState.invalidKey) continue;
        if (keyState.cooldownUntil < minCooldown) {
            minCooldown = keyState.cooldownUntil;
            bestIndex = i;
        }
    }

    if (bestIndex === -1) {
        console.error('[MeteoSran Server] ❌ ALL Gemini keys are permanently unavailable (billing exhausted or invalid).');
        return null;
    }

    currentKeyIndex = (bestIndex + 1) % totalKeys;
    const bestKeyState = geminiKeysState.at(bestIndex);
    const waitSec = Math.ceil((bestKeyState.cooldownUntil - now) / 1000);
    console.warn(`[MeteoSran Server] ⏳ All keys cooling down. Using ${bestKeyState.label}, available in ${waitSec}s.`);
    return { key: bestKeyState.key, index: bestIndex, state: bestKeyState };
};

/**
 * Smart key failure handler.
 * Distinguishes billing exhaustion (long cooldown) from rate limits (exponential backoff).
 */
const markKeyFailed = (index, errorMessage = '', status = null) => {
    if (index < 0 || index >= geminiKeysState.length) return;
    const keyState = geminiKeysState.at(index);
    if (!keyState) return;

    keyState.failureCount++;
    const isBillingExhausted = errorMessage.includes('prepayment credits') ||
                               errorMessage.includes('credits are depleted') ||
                               errorMessage.includes('RESOURCE_EXHAUSTED') && (status === 429 || errorMessage.includes('billing'));
    const isRateLimit = status === 429 || errorMessage.includes('429') || errorMessage.includes('Too Many Requests');
    const isInvalidAuth = status === 401 || status === 403 && errorMessage.includes('API_KEY_INVALID');
    const isServerError = status >= 500;

    if (isInvalidAuth) {
        keyState.invalidKey = true;
        keyState.lastError = 'auth';
        keyState.cooldownUntil = Infinity;
        console.error(`[MeteoSran Server] 🔑 ${keyState.label} is INVALID — skipping permanently.`);
    } else if (isBillingExhausted) {
        // Long cooldown: 10 minutes for billing issues
        const cooldownMs = 10 * 60 * 1000;
        keyState.billingExhausted = true;
        keyState.lastError = 'billing';
        keyState.cooldownUntil = Date.now() + cooldownMs;
        console.warn(`[MeteoSran Server] 💳 ${keyState.label} billing credits EXHAUSTED. Cooling down 10 minutes (until ${new Date(keyState.cooldownUntil).toLocaleTimeString()}).`);
    } else if (isRateLimit) {
        // Exponential backoff: 60s → 120s → 300s → 600s (caps at 10 min)
        const backoffSeconds = Math.min(60 * Math.pow(2, keyState.failureCount - 1), 600);
        keyState.lastError = 'rate_limit';
        keyState.cooldownUntil = Date.now() + backoffSeconds * 1000;
        console.warn(`[MeteoSran Server] ⏱️  ${keyState.label} rate limited (429). Backoff: ${backoffSeconds}s (failure #${keyState.failureCount}, until ${new Date(keyState.cooldownUntil).toLocaleTimeString()}).`);
    } else if (isServerError) {
        // Short cooldown for server errors: 15s
        keyState.lastError = 'server_error';
        keyState.cooldownUntil = Date.now() + 15000;
        console.warn(`[MeteoSran Server] 🔥 ${keyState.label} server error (${status}). Short cooldown: 15s.`);
    } else {
        // Generic error — 30s cooldown
        keyState.lastError = 'unknown';
        keyState.cooldownUntil = Date.now() + 30000;
        console.warn(`[MeteoSran Server] ⚠️  ${keyState.label} failed (unknown error). Cooldown: 30s.`);
    }
};

/**
 * Resets a key's failure count on success (so backoff resets for next failure).
 */
const markKeySuccess = (index) => {
    const keyState = geminiKeysState.at(index);
    if (!keyState) return;
    keyState.failureCount = 0;
    keyState.billingExhausted = false;
    keyState.cooldownUntil = 0;
    keyState.totalSuccess++;
    keyState.totalRequests++;
};

// Backwards-compat shim: markKeyRateLimited is kept in case anything else calls it
const markKeyRateLimited = (index) => markKeyFailed(index, '429 Too Many Requests', 429);

// ==========================================
// 1. ACCUWEATHER PROXY (Unchanged)
// ==========================================
const isLocalIp = (ip) => {
    if (!ip) return true;
    const cleanIp = ip.toLowerCase().trim();
    if (cleanIp === '::1' || cleanIp === '127.0.0.1' || cleanIp.includes('localhost') || cleanIp.includes('127.0.0.1')) {
        return true;
    }
    if (cleanIp.startsWith('192.168.') || cleanIp.startsWith('10.') || cleanIp.startsWith('::ffff:127.0.0.1') || cleanIp.startsWith('::ffff:192.168.') || cleanIp.startsWith('::ffff:10.')) {
        return true;
    }
    if (cleanIp.startsWith('172.')) {
        const parts = cleanIp.split('.');
        if (parts.length >= 2) {
            const secondOctet = parseInt(parts[1], 10);
            if (secondOctet >= 16 && secondOctet <= 31) {
                return true;
            }
        }
    }
    return false;
};

const mapOpenWeather25ToSchema = (currentData, forecastData, locationLabel) => {
    const uv = currentData.uvi || 0; 
    let uvText = "Faible";
    if (uv >= 11) uvText = "Extrême";
    else if (uv >= 8) uvText = "Très fort";
    else if (uv >= 6) uvText = "Fort";
    else if (uv >= 3) uvText = "Modéré";

    const hasPrecip = !!(currentData.rain || currentData.snow);
    const precipType = currentData.rain ? "Rain" : (currentData.snow ? "Snow" : null);
    const precipMm = (currentData.rain && (currentData.rain['1h'] || currentData.rain['3h'])) ||
                     (currentData.snow && (currentData.snow['1h'] || currentData.snow['3h'])) || 0;

    const weatherDesc = currentData.weather[0].description;
    const capitalizedWeatherDesc = weatherDesc.charAt(0).toUpperCase() + weatherDesc.slice(1);
    const iconUrl = `https://openweathermap.org/img/wn/${currentData.weather[0].icon}@2x.png`;

    const isDayTime = currentData.dt >= currentData.sys.sunrise && currentData.dt <= currentData.sys.sunset;

    // Group 3-hourly forecast by day
    const dayGroups = new Map();
    forecastData.list.forEach(item => {
        const dateObj = new Date(item.dt * 1000);
        const dateStr = dateObj.toISOString().split('T')[0];
        
        if (!dayGroups.has(dateStr)) {
            dayGroups.set(dateStr, []);
        }
        dayGroups.get(dateStr).push(item);
    });

    const daysFr = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const forecast = Array.from(dayGroups.keys()).slice(0, 6).map(dateStr => {
        const items = dayGroups.get(dateStr);
        const dateObj = new Date(dateStr);
        const dayOfWeek = daysFr[dateObj.getDay()];

        let minTemp = Infinity;
        let maxTemp = -Infinity;
        let sumTemp = 0;
        let maxPop = 0;
        let sumPrecip = 0;

        let midItem = items[0];
        let minDiff = Infinity;
        items.forEach(item => {
            if (item.main.temp_min < minTemp) minTemp = item.main.temp_min;
            if (item.main.temp_max > maxTemp) maxTemp = item.main.temp_max;
            sumTemp += item.main.temp;
            if (item.pop > maxPop) maxPop = item.pop;
            
            const itemPrecip = (item.rain && (item.rain['3h'] || item.rain['1h'])) ||
                               (item.snow && (item.snow['3h'] || item.snow['1h'])) || 0;
            sumPrecip += itemPrecip;

            const timeStr = item.dt_txt.split(' ')[1];
            const hour = parseInt(timeStr.split(':')[0], 10);
            const diff = Math.abs(hour - 12);
            if (diff < minDiff) {
                minDiff = diff;
                midItem = item;
            }
        });

        const avgTemp = sumTemp / items.length;
        const condText = midItem.weather[0].description;
        const capitalizedCondText = condText.charAt(0).toUpperCase() + condText.slice(1);
        const fdIcon = `https://openweathermap.org/img/wn/${midItem.weather[0].icon}@2x.png`;

        return {
            date: dateStr,
            dayOfWeek: dayOfWeek,
            temp: parseFloat(avgTemp.toFixed(1)),
            maxTemp: parseFloat(maxTemp.toFixed(1)),
            minTemp: parseFloat(minTemp.toFixed(1)),
            conditionText: capitalizedCondText,
            iconUrl: fdIcon,
            precip_mm: parseFloat(sumPrecip.toFixed(1)),
            chanceOfRain: Math.round(maxPop * 100)
        };
    });

    const degToCompass = (num) => {
        const val = Math.floor((num / 22.5) + 0.5);
        const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
        return arr.at(val % 16);
    };

    return {
        location: locationLabel,
        temperature: currentData.main.temp,
        unit: "C",
        weatherText: capitalizedWeatherDesc,
        hasPrecipitation: hasPrecip,
        isDayTime: isDayTime,
        weatherIcon: 1,
        iconUrl: iconUrl,
        relativeHumidity: currentData.main.humidity,
        wind: {
            speed: parseFloat((currentData.wind.speed * 3.6).toFixed(1)),
            unit: "km/h",
            direction: degToCompass(currentData.wind.deg),
        },
        pressure: {
            value: currentData.main.pressure,
            unit: "mb",
        },
        realFeelTemperature: {
            value: currentData.main.feels_like,
            unit: "C",
        },
        uvIndex: uv,
        uvIndexText: uvText,
        precipitationType: precipType,
        precip_mm: parseFloat(precipMm.toFixed(1)),
        forecast: forecast
    };
};

app.get('/api/weather/current', async (req, res) => {
    const WEATHERAPI_KEY = process.env.WEATHERAPI_API_KEY || process.env.WEATHERAPI_KEY || '029386abbd2e4300b3920520262005';
    
    if (OPENWEATHER_API_KEY) {
        try {
            let lat = null;
            let lon = null;
            let locationLabel = '';

            if (req.query.fixed) {
                lat = 5.3453;
                lon = -4.0244;
                locationLabel = "Abidjan, Côte d'Ivoire";
            } else if (req.query.lat && req.query.lon) {
                lat = parseFloat(req.query.lat);
                lon = parseFloat(req.query.lon);
                locationLabel = `Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
            } else {
                const ip = req.get('x-forwarded-for')?.split(',')[0] || req.connection.remoteAddress;
                if (ip && !isLocalIp(ip)) {
                    try {
                        const ipGeoResp = await fetch(`http://ip-api.com/json/${ip}`);
                        if (ipGeoResp.ok) {
                            const ipGeoData = await ipGeoResp.json();
                            if (ipGeoData && ipGeoData.status === 'success') {
                                lat = ipGeoData.lat;
                                lon = ipGeoData.lon;
                                locationLabel = `${ipGeoData.city}, ${ipGeoData.country}`;
                            }
                        }
                    } catch (e) {
                        console.warn("[MeteoSran Server] IP Geolocation failed, using default Abidjan coordinates.", e.message);
                    }
                }
                
                if (!lat || !lon) {
                    lat = 5.3453;
                    lon = -4.0244;
                    locationLabel = "Abidjan, Côte d'Ivoire";
                }
            }

            if (req.query.lat && req.query.lon) {
                try {
                    const geoUrl = `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OPENWEATHER_API_KEY}`;
                    const geoResp = await fetch(geoUrl);
                    if (geoResp.ok) {
                        const geoData = await geoResp.json();
                        if (geoData && geoData.length > 0) {
                             const g = geoData[0];
                             let countryName = g.country;
                             try {
                                 const regionNames = new Intl.DisplayNames(['fr'], {type: 'region'});
                                 countryName = regionNames.of(g.country) || g.country;
                             } catch (intlErr) {}
                             locationLabel = g.name + (g.state ? `, ${g.state}` : '') + `, ${countryName}`;
                        }
                    }
                } catch (e) {
                    console.warn("[MeteoSran Server] OpenWeather reverse geocode failed.", e.message);
                }
            }

            console.log(`[MeteoSran Server] Querying OpenWeather 2.5 APIs for: ${lat}, ${lon}`);
            const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=fr&appid=${OPENWEATHER_API_KEY}`;
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=fr&appid=${OPENWEATHER_API_KEY}`;

            const [wRes, fRes] = await Promise.all([fetch(weatherUrl), fetch(forecastUrl)]);
            if (!wRes.ok || !fRes.ok) {
                throw new Error(`OpenWeather endpoints returned bad status: weather ${wRes.status}, forecast ${fRes.status}`);
            }

            const wData = await wRes.json();
            const fData = await fRes.json();

            const mappedData = mapOpenWeather25ToSchema(wData, fData, locationLabel);
            return res.json(mappedData);

        } catch (owError) {
            console.error("[MeteoSran Server] OpenWeather failed, falling back to WeatherAPI proxy...", owError.message);
        }
    }

    let query = '';

    if (req.query.fixed) {
        query = 'Abidjan';
    } else if (req.query.lat && req.query.lon) {
        query = `${req.query.lat},${req.query.lon}`;
    } else {
        const ip = req.get('x-forwarded-for')?.split(',')[0] || req.connection.remoteAddress;
        if (ip && !isLocalIp(ip)) {
            query = ip;
        } else {
            query = 'Abidjan';
        }
    }

    try {
        console.log(`[MeteoSran Server] Querying WeatherAPI for: ${query}`);
        let response = await fetch(`http://api.weatherapi.com/v1/forecast.json?key=${WEATHERAPI_KEY}&q=${encodeURIComponent(query)}&days=6&lang=fr&aqi=no&alerts=no`);
        
        if (!response.ok && query !== 'Abidjan') {
            console.warn(`[MeteoSran Server] WeatherAPI failed for query "${query}". Retrying with default "Abidjan"...`);
            query = 'Abidjan';
            response = await fetch(`http://api.weatherapi.com/v1/forecast.json?key=${WEATHERAPI_KEY}&q=${encodeURIComponent(query)}&days=6&lang=fr&aqi=no&alerts=no`);
        }

        if (!response.ok) {
            throw new Error(`WeatherAPI returned status ${response.status}`);
        }

        const data = await response.json();
        
        const uv = data.current.uv;
        let uvText = "Faible";
        if (uv >= 11) uvText = "Extrême";
        else if (uv >= 8) uvText = "Très fort";
        else if (uv >= 6) uvText = "Fort";
        else if (uv >= 3) uvText = "Modéré";

        const locationLabel = `${data.location.name}, ${data.location.country}`;
        const iconUrl = data.current.condition.icon.startsWith('http') 
            ? data.current.condition.icon 
            : `https:${data.current.condition.icon}`;

        // Map forecast days
        const forecast = data.forecast.forecastday.map(fd => {
            const dateObj = new Date(fd.date);
            const daysFr = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
            const dayOfWeek = daysFr[dateObj.getDay()];
            const fdIcon = fd.day.condition.icon.startsWith('http') 
                ? fd.day.condition.icon 
                : `https:${fd.day.condition.icon}`;
            return {
                date: fd.date,
                dayOfWeek: dayOfWeek,
                temp: fd.day.avgtemp_c,
                maxTemp: fd.day.maxtemp_c,
                minTemp: fd.day.mintemp_c,
                conditionText: fd.day.condition.text,
                iconUrl: fdIcon,
                precip_mm: fd.day.totalprecip_mm,
                chanceOfRain: fd.day.daily_chance_of_rain
            };
        });

        return res.json({
            location: locationLabel,
            temperature: data.current.temp_c,
            unit: "C",
            weatherText: data.current.condition.text,
            hasPrecipitation: data.current.precip_mm > 0,
            isDayTime: data.current.is_day === 1,
            weatherIcon: 1, // Fallback placeholder index
            iconUrl: iconUrl,
            relativeHumidity: data.current.humidity,
            wind: {
                speed: data.current.wind_kph,
                unit: "km/h",
                direction: data.current.wind_dir,
            },
            pressure: {
                value: data.current.pressure_mb,
                unit: "mb",
            },
            realFeelTemperature: {
                value: data.current.feelslike_c,
                unit: "C",
            },
            uvIndex: uv,
            uvIndexText: uvText,
            precipitationType: data.current.precip_mm > 0 ? "Rain" : null,
            precip_mm: data.current.precip_mm,
            forecast: forecast
        });

    } catch (weatherApiError) {
        console.warn("[MeteoSran Server] WeatherAPI fetch failed, falling back to AccuWeather proxy...", weatherApiError.message);
        
        let lat, lon, locationKey, locationLabel;

        if (req.query.fixed) {
            locationKey = ABIDJAN_LOCATION_KEY;
            locationLabel = "Abidjan, Ivory Coast";
        } else {
            if (req.query.lat && req.query.lon) {
                lat = req.query.lat;
                lon = req.query.lon;
                try {
                    const isNewKey = ACCUWEATHER_API_KEY.startsWith('zpka_');
                    const authHeader = isNewKey ? { 'Authorization': `Bearer ${ACCUWEATHER_API_KEY}` } : {};
                    const geoUrl = isNewKey
                        ? `https://dataservice.accuweather.com/locations/v1/cities/geoposition/search?q=${lat},${lon}`
                        : `http://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${ACCUWEATHER_API_KEY}&q=${lat},${lon}`;

                    const geoResp = await fetch(geoUrl, { headers: authHeader });
                    if (geoResp.ok) {
                        const geoData = await geoResp.json();
                        if (geoData && geoData.Key) {
                            locationKey = geoData.Key;
                            locationLabel = geoData.LocalizedName + (geoData.AdministrativeArea ? ', ' + geoData.AdministrativeArea.LocalizedName : '') + (geoData.Country ? ', ' + geoData.Country.LocalizedName : '');
                        }
                    }
                } catch (e) { }
            }

            if (!locationKey) {
                try {
                    const ip = req.get('x-forwarded-for')?.split(',')[0] || req.connection.remoteAddress;
                    const ipGeoResp = await fetch(`http://ip-api.com/json/${ip}`);
                    if (ipGeoResp.ok) {
                        const ipGeoData = await ipGeoResp.json();
                        if (ipGeoData && ipGeoData.status === 'success') {
                            lat = ipGeoData.lat;
                            lon = ipGeoData.lon;
                            const isNewKey = ACCUWEATHER_API_KEY.startsWith('zpka_');
                            const authHeader = isNewKey ? { 'Authorization': `Bearer ${ACCUWEATHER_API_KEY}` } : {};
                            const geoUrl = isNewKey
                                ? `https://dataservice.accuweather.com/locations/v1/cities/geoposition/search?q=${lat},${lon}`
                                : `http://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${ACCUWEATHER_API_KEY}&q=${lat},${lon}`;

                            const geoResp = await fetch(geoUrl, { headers: authHeader });
                            if (geoResp.ok) {
                                const geoData = await geoResp.json();
                                if (geoData && geoData.Key) {
                                    locationKey = geoData.Key;
                                    locationLabel = geoData.LocalizedName + (geoData.AdministrativeArea ? ', ' + geoData.AdministrativeArea.LocalizedName : '') + (geoData.Country ? ', ' + geoData.Country.LocalizedName : '');
                                }
                            }
                        }
                    }
                } catch (e) { }
            }

            if (!locationKey) {
                locationKey = ABIDJAN_LOCATION_KEY;
                locationLabel = "Abidjan, Ivory Coast";
            }
        }

        const isNewKey = ACCUWEATHER_API_KEY.startsWith('zpka_');
        const authHeader = isNewKey ? { 'Authorization': `Bearer ${ACCUWEATHER_API_KEY}` } : {};
        const accuweatherUrl = isNewKey
            ? `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?details=true&metric=true`
            : `http://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${ACCUWEATHER_API_KEY}&details=true&metric=true`;

        try {
            const response = await fetch(accuweatherUrl, { headers: authHeader });
            if (!response.ok) {
                console.log("[MeteoSran Server Fallback] AccuWeather API error, returning mock data.");
                return res.json({
                    location: locationLabel || "Abidjan, Ivory Coast (Mocked)",
                    temperature: 28.5, unit: "C", weatherText: "Partly sunny",
                    hasPrecipitation: false, isDayTime: true, weatherIcon: 3,
                    relativeHumidity: 78,
                    wind: { speed: 15.2, unit: "km/h", direction: "SW" },
                    pressure: { value: 1012, unit: "mb" },
                    realFeelTemperature: { value: 32.1, unit: "C" },
                    uvIndex: 6, uvIndexText: "High", precipitationType: null,
                });
            }
            const data = await response.json();
            if (data && data.length > 0) {
                const currentConditions = data[0];
                return res.json({
                    location: locationLabel,
                    temperature: currentConditions.Temperature.Metric.Value,
                    unit: currentConditions.Temperature.Metric.Unit,
                    weatherText: currentConditions.WeatherText,
                    hasPrecipitation: currentConditions.HasPrecipitation,
                    isDayTime: currentConditions.IsDayTime,
                    weatherIcon: currentConditions.WeatherIcon,
                    relativeHumidity: currentConditions.RelativeHumidity,
                    wind: {
                        speed: currentConditions.Wind.Speed.Metric.Value,
                        unit: currentConditions.Wind.Speed.Metric.Unit,
                        direction: currentConditions.Wind.Direction.Localized,
                    },
                    pressure: {
                        value: currentConditions.Pressure.Metric.Value,
                        unit: currentConditions.Pressure.Metric.Unit,
                    },
                    realFeelTemperature: {
                        value: currentConditions.RealFeelTemperature.Metric.Value,
                        unit: currentConditions.RealFeelTemperature.Metric.Unit,
                    },
                    uvIndex: currentConditions.UVIndex,
                    uvIndexText: currentConditions.UVIndexText,
                    precipitationType: currentConditions.PrecipitationType,
                });
            } else {
                return res.json({
                    location: locationLabel || "Abidjan, Ivory Coast (Mocked)",
                    temperature: 28.5, unit: "C", weatherText: "Partly sunny",
                    hasPrecipitation: false, isDayTime: true, weatherIcon: 3,
                    relativeHumidity: 78,
                    wind: { speed: 15.2, unit: "km/h", direction: "SW" },
                    pressure: { value: 1012, unit: "mb" },
                    realFeelTemperature: { value: 32.1, unit: "C" },
                    uvIndex: 6, uvIndexText: "High", precipitationType: null,
                });
            }
        } catch (error) {
            console.log("[MeteoSran Server Fallback] AccuWeather catch error, returning mock data.");
            return res.json({
                location: locationLabel || "Abidjan, Ivory Coast (Mocked)",
                temperature: 28.5, unit: "C", weatherText: "Partly sunny",
                hasPrecipitation: false, isDayTime: true, weatherIcon: 3,
                relativeHumidity: 78,
                wind: { speed: 15.2, unit: "km/h", direction: "SW" },
                pressure: { value: 1012, unit: "mb" },
                realFeelTemperature: { value: 32.1, unit: "C" },
                uvIndex: 6, uvIndexText: "High", precipitationType: null,
            });
        }
    }
});

// ==========================================
// 2. SECURE GEMINI AI PROXY (Refactored)
// ==========================================

const executeUpdateUserMemory = async (userId, args) => {
    if (!userId) {
        console.log(`[MeteoSran Server] Skipping memory update: No userId provided.`);
        return true;
    }
    try {
        console.log(`[MeteoSran Server] Updating memory for user ${userId}:`, args);
        let userMemory = await withRetry(() => prisma.userGlobalMemory.findUnique({
            where: { userId }
        }));

        let memoryObj = {
            preferences: {},
            sensitivities: [],
            locations: [],
            routines: [],
            general_facts: []
        };

        if (userMemory && userMemory.memory) {
            try {
                memoryObj = typeof userMemory.memory === 'string'
                    ? JSON.parse(userMemory.memory)
                    : userMemory.memory;
            } catch (parseErr) {
                console.warn("[MeteoSran Server] Error parsing memory JSON, resetting:", parseErr);
            }
        }

        // Initialize missing arrays/objects
        if (!memoryObj.preferences) memoryObj.preferences = {};
        if (!Array.isArray(memoryObj.sensitivities)) memoryObj.sensitivities = [];
        if (!Array.isArray(memoryObj.locations)) memoryObj.locations = [];
        if (!Array.isArray(memoryObj.routines)) memoryObj.routines = [];
        if (!Array.isArray(memoryObj.general_facts)) memoryObj.general_facts = [];

        // Apply updates
        if (args.preference) {
            const pref = args.preference.toLowerCase();
            if (pref.includes('celsius')) memoryObj.preferences.units = 'celsius';
            else if (pref.includes('fahrenheit')) memoryObj.preferences.units = 'fahrenheit';
            
            if (pref.includes('concise') || pref.includes('court')) memoryObj.preferences.tone = 'concise';
            else if (pref.includes('enthusiastic') || pref.includes('enthousiaste')) memoryObj.preferences.tone = 'enthusiastic';
            else if (pref.includes('scientific') || pref.includes('science') || pref.includes('detail')) memoryObj.preferences.tone = 'scientific';

            if (pref.includes('high') || pref.includes('technical') || pref.includes('einstein') || pref.includes('détail')) memoryObj.preferences.technicalDepth = 'high';
            else if (pref.includes('low') || pref.includes('simple') || pref.includes('vulgar')) memoryObj.preferences.technicalDepth = 'low';
        }

        if (args.sensitivity) {
            const sens = args.sensitivity.trim();
            if (sens && !memoryObj.sensitivities.some(s => s.toLowerCase() === sens.toLowerCase())) {
                memoryObj.sensitivities.push(sens);
            }
        }

        if (args.new_location) {
            const loc = args.new_location.trim();
            if (loc) {
                const exists = memoryObj.locations.some(l => l.name.toLowerCase() === loc.toLowerCase());
                if (!exists) {
                    memoryObj.locations.push({ name: loc, type: 'secondary' });
                }
            }
        }

        if (args.routine) {
            const rout = args.routine.trim();
            if (rout && !memoryObj.routines.some(r => r.toLowerCase() === rout.toLowerCase())) {
                memoryObj.routines.push(rout);
            }
        }

        if (args.general_fact) {
            const fact = args.general_fact.trim();
            if (fact && !memoryObj.general_facts.some(f => f.toLowerCase() === fact.toLowerCase())) {
                memoryObj.general_facts.push(fact);
            }
        }

        await withRetry(() => prisma.userGlobalMemory.upsert({
            where: { userId },
            update: { memory: memoryObj },
            create: { userId, memory: memoryObj }
        }));

        console.log(`[MeteoSran Server] Global memory updated successfully for ${userId}`);
        return true;
    } catch (dbErr) {
        console.error(`[MeteoSran Server] Error executing memory update:`, dbErr);
        return false;
    }
};

const hydratePromptWithMemory = (lastUserPrompt, memory) => {
    if (!memory) return '';

    const query = lastUserPrompt ? lastUserPrompt.toLowerCase() : '';
    const hydratedParts = [];

    // Always Inject Units, Tone, and Sensitivities
    if (memory.preferences?.units) {
        hydratedParts.push(`- Temperature Unit Preference: ${memory.preferences.units}`);
    }
    if (memory.preferences?.tone) {
        hydratedParts.push(`- Preferred Tone/Style: ${memory.preferences.tone}`);
    }
    if (Array.isArray(memory.sensitivities) && memory.sensitivities.length > 0) {
        hydratedParts.push(`- Physical Sensitivities & Weather Aversions: ${memory.sensitivities.join(', ')}`);
    }

    // Conditionally Inject Locations
    const hasLocationTrigger = query.includes('travel') || query.includes('trip') || query.includes('visit') || 
                               query.includes('fly') || query.includes('go to') || query.includes('aller a') || 
                               query.includes('voyage') || query.includes('visite') || query.includes('temps a') || 
                               query.includes('meteo a') || query.includes('weather in') || query.includes('weather at') ||
                               (Array.isArray(memory.locations) && memory.locations.some(l => query.includes(l.name.toLowerCase())));
                               
    if (hasLocationTrigger && Array.isArray(memory.locations) && memory.locations.length > 0) {
        const locList = memory.locations.map(l => `${l.name} (${l.type})`).join(', ');
        hydratedParts.push(`- Secondary Locations of Interest: ${locList}`);
    }

    // Conditionally Inject Routines
    const hasRoutineTrigger = query.includes('routine') || query.includes('commute') || query.includes('schedule') || 
                              query.includes('time') || query.includes('morning') || query.includes('evening') || 
                              query.includes('afternoon') || query.includes('run') || query.includes('jog') || 
                              query.includes('workout') || query.includes('job') || query.includes('habit') || 
                              query.includes('travail') || query.includes('sport') || query.includes('planning') || 
                              query.includes('heure');

    if (hasRoutineTrigger && Array.isArray(memory.routines) && memory.routines.length > 0) {
        hydratedParts.push(`- Daily/Weekly Routines & Activities: ${memory.routines.join(', ')}`);
    }

    // Conditionally Inject Technical Depth
    const hasTechTrigger = query.includes('solar') || query.includes('sunspot') || query.includes('geomagnetic') || 
                           query.includes('aurora') || query.includes('moon') || query.includes('lunar') || 
                           query.includes('phase') || query.includes('eclipse') || query.includes('uv') || 
                           query.includes('ultraviolet') || query.includes('science') || query.includes('how does') || 
                           query.includes('why') || query.includes('dew point') || query.includes('humidity') || 
                           query.includes('pressure') || query.includes('baro') || query.includes('tempete solaire') || 
                           query.includes('comment fonctionne') || query.includes('pourquoi');

    if (hasTechTrigger && memory.preferences?.technicalDepth) {
        hydratedParts.push(`- Preferred Technical/Scientific Depth: ${memory.preferences.technicalDepth === 'high' ? 'High/Einstein style detail' : 'Low/Simple explanations'}`);
    }
    if (hasTechTrigger && Array.isArray(memory.general_facts) && memory.general_facts.length > 0) {
        hydratedParts.push(`- User General Facts (useful for framing technical concepts): ${memory.general_facts.join(', ')}`);
    }

    if (hydratedParts.length === 0) return '';

    return `\n\n[USER GLOBAL LONG-TERM MEMORY (RELEVANT FRAGMENTS)]
${hydratedParts.join('\n')}

[MEMORY USAGE RULES]:
- Silently honor these facts. Do not ask the user for details already known.
- Never state "According to my memory" or make references to this memory block's existence. Seamlessly apply it.`;
};

app.post('/api/ai/chat', async (req, res) => {
    try {
        const { contents, mode, systemInstruction, userId } = req.body;

        if (!contents || !Array.isArray(contents)) {
            return res.status(400).json({ error: "Invalid contents format received from frontend." });
        }

        // SERVER-SIDE SAFETY NET: Strip inlineData from all but the last user message
        const lastUserIdx = contents.reduce((last, c, i) => c.role === 'user' ? i : last, -1);
        const sanitizedContents = contents.map((msg, idx) => {
            if (idx === lastUserIdx) return msg; 
            if (!msg.parts || !Array.isArray(msg.parts)) return msg;

            const hasInlineData = msg.parts.some(p => p.inlineData);
            if (!hasInlineData) return msg;

            return {
                ...msg,
                parts: msg.parts.filter(p => !p.inlineData)
            };
        });

        const SUPPORTED_MODELS = [
            'gemini-2.5-flash-preview-05-20',
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-2.0-flash-lite',
            'gemini-1.5-flash',
        ];

        let rateLimitError = null;
        let lastError = null;
        const modeKey = mode ? mode.toLowerCase() : 'default';
        const generationTemperature = modeKey === 'funny' ? 0.9 : (modeKey === 'einstein' ? 0.6 : 0.7);

        // Load and hydrate User Global Memory
        let hydratedMemoryBlock = '';
        if (userId) {
            try {
                const userMemory = await withRetry(() => prisma.userGlobalMemory.findUnique({
                    where: { userId }
                }));
                if (userMemory && userMemory.memory) {
                    const lastUserMessage = contents.slice(-1)[0];
                    const lastUserText = lastUserMessage?.parts?.[0]?.text || '';
                    const parsedMemory = typeof userMemory.memory === 'string'
                        ? JSON.parse(userMemory.memory)
                        : userMemory.memory;
                    hydratedMemoryBlock = hydratePromptWithMemory(lastUserText, parsedMemory);
                }
            } catch (err) {
                console.error("[MeteoSran Server] Error loading user memory:", err);
            }
        }

        const finalSystemInstruction = (systemInstruction || "You are MeteoSran.") + hydratedMemoryBlock;

        const memoryTools = [{
            functionDeclarations: [
                {
                    name: "update_user_memory",
                    description: "Updates or adds new facts, preferences, sensitivities, locations, or routines about the user to their long-term global memory. Call this silently whenever the user mentions such details. Do NOT explain that you are calling this tool.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            new_location: { type: "STRING", description: "A city, country, or location the user mentioned interest in, travel plans to, or resides in." },
                            sensitivity: { type: "STRING", description: "Any weather-related physical sensitivity, allergy, or aversion (e.g. 'cold', 'pollen allergies', 'extreme heat')." },
                            preference: { type: "STRING", description: "A preferred setting, metric, or style (e.g. 'celsius', 'fahrenheit', 'concise replies', 'high technical depth')." },
                            routine: { type: "STRING", description: "A daily, weekly, or monthly schedule or routine (e.g. 'runs at 6 AM', 'commutes at 8 AM')." },
                            general_fact: { type: "STRING", description: "Any other general biographical fact the user shared (e.g. 'is a software engineer', 'is planning a wedding')." }
                        }
                    }
                }
            ]
        }];

        // Internal loop for model fallback and stateful key rotation
        for (const modelName of SUPPORTED_MODELS) {
            const maxKeyAttempts = geminiKeysState.length;
            let keyAttempts = 0;

            while (keyAttempts < maxKeyAttempts) {
                const keyInfo = getNextAvailableKey();
                if (!keyInfo) break;

                const { key: currentKey, index: keyIdx } = keyInfo;
                // ksLabel must be declared HERE (outside try) so catch can access it
                const ksLabel = geminiKeysState.at(keyIdx)?.label || `Key ${keyIdx + 1}`;
                keyAttempts++;
                const genAIInstance = new GoogleGenAI({ apiKey: currentKey, vertexai: false });

                try {
                    console.log(`[MeteoSran Server] 🔄 Attempting: ${modelName} (${ksLabel}/${geminiKeysState.length} keys)`);

                    let loopCount = 0;
                    const MAX_LOOPS = 3;
                    let currentContents = [...sanitizedContents];
                    let responseText = null;

                    while (loopCount < MAX_LOOPS) {
                        const response = await genAIInstance.models.generateContent({
                            model: modelName,
                            contents: currentContents,
                            config: {
                                systemInstruction: finalSystemInstruction,
                                temperature: generationTemperature,
                                topP: 0.95,
                                topK: 40,
                                tools: memoryTools,
                                safetySettings: [
                                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
                                ]
                            }
                        });

                        const functionCalls = response.functionCalls || [];
                        if (functionCalls.length === 0) {
                            responseText = response.text;
                            break;
                        }

                        console.log(`[MeteoSran Server] Model requested function calls:`, functionCalls);

                        // Add model's tool calls to currentContents
                        currentContents.push({
                            role: 'model',
                            parts: functionCalls.map(fc => ({
                                functionCall: {
                                    name: fc.name,
                                    args: fc.args
                                }
                            }))
                        });

                        // Execute the functions
                        const responseParts = [];
                        for (const fc of functionCalls) {
                            if (fc.name === 'update_user_memory') {
                                const successUpdate = await executeUpdateUserMemory(userId, fc.args);
                                responseParts.push({
                                    functionResponse: {
                                        name: fc.name,
                                        response: { status: successUpdate ? "success" : "failed" }
                                    }
                                });
                            } else {
                                responseParts.push({
                                    functionResponse: {
                                        name: fc.name,
                                        response: { error: "Unknown function" }
                                    }
                                });
                            }
                        }

                        // Add tool responses to currentContents
                        currentContents.push({
                            role: 'user',
                            parts: responseParts
                        });

                        loopCount++;
                    }

                    if (!responseText) throw new Error("Received empty response or exceeded max loops during tool calling.");

                    markKeySuccess(keyIdx);
                    return res.json({ text: responseText });

                } catch (err) {
                    const errStatus = err.status || null;
                    const errMsg = err.message || '';
                    console.warn(`[MeteoSran Server] ❌ ${modelName} (${ksLabel}) failed [${errStatus}]: ${errMsg.slice(0, 120)}`);
                    lastError = err;

                    const isQuotaOrBilling = errStatus === 429 || errStatus === 403 ||
                        errMsg.includes('429') || errMsg.includes('quota') ||
                        errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('prepayment') ||
                        errMsg.includes('credits');

                    if (isQuotaOrBilling) {
                        rateLimitError = err;
                        markKeyFailed(keyIdx, errMsg, errStatus);
                        continue; // try next key
                    }
                    // Non-quota errors: still track failure but break model attempts
                    markKeyFailed(keyIdx, errMsg, errStatus);
                    break;
                }
            }
        }

        throw rateLimitError || lastError || new Error("All AI models failed to respond.");

    } catch (error) {
        console.error('[MeteoSran Server] AI Proxy Error:', error);
        res.status(error.status || 500).json({
            error: error.message || "Failed to generate AI response",
            status: error.status
        });
    }
});

// Smart chat titling endpoint
app.post('/api/ai/title', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: "Text is required to generate a title." });
        }

        // We instruct Gemini to be extremely brief, maximum 3-4 words.
        // It should match the language of the message (French/English usually).
        const prompt = `Based on the following first message from a user in a weather chat assistant, generate a super concise, short title (maximum 3 to 4 words). Do not use quotes, punctuation, or explanations. Respond with ONLY the title itself.
User message: "${text}"`;

        const SUPPORTED_MODELS = [
            'gemini-2.5-flash-preview-05-20',
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-2.0-flash-lite',
            'gemini-1.5-flash',
        ];

        let rateLimitError = null;
        let lastError = null;

        for (const modelName of SUPPORTED_MODELS) {
            const maxKeyAttempts = geminiKeysState.length;
            let keyAttempts = 0;

            while (keyAttempts < maxKeyAttempts) {
                const keyInfo = getNextAvailableKey();
                if (!keyInfo) break;

                const { key: currentKey, index: keyIdx } = keyInfo;
                keyAttempts++;
                const genAIInstance = new GoogleGenAI({ apiKey: currentKey, vertexai: false });

                try {
                    console.log(`[MeteoSran Server] Smart Title: Attempting with model: ${modelName} (Key ${keyIdx + 1}/${geminiKeysState.length})`);

                    const response = await genAIInstance.models.generateContent({
                        model: modelName,
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        config: {
                            temperature: 0.5,
                            maxOutputTokens: 20,
                            safetySettings: [
                                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
                            ]
                        }
                    });

                    let title = response.text ? response.text.trim() : null;
                    if (title) {
                        // Strip quotes if Gemini wrapped the response in quotes
                        title = title.replace(/^["']|["']$/g, '').trim();
                        markKeySuccess(keyIdx);
                        return res.json({ title });
                    }
                } catch (err) {
                    const errStatus = err.status || null;
                    const errMsg = err.message || '';
                    console.warn(`[MeteoSran Server] Smart Title: ${modelName} (Key ${keyIdx + 1}) failed [${errStatus}]: ${errMsg.slice(0, 80)}`);
                    lastError = err;

                    const isQuotaOrBilling = errStatus === 429 || errStatus === 403 ||
                        errMsg.includes('429') || errMsg.includes('quota') ||
                        errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('prepayment') ||
                        errMsg.includes('credits');

                    if (isQuotaOrBilling) {
                        rateLimitError = err;
                        markKeyFailed(keyIdx, errMsg, errStatus);
                        continue;
                    }
                    markKeyFailed(keyIdx, errMsg, errStatus);
                    break;
                }
            }
        }

        throw rateLimitError || lastError || new Error("Failed to generate title with all models and keys.");

    } catch (error) {
        console.error('[MeteoSran Server] AI Title Error:', error);
        res.status(error.status || 500).json({
            error: error.message || "Failed to generate AI title",
            status: error.status
        });
    }
});

// ─────────────────────────────────────────────────────────────────
// Memory Summarization Endpoint
// ─────────────────────────────────────────────────────────────────
app.post('/api/ai/memory', async (req, res) => {
    try {
        const { transcript, existingSummary } = req.body;
        if (!transcript) return res.status(400).json({ error: 'Missing transcript' });

        const MEMORY_SYSTEM_PROMPT = `You are a memory extraction system for MeteoSran, an AI weather assistant.
Your ONLY job is to read a conversation transcript and produce a compact, structured memory summary.
This summary will be injected into future conversations so the AI remembers key facts about the user.

Output EXACTLY this structure (fill in only what is present, omit empty sections):
PREFERENCES: [units preference, communication style, topics of interest, dislikes]
TOPICS_DISCUSSED: [list of weather topics already covered]
LOCATION: [cities/regions the user mentioned or asked about]
USER_CONTEXT: [occupation, planned events, reason for asking, personal details]
OUTSTANDING_QUESTIONS: [things the user wanted to know but weren't fully resolved]
LAST_DISCUSSED: [1-sentence summary of the most recent exchange]

Rules:
- Be extremely concise. Each section: max 1 line, max 20 words.
- Merge with the EXISTING SUMMARY if provided — don't lose old facts.
- NEVER invent facts not present in the transcript.
- Output ONLY the structured memory block. No preamble, no explanation.`;

        const memoryModels = [
            'gemini-2.5-flash-preview-05-20',
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-2.0-flash-lite',
            'gemini-1.5-flash',
        ];
        let rateLimitError = null;
        let lastError = null;

        const existingBlock = existingSummary
            ? `\n\nEXISTING SUMMARY TO MERGE INTO:\n${existingSummary}`
            : '';

        const userContent = `CONVERSATION TRANSCRIPT:\n${transcript}${existingBlock}\n\nProduce the updated memory summary now:`;

        for (const modelName of memoryModels) {
            const maxKeyAttempts = geminiKeysState.length;
            let keyAttempts = 0;

            while (keyAttempts < maxKeyAttempts) {
                const keyInfo = getNextAvailableKey();
                if (!keyInfo) break;

                const { key: currentKey, index: keyIdx } = keyInfo;
                keyAttempts++;
                const genAIInstance = new GoogleGenAI({ apiKey: currentKey, vertexai: false });

                try {
                    const response = await genAIInstance.models.generateContent({
                        model: modelName,
                        contents: [{ role: 'user', parts: [{ text: userContent }] }],
                        config: {
                            systemInstruction: MEMORY_SYSTEM_PROMPT,
                            temperature: 0.2,
                            maxOutputTokens: 300,
                            safetySettings: [
                                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
                            ]
                        }
                    });
                    const summary = response.text?.trim();
                    if (summary) {
                        markKeySuccess(keyIdx);
                        console.log(`[MeteoSran Server] ✅ Memory summarized via ${modelName} (Key ${keyIdx + 1})`);
                        return res.json({ summary });
                    }
                } catch (err) {
                    const errStatus = err.status || null;
                    const errMsg = err.message || '';
                    lastError = err;
                    console.warn(`[MeteoSran Server] Memory Summarize: ${modelName} (Key ${keyIdx + 1}) failed [${errStatus}]: ${errMsg.slice(0, 80)}`);

                    const isQuotaOrBilling = errStatus === 429 || errStatus === 403 ||
                        errMsg.includes('429') || errMsg.includes('quota') ||
                        errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('prepayment') ||
                        errMsg.includes('credits');

                    if (isQuotaOrBilling) {
                        rateLimitError = err;
                        markKeyFailed(keyIdx, errMsg, errStatus);
                        continue;
                    }
                    markKeyFailed(keyIdx, errMsg, errStatus);
                    break;
                }
            }
        }
        throw rateLimitError || lastError || new Error('Memory summarization failed');
    } catch (error) {
        console.error('[MeteoSran Server] Memory Error:', error);
        res.status(500).json({ error: error.message || 'Failed to summarize memory' });
    }
});

// Fetch user global memory
app.get('/api/users/:userId/memory', async (req, res) => {
    try {
        const { userId } = req.params;
        const memoryRecord = await withRetry(() => prisma.userGlobalMemory.findUnique({
            where: { userId }
        }));
        if (!memoryRecord) {
            return res.json({ memory: null });
        }
        res.json({ memory: memoryRecord.memory });
    } catch (error) {
        console.error("Error fetching user memory:", error);
        res.status(500).json({ error: "Failed to fetch user memory" });
    }
});

// Update/overwrite user global memory manually
app.put('/api/users/:userId/memory', async (req, res) => {
    try {
        const { userId } = req.params;
        const { memory } = req.body;
        const memoryRecord = await withRetry(() => prisma.userGlobalMemory.upsert({
            where: { userId },
            update: { memory },
            create: { userId, memory }
        }));
        res.json({ success: true, memory: memoryRecord.memory });
    } catch (error) {
        console.error("Error updating user memory:", error);
        res.status(500).json({ error: "Failed to update user memory" });
    }
});

// Clear user global memory
app.delete('/api/users/:userId/memory', async (req, res) => {
    try {
        const { userId } = req.params;
        await withRetry(() => prisma.userGlobalMemory.delete({
            where: { userId }
        }));
        res.json({ success: true });
    } catch (error) {
        // If it doesn't exist, ignore and return success
        res.json({ success: true });
    }
});

// ==========================================
// 3. POSTGRESQL (PRISMA) DATABASE ROUTES
// ==========================================

// Create a new chat session
app.post('/api/chats', async (req, res) => {
    try {
        const { userId, title } = req.body;
        if (!userId) return res.status(400).json({ error: "Missing userId" });
        
        const chat = await withRetry(() => prisma.chatSession.create({
            data: {
                userId,
                title: title || "New Chat"
            }
        }));
        res.json(chat);
    } catch (error) {
        console.error("Error creating chat:", error);
        res.status(500).json({ error: "Failed to create chat" });
    }
});

// Search chat sessions and message contents for a user
app.get('/api/chats/:userId/search', async (req, res) => {
    try {
        const { userId } = req.params;
        const { q } = req.query;

        if (!q || !q.trim()) {
            return res.json([]);
        }

        const searchTerm = q.trim();

        const chats = await withRetry(() => prisma.chatSession.findMany({
            where: {
                userId,
                OR: [
                    { title: { contains: searchTerm, mode: 'insensitive' } },
                    {
                        messages: {
                            some: {
                                text: { contains: searchTerm, mode: 'insensitive' }
                            }
                        }
                    }
                ]
            },
            include: {
                messages: {
                    where: {
                        text: { contains: searchTerm, mode: 'insensitive' }
                    },
                    select: {
                        id: true,
                        text: true,
                        role: true,
                        timestamp: true
                    },
                    orderBy: {
                        timestamp: 'asc'
                    },
                    take: 3
                }
            },
            orderBy: [
                { isPinned: 'desc' },
                { updatedAt: 'desc' }
            ]
        }));

        res.json(chats);
    } catch (error) {
        console.error("Error searching chats:", error);
        res.status(500).json({ error: "Failed to search chats" });
    }
});

// Fetch all chat sessions for a user
app.get('/api/chats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const chats = await withRetry(() => prisma.chatSession.findMany({
            where: { userId },
            orderBy: [
                { isPinned: 'desc' },
                { updatedAt: 'desc' }
            ]
        }));
        res.json(chats);
    } catch (error) {
        console.error("Error fetching chats:", error);
        res.status(500).json({ error: "Failed to fetch chats" });
    }
});

// Update chat session (memorySummary, title, or isPinned)
app.put('/api/chats/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;
        const { memorySummary, title, isPinned } = req.body;
        
        const updateData = {};
        if (memorySummary !== undefined) updateData.memorySummary = memorySummary;
        if (title !== undefined) updateData.title = title;
        if (isPinned !== undefined) updateData.isPinned = isPinned;
        
        const chat = await withRetry(() => prisma.chatSession.update({
            where: { id: chatId },
            data: updateData
        }));
        res.json(chat);
    } catch (error) {
        console.error("Error updating chat:", error);
        res.status(500).json({ error: "Failed to update chat" });
    }
});

// Delete a chat session
app.delete('/api/chats/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;
        await withRetry(() => prisma.chatSession.delete({
            where: { id: chatId }
        }));
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting chat:", error);
        res.status(500).json({ error: "Failed to delete chat" });
    }
});

// Save a new message
app.post('/api/messages', async (req, res) => {
    try {
        const { chatId, message } = req.body;
        if (!chatId || !message) return res.status(400).json({ error: "Missing chatId or message data" });

        // Upsert instead of create to silently handle duplicate IDs (P2002)
        const newMessage = await withRetry(() => prisma.message.upsert({
            where: { id: message.id },
            update: {
                chatSessionId: chatId,
                role: message.role,
                text: message.text,
                image: message.image || null,
                alternatives: message.alternatives || null,
                currentAlternativeIndex: message.currentAlternativeIndex || null,
                timestamp: message.timestamp ? new Date(message.timestamp) : new Date()
            },
            create: {
                id: message.id,
                chatSessionId: chatId,
                role: message.role,
                text: message.text,
                image: message.image || null,
                alternatives: message.alternatives || null,
                currentAlternativeIndex: message.currentAlternativeIndex || null,
                timestamp: message.timestamp ? new Date(message.timestamp) : new Date()
            }
        }));
        
        // Update the chat session's updatedAt timestamp
        await withRetry(() => prisma.chatSession.update({
            where: { id: chatId },
            data: { updatedAt: new Date() }
        }));
        
        res.json(newMessage);
    } catch (error) {
        console.error("Error saving message:", error);
        res.status(500).json({ error: "Failed to save message" });
    }
});

// Fetch messages for a specific chat
app.get('/api/messages/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;
        const messages = await withRetry(() => prisma.message.findMany({
            where: { chatSessionId: chatId },
            orderBy: { timestamp: 'asc' }
        }));
        res.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

// Google Cloud Text-to-Speech API proxy endpoint using Gemini-TTS models
app.post('/api/tts', async (req, res) => {
    try {
        const { text, languageCode, voiceName } = req.body;
        if (!text) {
            return res.status(400).json({ error: "Missing text parameter" });
        }

        // Use the primary GEMINI_API_KEY from environment variables
        const apiKey = process.env.GEMINI_API_KEY || (typeof GEMINI_KEYS !== 'undefined' && GEMINI_KEYS.length > 0 ? GEMINI_KEYS[0] : null);
        if (!apiKey) {
            return res.status(500).json({ error: "Server API Key is not configured." });
        }

        const lang = languageCode || 'fr-FR';

        // Select speaker based on language code and options.
        // We use Leda (Female) for French, and Callirrhoe (Female) for English.
        let name = voiceName;
        if (!name) {
            if (lang.toLowerCase().startsWith('fr')) {
                name = 'Leda';
            } else {
                name = 'Callirrhoe';
            }
        }

        const googleTtsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

        const payload = {
            input: {
                text: text
            },
            voice: {
                languageCode: lang,
                name: name,
                model_name: "gemini-2.5-flash-tts"
            },
            audioConfig: {
                audioEncoding: "MP3"
            }
        };

        const response = await fetch(googleTtsUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error(`Google Cloud TTS call failed with code ${response.status}:`, errBody);
            return res.status(response.status).json({ error: "Text-to-Speech API call failed", details: errBody });
        }

        const resData = await response.json();
        if (!resData.audioContent) {
            return res.status(500).json({ error: "Invalid response from Google Text-to-Speech engine" });
        }

        res.json({ audioContent: resData.audioContent });
    } catch (err) {
        console.error("Error in /api/tts endpoint:", err);
        res.status(500).json({ error: "Internal server error during speech synthesis" });
    }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log(`[MeteoSran Server] Weather proxy server running on port ${port}`);

        // ─────────────────────────────────────────────────────────────
        // NEON KEEP-ALIVE: Ping every 4 minutes to prevent cold-starts.
        // Neon suspends after ~5 min of inactivity — this keeps it warm.
        // ─────────────────────────────────────────────────────────────
        const NEON_PING_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes

        const pingNeon = async () => {
            try {
                await prisma.$queryRaw`SELECT 1`;
                // Silent success — no console spam
            } catch (err) {
                console.warn('[MeteoSran Server] ⚠️ Neon keep-alive ping failed:', err.message);
            }
        };

        // Initial warm-up on startup
        console.log('[MeteoSran Server] 🔌 Warming up Neon database connection...');
        pingNeon().then(() => {
            console.log('[MeteoSran Server] ✅ Neon database is awake and ready.');
        });

        // Recurring ping to keep it alive
        const neonKeepAlive = setInterval(pingNeon, NEON_PING_INTERVAL_MS);
        console.log(`[MeteoSran Server] 💓 Neon keep-alive scheduled every ${NEON_PING_INTERVAL_MS / 60000} minutes.`);

        // ─────────────────────────────────────────────────────────────
        // GRACEFUL SHUTDOWN: Clean up on process termination
        // ─────────────────────────────────────────────────────────────
        const shutdown = async (signal) => {
            console.log(`\n[MeteoSran Server] ${signal} received — shutting down gracefully...`);
            clearInterval(neonKeepAlive);
            server.close(async () => {
                await prisma.$disconnect();
                console.log('[MeteoSran Server] 🔌 Neon disconnected. Goodbye!');
                process.exit(0);
            });
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT',  () => shutdown('SIGINT'));

    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`[MeteoSran Server] Port ${port} is in use, trying ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('[MeteoSran Server] Server error:', err);
        }
    });
};

startServer(PORT);