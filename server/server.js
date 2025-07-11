require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 5000;
const ACCUWEATHER_API_KEY = 'asVYFG19VlqLcJKmDZaz3ASONyZc5wbG'; // Hardcoded API key as requested

// AccuWeather Location Key for Abidjan, Ivory Coast
// You would typically get this from AccuWeather's Location API (e.g., /locations/v1/cities/search)
// For now, we'll hardcode it as per the prompt's scope limitation.
const ABIDJAN_LOCATION_KEY = '223019'; // This is a common location key for Abidjan, CI. (Source: AccuWeather documentation/examples)

app.use(cors());
app.use(express.json());

// Proxy endpoint for current weather
app.get('/api/weather/current', async (req, res) => {
    // Always use Abidjan location key, ignore lat/lon for now
    const locationKey = ABIDJAN_LOCATION_KEY;
    const locationLabel = "Abidjan, Ivory Coast";

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

// Start the server
app.listen(PORT, () => {
    console.log(`Weather proxy server running on port ${PORT}`);
}); 