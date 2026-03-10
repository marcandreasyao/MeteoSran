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

/**
 * Fetches historical weather data from Open-Meteo for the current month 
 * over the last 5 years, computing "Climate Normals" (averages and extremes).
 * This data empowers Gemini to speak about weather dynamically like WeatherSpark.
 */
export const getClimateNormals = async (lat: number, lon: number): Promise<string> => {
  try {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    // We want data for the entire current month, across the last 5 years.
    // E.g., if today is March 15th, 2024, we fetch March 1-31 from 2019 to 2023.
    const currentYear = today.getFullYear();
    const endYear = currentYear - 1;
    const startYear = endYear - 4; // 5 years of data

    // To get the full month, we just fetch from startOfYear-Month-01 to endYear-Month-28 (approximation to avoid leap year bugs)
    const startDate = `${startYear}-${month}-01`;
    const endDate = `${endYear}-${month}-28`;

    // Free Open-Meteo Archive API. No API key required.
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Africa%2FAbidjan`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Open-Meteo API returned ${response.status}`);
    }

    const data: HistoricalDataResponse = await response.json();
    
    if (!data.daily || !data.daily.temperature_2m_max) {
      throw new Error("Invalid format from Open-Meteo");
    }

    // Filter data to ONLY include the current month across those 5 years
    // The API might return the entire range (Start of 2019 to End of 2023). We only want "March" days.
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
    const averagePrecip = (sumPrecip / 5).toFixed(1); // average per year for this month
    const rainChance = Math.round((rainDays / numDays) * 100);
    
    const monthName = today.toLocaleDateString('en-US', { month: 'long' });

    // Format the contextual string for Gemini
    return `[WEATHER_SPARK_HISTORICAL_CLIMATOLOGY]: 
Based on 5 years of historical data for this location during the month of ${monthName}:
- Average Daily High: ${averageHigh}°C
- Average Daily Low: ${averageLow}°C
- Extreme High on record for this month: ${extremeHigh.toFixed(1)}°C
- Extreme Low on record for this month: ${extremeLow.toFixed(1)}°C
- Average total precipitation for ${monthName}: ${averagePrecip}mm
- Probability of a rainy day: ${rainChance}%`;

  } catch (error) {
    console.warn("Failed to fetch historical climate data:", error);
    return "[HISTORICAL_DATA_UNAVAILABLE]";
  }
};
