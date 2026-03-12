interface HistoricalDataResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
}

export interface ClimateNormals {
  monthName: string;
  averageHigh: number;
  averageLow: number;
  extremeHigh: number;
  extremeLow: number;
  averagePrecipitation: number;
  rainDaysPercentage: number;
}

// --- CACHING LAYER ---
// We cache the string result so we don't recalculate it.
interface CacheEntry {
  data: string;
  timestamp: number;
}
const climateCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

/**
 * Fetches historical weather data from Open-Meteo for the current month 
 * over the last 5 years, computing "Climate Normals" (averages and extremes).
 * Includes a geographical caching layer to prevent API spam and reduce latency.
 */
export const getClimateNormals = async (lat: number, lon: number): Promise<string> => {
  try {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');

    // Create a cache key based on location (rounded to ~1.1km) and the current month.
    // Example: "5.31,-4.01-03" for Abidjan in March.
    const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}-${month}`;

    // 1. Check if we already have the answer in memory
    if (climateCache.has(cacheKey)) {
      const entry = climateCache.get(cacheKey)!;
      if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
        console.log(`[MeteoSran] ⚡ Climate Normals Cache Hit for ${cacheKey}`);
        return entry.data;
      }
    }

    console.log(`[MeteoSran] 🌧️ Fetching 5-year historical data for ${cacheKey}...`);

    const currentYear = today.getFullYear();
    const endYear = currentYear - 1;
    const startYear = endYear - 4; // 5 years of data

    const startDate = `${startYear}-${month}-01`;
    const endDate = `${endYear}-${month}-28`;

    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Africa%2FAbidjan`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo API returned ${response.status}`);
    }

    const data: HistoricalDataResponse = await response.json();

    if (!data.daily || !data.daily.temperature_2m_max) {
      throw new Error("Invalid format from Open-Meteo");
    }

    const monthStr = `-${month}-`;
    const validIndices = data.daily.time
      .map((timeStr, index) => timeStr.includes(monthStr) ? index : -1)
      .filter(index => index !== -1);

    if (validIndices.length === 0) {
      return "[HISTORICAL_DATA_UNAVAILABLE]";
    }

    let sumMax = 0;
    let sumMin = 0;
    let sumPrecip = 0;
    let rainDays = 0;

    let extremeHigh = -999;
    let extremeLow = 999;

    validIndices.forEach(idx => {
      const tMax = data.daily.temperature_2m_max[idx];
      const tMin = data.daily.temperature_2m_min[idx];
      const precip = data.daily.precipitation_sum[idx];

      if (tMax !== null) {
        sumMax += tMax;
        if (tMax > extremeHigh) extremeHigh = tMax;
      }
      if (tMin !== null) {
        sumMin += tMin;
        if (tMin < extremeLow) extremeLow = tMin;
      }
      if (precip !== null) {
        sumPrecip += precip;
        if (precip > 0.1) rainDays++;
      }
    });

    const numDays = validIndices.length;
    const averageHigh = (sumMax / numDays).toFixed(1);
    const averageLow = (sumMin / numDays).toFixed(1);
    const averagePrecip = (sumPrecip / 5).toFixed(1);
    const rainChance = Math.round((rainDays / numDays) * 100);

    const monthName = today.toLocaleDateString('en-US', { month: 'long' });

    const resultString = `[WEATHER_SPARK_HISTORICAL_CLIMATOLOGY]: 
Based on 5 years of historical data for this location during the month of ${monthName}:
- Average Daily High: ${averageHigh}°C
- Average Daily Low: ${averageLow}°C
- Extreme High on record for this month: ${extremeHigh.toFixed(1)}°C
- Extreme Low on record for this month: ${extremeLow.toFixed(1)}°C
- Average total precipitation for ${monthName}: ${averagePrecip}mm
- Probability of a rainy day: ${rainChance}%`;

    // 2. Save the result to the cache for future requests
    climateCache.set(cacheKey, {
      data: resultString,
      timestamp: Date.now()
    });

    return resultString;

  } catch (error) {
    console.warn("Failed to fetch historical climate data:", error);
    return "[HISTORICAL_DATA_UNAVAILABLE]";
  }
};