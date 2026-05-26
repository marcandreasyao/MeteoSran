package com.example.meteosran.data

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Query

interface WeatherApi {
    @GET("api/weather/current")
    suspend fun getCurrentWeather(
        @Query("lat") lat: Double? = null,
        @Query("lon") lon: Double? = null,
        @Query("fixed") fixed: Int? = null
    ): WeatherResponse
}

object RetrofitClient {
    private const val BASE_URL = "http://10.0.2.2:5005/" // Maps to host loopback in Android Emulator

    val weatherApi: WeatherApi by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(WeatherApi::class.java)
    }
}
