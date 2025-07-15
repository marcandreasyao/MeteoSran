import React, { useEffect, useState } from 'react';

interface WeatherData {
  location: string;
  temperature: number;
  unit: string;
  weatherText: string;
  isDayTime: boolean;
  weatherIcon: number;
  realFeelTemperature: { value: number; unit: string };
  // Add more properties as needed based on your server response
}

interface WeatherWidgetProps {
  userLocation?: { lat: number; lon: number } | null;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ userLocation }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        let url = 'http://localhost:5000/api/weather/current';
        const locationMode = localStorage.getItem('locationMode') || 'auto';
        if ((locationMode === 'auto' || locationMode === 'manual') && userLocation && userLocation.lat && userLocation.lon) {
          url += `?lat=${userLocation.lat}&lon=${userLocation.lon}`;
        } else if (locationMode === 'fixed') {
          url += '?fixed=1';
        } // else 'ip' mode: no lat/lon, let backend use IP
        const response = await fetch(url);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch weather data.');
        }
        const data: WeatherData = await response.json();
        setWeather(data);
      } catch (err: any) {
        console.error("Error fetching weather:", err);
        setError(err.message || 'Could not retrieve weather data.');
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, [userLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-800 bg-opacity-30 rounded-2xl shadow-xl border border-gray-700 border-opacity-50 backdrop-blur-glass text-white">
        Loading weather...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 bg-red-800 bg-opacity-30 rounded-2xl shadow-xl border border-red-700 border-opacity-50 backdrop-blur-glass text-white">
        Error: {error}
      </div>
    );
  }

  if (!weather) {
    return null; // Or a message indicating no weather data
  }

  const getWeatherIconUrl = (iconCode: number): string => {
    // AccuWeather icon codes are 1-based, need to pad with leading zero if less than 10
    const paddedIconCode = iconCode < 10 ? `0${iconCode}` : `${iconCode}`;
    return `https://developer.accuweather.com/sites/default/files/${paddedIconCode}-s.png`;
  };

  return (
    <div className="p-6 rounded-2xl shadow-xl border border-white border-opacity-10 bg-white bg-opacity-10 backdrop-blur-glass text-white font-sans max-w-sm mx-auto transition-all duration-300 hover:scale-105">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold">{weather.temperature}°{weather.unit}</h2>
        <img src={getWeatherIconUrl(weather.weatherIcon)} alt={weather.weatherText} className="w-16 h-16" />
      </div>
      
      <p className="text-xl mb-2">{weather.location}</p>
      <p className="text-lg text-gray-200 mb-4">{weather.weatherText}</p>

      <div className="flex justify-between text-sm text-gray-300">
        <div>
          <p>RealFeel: {weather.realFeelTemperature.value}°{weather.realFeelTemperature.unit}</p>
          <p>Day Time: {weather.isDayTime ? 'Yes' : 'No'}</p>
        </div>
        <div>
          {/* You can add High/Low, Hourly Forecast here if your API provides it and you fetch it */}
          {/* Example: <p>H:22° L:11°</p> */}
        </div>
      </div>

      <div className="mt-4 text-center text-gray-400 text-xs">
        Data from AccuWeather
      </div>
    </div>
  );
};

export default WeatherWidget; 