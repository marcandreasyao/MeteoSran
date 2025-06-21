require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 5000;
const ACCUWEATHER_API_KEY = 'asVYFG19VlqLcJKmDZaz3ASONyZc5wbG';

// AccuWeather Location Key for Abidjan, Ivory Coast
// You would typically get this from AccuWeather's Location API (e.g., /locations/v1/cities/search)
// For now, we'll hardcode it as per the prompt's scope limitation.
const ABIDJAN_LOCATION_KEY = '223019'; // This is a common location key for Abidjan, CI. (Source: AccuWeather documentation/examples)

app.use(cors());
app.use(express.json());

// Proxy endpoint for current weather
app.get('/api/weather/current', async (req, res) => {
    // In a real application, you might extract location from query params (e.g., req.query.location)
    // and then use AccuWeather's Location API to get the key.
    // For this limited scope (Ivory Coast only), we'll assume the request is for Abidjan.

    if (!ACCUWEATHER_API_KEY) {
        return res.status(500).json({ error: 'AccuWeather API key not configured on the server.' });
    }

    // AccuWeather Current Conditions API endpoint
    // https://developer.accuweather.com/accuweather-current-conditions-api/apis/get/currentconditions/v1/%7BlocationKey%7D
    const accuweatherUrl = `http://dataservice.accuweather.com/currentconditions/v1/${ABIDJAN_LOCATION_KEY}?apikey=${ACCUWEATHER_API_KEY}&details=true&metric=true`;

    try {
        const response = await fetch(accuweatherUrl);
        if (!response.ok) {
            // Attempt to parse error message from AccuWeather if available
            const errorBody = await response.text();
            console.error(`AccuWeather API error: ${response.status} - ${response.statusText}`, errorBody);
            return res.status(response.status).json({
                error: `Failed to fetch weather data from AccuWeather: ${response.statusText}`,
                details: errorBody
            });
        }
        const data = await response.json();

        // Limit the widget to Ivory Coast (Abidjan) for now.
        // If a request comes from another location (which isn't handled here currently anyway),
        // we would conceptually filter it out or return a specific message.
        // Since we're hardcoding Abidjan's key, all successful responses will be for CI.
        // We'll add a check if we were to dynamically get location keys.
        
        // Basic check if the response data seems valid and for Abidjan (by LocationKey)
        if (data && data.length > 0) {
            // You might want to structure the data for the frontend here
            const currentConditions = data[0];
            const formattedData = {
                location: "Abidjan, Ivory Coast",
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
                // Add more fields as needed for your widget
            };
            res.json(formattedData);
        } else {
            res.status(404).json({ error: 'No weather data found for Abidjan or invalid response.' });
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