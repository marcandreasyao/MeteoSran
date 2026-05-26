package com.example.meteosran.data

import com.google.gson.annotations.SerializedName

data class WeatherResponse(
    val location: String,
    val temperature: Double,
    val unit: String,
    val weatherText: String,
    val hasPrecipitation: Boolean,
    val isDayTime: Boolean,
    val weatherIcon: Int,
    val iconUrl: String?,
    val relativeHumidity: Int,
    val wind: WindInfo,
    val pressure: PressureInfo,
    val realFeelTemperature: RealFeelInfo,
    val uvIndex: Int,
    val uvIndexText: String,
    val precipitationType: String?,
    val precip_mm: Double?,
    val forecast: List<ForecastDay>?
)

data class WindInfo(
    val speed: Double,
    val unit: String,
    val direction: String
)

data class PressureInfo(
    val value: Double,
    val unit: String
)

data class RealFeelInfo(
    val value: Double,
    val unit: String
)

data class ForecastDay(
    val date: String,
    val dayOfWeek: String,
    val temp: Double,
    val maxTemp: Double,
    val minTemp: Double,
    val conditionText: String,
    val iconUrl: String,
    val precip_mm: Double,
    val chanceOfRain: Int
)
