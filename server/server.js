import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5005;

// SECURITY NOTE: I have redacted your AccuWeather key here. 
// Make sure to use process.env in production so bots don't steal it!
const ACCUWEATHER_API_KEY = process.env.ACCUWEATHER_API_KEY || 'YOUR_ACCUWEATHER_KEY_HERE';
const ABIDJAN_LOCATION_KEY = '223019';

app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY, vertexai: false }) : null;

if (!genAI) {
    console.warn("[MeteoSran Server] Warning: GEMINI_API_KEY is missing in server environment.");
}

// ==========================================
// 1. ACCUWEATHER PROXY (Unchanged)
// ==========================================
app.get('/api/weather/current', async (req, res) => {
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
            const errorBody = await response.text();
            console.error(`AccuWeather API error: ${response.status} - ${response.statusText}`, errorBody);

            if (response.status === 403 || response.status === 503) {
                console.log("Using mock AccuWeather data due to API limit.");
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

            return res.status(response.status).json({
                error: `Failed to fetch weather data: ${response.statusText}`,
                details: errorBody
            });
        }
        const data = await response.json();
        if (data && data.length > 0) {
            const currentConditions = data[0];
            res.json({
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
            res.status(404).json({ error: 'No weather data found.' });
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// ==========================================
// 2. SECURE GEMINI AI PROXY (Refactored)
// ==========================================
app.post('/api/ai/chat', async (req, res) => {
    try {
        if (!genAI) {
            return res.status(500).json({ error: "AI Service not configured on server." });
        }

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

        // Internal loop for model fallback
        for (const modelName of SUPPORTED_MODELS) {
            try {
                console.log(`[MeteoSran Server] Attempting generation with model: ${modelName}`);

                // Using stateless generateContent because 'contents' is already perfectly structured
                const response = await genAI.models.generateContent({
                    model: modelName,
                    contents: contents,
                    config: {
                        systemInstruction: systemInstruction || "You are MeteoSran.", // Dynamically loaded!
                        temperature: generationTemperature,
                        topP: 0.95,
                        topK: 40,
                    }
                });

                const text = response.text;
                if (!text) throw new Error("Received empty response from AI model.");

                // If successful, return immediately to the frontend
                return res.json({ text });

            } catch (err) {
                console.warn(`[MeteoSran Server] Model ${modelName} failed: ${err.message}`);
                lastError = err;

                // If it's a 400 Bad Request (e.g., malformed payload), retrying won't help
                if (err.status === 400) break;

                // Otherwise (403, 429, 503), continue to the next model in the array
                continue;
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

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log(`[MeteoSran Server] Weather proxy server running on port ${port}`);
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