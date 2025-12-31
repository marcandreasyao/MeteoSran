import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;
const ACCUWEATHER_API_KEY = process.env.ACCUWEATHER_API_KEY || 'asVYFG19VlqLcJKmDZaz3ASONyZc5wbG'; // Hardcoded API key as requested

// AccuWeather Location Key for Abidjan, Ivory Coast
// You would typically get this from AccuWeather's Location API (e.g., /locations/v1/cities/search)
// For now, we'll hardcode it as per the prompt's scope limitation.
const ABIDJAN_LOCATION_KEY = '223019'; // This is a common location key for Abidjan, CI. (Source: AccuWeather documentation/examples)

app.use(cors());
app.use(express.json());

// Proxy endpoint for current weather
app.get('/api/weather/current', async (req, res) => {
    let lat, lon, locationKey, locationLabel;

    // 0. If 'fixed' param is set, always use Abidjan
    if (req.query.fixed) {
        locationKey = ABIDJAN_LOCATION_KEY;
        locationLabel = "Abidjan, Ivory Coast";
    } else {
        // 1. If lat/lon provided by frontend, use them
        if (req.query.lat && req.query.lon) {
            lat = req.query.lat;
            lon = req.query.lon;
            try {
                const geoUrl = `http://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${ACCUWEATHER_API_KEY}&q=${lat},${lon}`;
                const geoResp = await fetch(geoUrl);
                if (geoResp.ok) {
                    const geoData = await geoResp.json();
                    if (geoData && geoData.Key) {
                        locationKey = geoData.Key;
                        locationLabel = geoData.LocalizedName + (geoData.AdministrativeArea ? ', ' + geoData.AdministrativeArea.LocalizedName : '') + (geoData.Country ? ', ' + geoData.Country.LocalizedName : '');
                    }
                }
            } catch (e) {
                // If geolocation fails, fallback below
            }
        }

        // 2. If no lat/lon or failed, try IP geolocation
        if (!locationKey) {
            try {
                // Get client IP (works behind proxies/load balancers if x-forwarded-for is set)
                const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
                // Use a free IP geolocation API (ip-api.com)
                const ipGeoResp = await fetch(`http://ip-api.com/json/${ip}`);
                if (ipGeoResp.ok) {
                    const ipGeoData = await ipGeoResp.json();
                    if (ipGeoData && ipGeoData.status === 'success') {
                        lat = ipGeoData.lat;
                        lon = ipGeoData.lon;
                        // Now get AccuWeather location key for these coords
                        const geoUrl = `http://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${ACCUWEATHER_API_KEY}&q=${lat},${lon}`;
                        const geoResp = await fetch(geoUrl);
                        if (geoResp.ok) {
                            const geoData = await geoResp.json();
                            if (geoData && geoData.Key) {
                                locationKey = geoData.Key;
                                locationLabel = geoData.LocalizedName + (geoData.AdministrativeArea ? ', ' + geoData.AdministrativeArea.LocalizedName : '') + (geoData.Country ? ', ' + geoData.Country.LocalizedName : '');
                            }
                        }
                    }
                }
            } catch (e) {
                // If IP geolocation fails, fallback below
            }
        }

        // 3. If all else fails, fallback to Abidjan
        if (!locationKey) {
            locationKey = ABIDJAN_LOCATION_KEY;
            locationLabel = "Abidjan, Ivory Coast";
        }
    }

    const accuweatherUrl = `http://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${ACCUWEATHER_API_KEY}&details=true&metric=true`;

    try {
        const response = await fetch(accuweatherUrl);
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`AccuWeather API error: ${response.status} - ${response.statusText}`, errorBody);
            return res.status(response.status).json({
                error: `Failed to fetch weather data from AccuWeather: ${response.statusText}`,
                details: errorBody
            });
        }
        const data = await response.json();
        if (data && data.length > 0) {
            const currentConditions = data[0];
            const formattedData = {
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
            };
            res.json(formattedData);
        } else {
            res.status(404).json({ error: 'No weather data found for this location or invalid response.' });
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
        res.status(500).json({ error: 'Internal server error while fetching weather data.' });
    }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Weather proxy server running on port ${PORT}`);
}); 