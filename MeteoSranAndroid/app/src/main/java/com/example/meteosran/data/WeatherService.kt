package com.example.meteosran.data

import android.util.Log
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Query
import java.util.concurrent.TimeUnit

interface WeatherApi {
    @GET("api/weather/current")
    suspend fun getCurrentWeather(
        @Query("lat") lat: Double? = null,
        @Query("lon") lon: Double? = null,
        @Query("fixed") fixed: Int? = null
    ): WeatherResponse
}

/**
 * Resilient Retrofit client that mirrors the web version's architecture:
 *
 * The Android app connects to the same Node.js backend (server.js) used by the web app.
 * The server.js already handles the full weather API rotation internally:
 *   1. OpenWeather API (primary, key: OPENWEATHER_API_KEY)
 *   2. WeatherAPI.com (fallback #1, key: WEATHERAPI_API_KEY)
 *   3. AccuWeather (fallback #2, key: ACCUWEATHER_API_KEY)
 *   4. Mock data (fallback #3 — guaranteed response)
 *
 * The Android client's job is to reliably reach the backend. We implement a
 * dual-endpoint strategy with automatic failover:
 *   - DEV:  http://10.0.2.2:5005 (emulator loopback to host machine)
 *   - PROD: https://meteosran.onrender.com (deployed Render instance)
 *
 * On startup, we try the local dev server first (fast, for development).
 * If it fails, we transparently fall back to the production server.
 */
object RetrofitClient {
    private const val TAG = "RetrofitClient"

    // Local development server (Android emulator → host loopback)
    private const val DEV_BASE_URL = "http://10.0.2.2:5005/"

    // Production server (Render deployment — always available)
    private const val PROD_BASE_URL = "https://meteosran.onrender.com/"

    private val devHttpClient = OkHttpClient.Builder()
        .connectTimeout(3, TimeUnit.SECONDS) // Short timeout for fast local dev detection
        .readTimeout(10, TimeUnit.SECONDS)
        .writeTimeout(10, TimeUnit.SECONDS)
        .build()

    private val prodHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS) // Longer timeout for Render cold starts
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .build()

    private val devApi: WeatherApi by lazy {
        Retrofit.Builder()
            .baseUrl(DEV_BASE_URL)
            .client(devHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(WeatherApi::class.java)
    }

    private val prodApi: WeatherApi by lazy {
        Retrofit.Builder()
            .baseUrl(PROD_BASE_URL)
            .client(prodHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(WeatherApi::class.java)
    }

    private val devChatApi: ChatApi by lazy {
        Retrofit.Builder()
            .baseUrl(DEV_BASE_URL)
            .client(devHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ChatApi::class.java)
    }

    private val prodChatApi: ChatApi by lazy {
        Retrofit.Builder()
            .baseUrl(PROD_BASE_URL)
            .client(prodHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ChatApi::class.java)
    }

    /**
     * Fetch weather data with automatic failover.
     * Tries local dev server first, then falls back to production.
     */
    suspend fun fetchWeather(
        lat: Double? = null,
        lon: Double? = null,
        fixed: Int? = null
    ): WeatherResponse {
        // 1. Try local dev server first (fast fail with 3s timeout)
        try {
            Log.d(TAG, "Attempting local dev server ($DEV_BASE_URL)...")
            val response = devApi.getCurrentWeather(lat = lat, lon = lon, fixed = fixed)
            Log.d(TAG, "Local dev server responded successfully: ${response.location}")
            return response
        } catch (devError: Exception) {
            Log.w(TAG, "Local dev server unreachable: ${devError.message}. Falling back to production...")
        }

        // 2. Fallback to production Render server
        try {
            Log.d(TAG, "Attempting production server ($PROD_BASE_URL)...")
            val response = prodApi.getCurrentWeather(lat = lat, lon = lon, fixed = fixed)
            Log.d(TAG, "Production server responded successfully: ${response.location}")
            return response
        } catch (prodError: Exception) {
            Log.e(TAG, "Production server also failed: ${prodError.message}")
            throw prodError
        }
    }

    /**
     * Database Proxy routes with automatic failover.
     */
    suspend fun getChatSessions(userId: String): List<ChatSessionDto> {
        return try {
            devChatApi.getChatSessions(userId)
        } catch (devError: Exception) {
            Log.w(TAG, "Local dev server db query failed, trying prod: ${devError.message}")
            prodChatApi.getChatSessions(userId)
        }
    }

    suspend fun createChatSession(userId: String, title: String): ChatSessionDto {
        val req = CreateChatSessionRequest(userId, title)
        return try {
            devChatApi.createChatSession(req)
        } catch (devError: Exception) {
            Log.w(TAG, "Local dev server db query failed, trying prod: ${devError.message}")
            prodChatApi.createChatSession(req)
        }
    }

    suspend fun updateChatSession(
        chatId: String,
        title: String? = null,
        memorySummary: String? = null,
        isPinned: Boolean? = null
    ): ChatSessionDto {
        val req = UpdateChatSessionRequest(title, memorySummary, isPinned)
        return try {
            devChatApi.updateChatSession(chatId, req)
        } catch (devError: Exception) {
            Log.w(TAG, "Local dev server db query failed, trying prod: ${devError.message}")
            prodChatApi.updateChatSession(chatId, req)
        }
    }

    suspend fun deleteChatSession(chatId: String): Boolean {
        return try {
            devChatApi.deleteChatSession(chatId).success
        } catch (devError: Exception) {
            Log.w(TAG, "Local dev server db query failed, trying prod: ${devError.message}")
            prodChatApi.deleteChatSession(chatId).success
        }
    }

    suspend fun getMessages(chatId: String): List<DbMessageDto> {
        return try {
            devChatApi.getMessages(chatId)
        } catch (devError: Exception) {
            Log.w(TAG, "Local dev server db query failed, trying prod: ${devError.message}")
            prodChatApi.getMessages(chatId)
        }
    }

    suspend fun saveMessage(
        chatId: String,
        id: String,
        role: String,
        text: String,
        timestamp: Long,
        image: ImageDto? = null
    ): DbMessageDto {
        val req = SaveMessageRequest(chatId, SaveDbMessageDto(id, role, text, timestamp, image))
        return try {
            devChatApi.saveMessage(req)
        } catch (devError: Exception) {
            Log.w(TAG, "Local dev server db query failed, trying prod: ${devError.message}")
            prodChatApi.saveMessage(req)
        }
    }

    suspend fun generateTitle(text: String): String {
        return try {
            devChatApi.generateTitle(GenerateTitleRequest(text)).title
        } catch (devError: Exception) {
            Log.w(TAG, "Local dev server db query failed, trying prod: ${devError.message}")
            prodChatApi.generateTitle(GenerateTitleRequest(text)).title
        }
    }

    /**
     * Legacy accessor for backward compatibility.
     * Direct API access bypasses failover — use fetchWeather() instead.
     */
    val weatherApi: WeatherApi
        get() = prodApi
}
