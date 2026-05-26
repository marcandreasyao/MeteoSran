package com.example.meteosran.ui.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.meteosran.data.GenerativeAIService
import com.example.meteosran.data.ResponseMode
import com.example.meteosran.data.RetrofitClient
import com.example.meteosran.data.WeatherResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ChatMessage(
    val id: String,
    val text: String,
    val isUser: Boolean,
    val timestamp: Long = System.currentTimeMillis()
)

data class MainScreenState(
    val weather: WeatherResponse? = null,
    val weatherLoading: Boolean = false,
    val weatherError: String? = null,
    val chatMessages: List<ChatMessage> = emptyList(),
    val chatLoading: Boolean = false,
    val selectedMode: ResponseMode = ResponseMode.DEFAULT,
    val geminiApiKey: String = ""
)

class MainScreenViewModel : ViewModel() {

    private val _state = MutableStateFlow(MainScreenState())
    val state: StateFlow<MainScreenState> = _state.asStateFlow()

    private var aiService: GenerativeAIService? = null

    init {
        // Trigger fixed Abidjan weather loading on startup
        fetchWeather()
    }

    fun setApiKey(key: String) {
        _state.update { it.copy(geminiApiKey = key) }
        aiService = GenerativeAIService(key)
    }

    fun setMode(mode: ResponseMode) {
        _state.update { it.copy(selectedMode = mode) }
    }

    fun fetchWeather(lat: Double? = null, lon: Double? = null) {
        viewModelScope.launch {
            _state.update { it.copy(weatherLoading = true, weatherError = null) }
            try {
                val response = if (lat != null && lon != null) {
                    RetrofitClient.weatherApi.getCurrentWeather(lat = lat, lon = lon)
                } else {
                    RetrofitClient.weatherApi.getCurrentWeather(fixed = 1)
                }
                _state.update { it.copy(weather = response, weatherLoading = false) }
            } catch (e: Exception) {
                _state.update {
                    it.copy(
                        weatherLoading = false,
                        weatherError = "Failed to load weather: ${e.localizedMessage}"
                    )
                }
            }
        }
    }

    fun sendMessage(text: String) {
        val currentApiKey = _state.value.geminiApiKey
        if (currentApiKey.isBlank()) {
            _state.update {
                it.copy(
                    chatMessages = it.chatMessages + ChatMessage(
                        id = System.currentTimeMillis().toString(),
                        text = "Veuillez configurer votre clé API Gemini pour commencer à discuter avec MeteoSran !",
                        isUser = false
                    )
                )
            }
            return
        }

        if (aiService == null) {
            aiService = GenerativeAIService(currentApiKey)
        }

        val userMsg = ChatMessage(
            id = System.currentTimeMillis().toString(),
            text = text,
            isUser = true
        )

        _state.update {
            it.copy(
                chatMessages = it.chatMessages + userMsg,
                chatLoading = true
            )
        }

        viewModelScope.launch {
            val weatherContext = _state.value.weather?.let {
                "Location: ${it.location}, Temperature: ${it.temperature}°C, Condition: ${it.weatherText}, Humidity: ${it.relativeHumidity}%, Real Feel: ${it.realFeelTemperature.value}°C"
            }

            // Expose prior conversation to the AI model
            val history = _state.value.chatMessages.dropLast(1).map {
                Pair(it.text, it.isUser)
            }

            val aiResponseText = aiService?.generateResponse(
                prompt = text,
                mode = _state.value.selectedMode,
                history = history,
                weatherContext = weatherContext
            ) ?: "Erreur d'initialisation de l'IA."

            val aiMsg = ChatMessage(
                id = (System.currentTimeMillis() + 1).toString(),
                text = aiResponseText,
                isUser = false
            )

            _state.update {
                it.copy(
                    chatMessages = it.chatMessages + aiMsg,
                    chatLoading = false
                )
            }
        }
    }

    fun clearChat() {
        _state.update { it.copy(chatMessages = emptyList()) }
    }
}
