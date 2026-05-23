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
app.use(express.json());

// Keep-alive ping route
app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

// Load multiple Gemini API keys for rotation
const GEMINI_KEYS = [];
for (let i = 1; i <= 10; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key) GEMINI_KEYS.push(key);
}
// Fallback to original key if no numbered keys are found
if (GEMINI_KEYS.length === 0 && process.env.GEMINI_API_KEY) {
    GEMINI_KEYS.push(process.env.GEMINI_API_KEY);
}

if (GEMINI_KEYS.length === 0) {
    console.warn("[MeteoSran Server] Warning: No GEMINI_API_KEY found in server environment.");
} else {
    console.log(`[MeteoSran Server] Loaded ${GEMINI_KEYS.length} Gemini API keys for rotation.`);
}

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
    const dayGroups = {};
    forecastData.list.forEach(item => {
        const dateObj = new Date(item.dt * 1000);
        const dateStr = dateObj.toISOString().split('T')[0];
        
        if (!dayGroups[dateStr]) {
            dayGroups[dateStr] = [];
        }
        dayGroups[dateStr].push(item);
    });

    const daysFr = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const forecast = Object.keys(dayGroups).slice(0, 6).map(dateStr => {
        const items = dayGroups[dateStr];
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
        return arr[(val % 16)];
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
                const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
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
        const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
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
                    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
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
app.post('/api/ai/chat', async (req, res) => {
    try {
        // We pull the perfectly formatted contents and the systemInstruction directly from the frontend
        const { contents, mode, systemInstruction } = req.body;

        if (!contents || !Array.isArray(contents)) {
            return res.status(400).json({ error: "Invalid contents format received from frontend." });
        }

        // The Ultimate Dynamic Fallback Array
        const SUPPORTED_MODELS = [
            'gemini-flash-latest',       // 1. Try to auto-route to the newest stable model
            'gemini-3.1-flash',          // 2. Explicit cutting-edge stable
            'gemini-3.1-flash-lite',     // 3. Explicit cutting-edge lite
            'gemini-3.0-flash',          // 4. Reliable recent fallback
            'gemini-2.5-flash',          // 5. Rock-solid older generation
            'gemini-2.0-flash'           // 6. Bedrock baseline
        ];

        let lastError = null;
        const modeKey = mode ? mode.toLowerCase() : 'default';

        // Determine temperature based on the mode requested by the frontend
        const generationTemperature = modeKey === 'funny' ? 0.9 : (modeKey === 'einstein' ? 0.6 : 0.7);

        // Internal loop for model fallback and key rotation
        for (const modelName of SUPPORTED_MODELS) {
            for (let k = 0; k < GEMINI_KEYS.length; k++) {
                const currentKey = GEMINI_KEYS[k];
                const genAIInstance = new GoogleGenAI({ apiKey: currentKey, vertexai: false });

                try {
                    console.log(`[MeteoSran Server] Attempting generation with model: ${modelName} (Key ${k + 1}/${GEMINI_KEYS.length})`);

                    const response = await genAIInstance.models.generateContent({
                        model: modelName,
                        contents: contents,
                        config: {
                            systemInstruction: systemInstruction || "You are MeteoSran.",
                            temperature: generationTemperature,
                            topP: 0.95,
                            topK: 40,
                        }
                    });

                    const text = response.text;
                    if (!text) throw new Error("Received empty response from AI model.");

                    return res.json({ text });

                } catch (err) {
                    console.warn(`[MeteoSran Server] Model ${modelName} with Key ${k + 1} failed: ${err.message}`);
                    lastError = err;

                    // If it's a quota (429) or auth (403) error, try the next key for the same model
                    if (err.status === 429 || err.status === 403) {
                        console.log(`[MeteoSran Server] Key ${k + 1} hit a limit/auth issue. Rotating to next key...`);
                        continue;
                    }

                    // If it's a 400 Bad Request (e.g., malformed payload or model not found), 
                    // trying other keys for this model won't help, try next model.
                    break;
                }
            }
        }

        // If the loop finishes without returning, all models failed
        throw lastError || new Error("All AI models failed to respond.");

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
            'gemini-flash-latest',
            'gemini-3.1-flash',
            'gemini-3.1-flash-lite',
            'gemini-3.0-flash',
            'gemini-2.5-flash',
            'gemini-2.0-flash'
        ];

        let lastError = null;

        for (const modelName of SUPPORTED_MODELS) {
            for (let k = 0; k < GEMINI_KEYS.length; k++) {
                const currentKey = GEMINI_KEYS[k];
                const genAIInstance = new GoogleGenAI({ apiKey: currentKey, vertexai: false });

                try {
                    console.log(`[MeteoSran Server] Smart Title: Attempting with model: ${modelName} (Key ${k + 1}/${GEMINI_KEYS.length})`);

                    const response = await genAIInstance.models.generateContent({
                        model: modelName,
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        config: {
                            temperature: 0.5,
                            maxOutputTokens: 20
                        }
                    });

                    let title = response.text ? response.text.trim() : null;
                    if (title) {
                        // Strip quotes if Gemini wrapped the response in quotes
                        title = title.replace(/^["']|["']$/g, '').trim();
                        return res.json({ title });
                    }
                } catch (err) {
                    console.warn(`[MeteoSran Server] Smart Title: Model ${modelName} with Key ${k + 1} failed: ${err.message}`);
                    lastError = err;

                    if (err.status === 429 || err.status === 403) {
                        continue;
                    }
                    break;
                }
            }
        }

        throw lastError || new Error("Failed to generate title with all models and keys.");

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

        const memoryModels = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];
        let lastError = null;

        const existingBlock = existingSummary
            ? `\n\nEXISTING SUMMARY TO MERGE INTO:\n${existingSummary}`
            : '';

        const userContent = `CONVERSATION TRANSCRIPT:\n${transcript}${existingBlock}\n\nProduce the updated memory summary now:`;

        for (const modelName of memoryModels) {
            for (let k = 0; k < GEMINI_KEYS.length; k++) {
                try {
                    const genAIInstance = new GoogleGenAI({ apiKey: GEMINI_KEYS[k] });
                    const response = await genAIInstance.models.generateContent({
                        model: modelName,
                        contents: [{ role: 'user', parts: [{ text: userContent }] }],
                        config: {
                            systemInstruction: MEMORY_SYSTEM_PROMPT,
                            temperature: 0.2,
                            maxOutputTokens: 300,
                        }
                    });
                    const summary = response.text?.trim();
                    if (summary) {
                        console.log(`[MeteoSran Server] Memory summarized via ${modelName}`);
                        return res.json({ summary });
                    }
                } catch (err) {
                    lastError = err;
                    if (err.status === 429 || err.status === 403) continue;
                    break;
                }
            }
        }
        throw lastError || new Error('Memory summarization failed');
    } catch (error) {
        console.error('[MeteoSran Server] Memory Error:', error);
        res.status(500).json({ error: error.message || 'Failed to summarize memory' });
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

        const newMessage = await withRetry(() => prisma.message.create({
            data: {
                id: message.id, // Keep the UUID generated by the frontend
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

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log(`[MeteoSran Server] Weather proxy server running on port ${port}`);

        // Warm up the Neon database connection on startup so it's awake
        // before the first user request comes in.
        console.log('[MeteoSran Server] Warming up Neon database connection...');
        withRetry(() => prisma.$queryRaw`SELECT 1`)
            .then(() => console.log('[MeteoSran Server] ✅ Neon database is awake and ready.'))
            .catch(err => console.warn('[MeteoSran Server] ⚠️ Database warm-up failed (will retry on first request):', err.message));

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