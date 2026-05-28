package com.example.meteosran.ui.main

import android.app.Application
import android.content.Context
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.meteosran.data.GenerativeAIService
import com.example.meteosran.data.ResponseMode
import com.example.meteosran.data.RetrofitClient
import com.example.meteosran.data.WeatherResponse
import com.example.meteosran.data.ChatSessionDto
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.UUID

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
    val geminiApiKey: String = "",
    val userId: String? = null,
    val userEmail: String? = null,
    val displayName: String? = null,
    val chatSessions: List<ChatSessionDto> = emptyList(),
    val activeChatId: String? = null,
    val databaseError: String? = null,
    val sidebarLoading: Boolean = false
)

class MainScreenViewModel(application: Application) : AndroidViewModel(application) {

    constructor() : this(Application())

    private val _state = MutableStateFlow(MainScreenState())
    val state: StateFlow<MainScreenState> = _state.asStateFlow()

    private var aiService: GenerativeAIService? = null

    private val sharedPrefs = try {
        application.getSharedPreferences("meteosran_prefs", Context.MODE_PRIVATE)
    } catch (e: Exception) {
        null
    }
    init {
        // 1. Initialize user info from Firebase Auth
        try {
            val currentUser = FirebaseAuth.getInstance().currentUser
            if (currentUser != null) {
                _state.update {
                    it.copy(
                        userId = currentUser.uid,
                        userEmail = currentUser.email,
                        displayName = currentUser.displayName
                    )
                }
                // 2. Fetch past conversations from database
                loadChatSessions()
            }
        } catch (e: Exception) {
            // Firebase Auth not initialized in unit tests
        }

        // 3. Load persisted Gemini API key
        try {
            val savedKey = sharedPrefs?.getString("gemini_api_key", "") ?: ""
            if (savedKey.isNotBlank()) {
                _state.update { it.copy(geminiApiKey = savedKey) }
                aiService = GenerativeAIService(savedKey)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        // 4. Load weather data on startup
        fetchWeather()
    }

    fun setApiKey(key: String) {
        _state.update { it.copy(geminiApiKey = key) }
        aiService = GenerativeAIService(key)
        try {
            sharedPrefs?.edit()?.putString("gemini_api_key", key)?.apply()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun setMode(mode: ResponseMode) {
        _state.update { it.copy(selectedMode = mode) }
    }

    fun fetchWeather(lat: Double? = null, lon: Double? = null) {
        viewModelScope.launch {
            _state.update { it.copy(weatherLoading = true, weatherError = null) }
            try {
                val response = if (lat != null && lon != null) {
                    RetrofitClient.fetchWeather(lat = lat, lon = lon)
                } else {
                    RetrofitClient.fetchWeather(fixed = 1)
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

    fun loadChatSessions() {
        val uid = _state.value.userId ?: return
        viewModelScope.launch {
            _state.update { it.copy(sidebarLoading = true, databaseError = null) }
            try {
                val sessions = RetrofitClient.getChatSessions(uid)
                _state.update { it.copy(chatSessions = sessions, sidebarLoading = false) }
            } catch (e: Exception) {
                _state.update { it.copy(sidebarLoading = false, databaseError = "Failed to load chats: ${e.localizedMessage}") }
            }
        }
    }

    fun selectChatSession(chatId: String) {
        _state.update { it.copy(activeChatId = chatId, chatMessages = emptyList(), chatLoading = true, databaseError = null) }
        viewModelScope.launch {
            try {
                val messagesDto = RetrofitClient.getMessages(chatId)
                val mappedMessages = messagesDto.map { msg ->
                    ChatMessage(
                        id = msg.id,
                        text = msg.text,
                        isUser = msg.role == "user",
                        timestamp = try {
                            java.time.OffsetDateTime.parse(msg.timestamp).toInstant().toEpochMilli()
                        } catch (e: Exception) {
                            System.currentTimeMillis()
                        }
                    )
                }
                _state.update { it.copy(chatMessages = mappedMessages, chatLoading = false) }
            } catch (e: Exception) {
                _state.update { it.copy(chatLoading = false, databaseError = "Failed to load messages: ${e.localizedMessage}") }
            }
        }
    }

    fun createNewChat() {
        _state.update { it.copy(activeChatId = null, chatMessages = emptyList(), databaseError = null) }
    }

    fun deleteChatSession(chatId: String) {
        viewModelScope.launch {
            try {
                RetrofitClient.deleteChatSession(chatId)
                loadChatSessions()
                if (_state.value.activeChatId == chatId) {
                    createNewChat()
                }
            } catch (e: Exception) {
                _state.update { it.copy(databaseError = "Failed to delete chat: ${e.localizedMessage}") }
            }
        }
    }

    fun renameChatSession(chatId: String, newTitle: String) {
        if (newTitle.isBlank()) return
        viewModelScope.launch {
            try {
                RetrofitClient.updateChatSession(chatId, title = newTitle)
                loadChatSessions()
            } catch (e: Exception) {
                _state.update { it.copy(databaseError = "Failed to rename chat: ${e.localizedMessage}") }
            }
        }
    }

    fun logout(onComplete: () -> Unit) {
        FirebaseAuth.getInstance().signOut()
        _state.update { MainScreenState() } // Reset local state
        onComplete()
    }

    fun sendMessage(text: String) {
        val uid = _state.value.userId
        if (uid == null) {
            _state.update {
                it.copy(
                    chatMessages = it.chatMessages + ChatMessage(
                        id = UUID.randomUUID().toString(),
                        text = "Session utilisateur non authentifiée. Veuillez vous reconnecter.",
                        isUser = false
                    )
                )
            }
            return
        }

        val currentApiKey = _state.value.geminiApiKey
        if (currentApiKey.isBlank()) {
            _state.update {
                it.copy(
                    chatMessages = it.chatMessages + ChatMessage(
                        id = UUID.randomUUID().toString(),
                        text = "Veuillez configurer votre clé API Gemini dans les paramètres pour commencer à discuter avec MeteoSran !",
                        isUser = false
                    )
                )
            }
            return
        }

        if (aiService == null) {
            aiService = GenerativeAIService(currentApiKey)
        }

        val activeId = _state.value.activeChatId
        if (activeId == null) {
            // New Conversation: Create session on database first
            viewModelScope.launch {
                _state.update { it.copy(chatLoading = true, databaseError = null) }
                try {
                    // 1. Generate smart title using AI proxy
                    val title = try {
                        RetrofitClient.generateTitle(text)
                    } catch (e: Exception) {
                        val words = text.split(" ")
                        if (words.size > 4) words.take(4).joinToString(" ") + "..." else text
                    }

                    // 2. Register chat session in Neon Database
                    val newSession = RetrofitClient.createChatSession(uid, title)
                    val newChatId = newSession.id
                    _state.update { it.copy(activeChatId = newChatId) }

                    // Refresh sessions list
                    loadChatSessions()

                    // 3. Save message and get AI response
                    saveMessageAndGenerateAiResponse(newChatId, text)
                } catch (e: Exception) {
                    _state.update { it.copy(chatLoading = false, databaseError = "Failed to create session: ${e.localizedMessage}") }
                }
            }
        } else {
            // Active Conversation: Save directly
            saveMessageAndGenerateAiResponse(activeId, text)
        }
    }

    private fun saveMessageAndGenerateAiResponse(chatId: String, text: String) {
        val userMsgId = UUID.randomUUID().toString()
        val userMsg = ChatMessage(id = userMsgId, text = text, isUser = true)

        // Show user message instantly in UI
        _state.update {
            it.copy(
                chatMessages = it.chatMessages + userMsg,
                chatLoading = true
            )
        }

        viewModelScope.launch {
            try {
                // 1. Save user message to database
                RetrofitClient.saveMessage(chatId, userMsgId, "user", text, userMsg.timestamp)

                // 2. Prepare weather context
                val weatherContext = _state.value.weather?.let {
                    "Location: ${it.location}, Temperature: ${it.temperature}°C, Condition: ${it.weatherText}, Humidity: ${it.relativeHumidity}%, Real Feel: ${it.realFeelTemperature.value}°C"
                }

                // 3. Extract chat history for Gemini context
                val history = _state.value.chatMessages.dropLast(1).map {
                    Pair(it.text, it.isUser)
                }

                // 4. Query Gemini API
                val aiResponseText = aiService?.generateResponse(
                    prompt = text,
                    mode = _state.value.selectedMode,
                    history = history,
                    weatherContext = weatherContext
                ) ?: "Erreur d'initialisation de l'IA."

                val aiMsgId = UUID.randomUUID().toString()
                val aiMsg = ChatMessage(id = aiMsgId, text = aiResponseText, isUser = false)

                // 5. Save model response to database
                RetrofitClient.saveMessage(chatId, aiMsgId, "model", aiResponseText, aiMsg.timestamp)

                _state.update {
                    it.copy(
                        chatMessages = it.chatMessages + aiMsg,
                        chatLoading = false
                    )
                }
            } catch (e: Exception) {
                _state.update {
                    it.copy(
                        chatLoading = false,
                        databaseError = "Failed to sync messages: ${e.localizedMessage}"
                    )
                }
            }
        }
    }

    fun clearChat() {
        val activeId = _state.value.activeChatId
        if (activeId != null) {
            viewModelScope.launch {
                try {
                    RetrofitClient.deleteChatSession(activeId)
                    loadChatSessions()
                    createNewChat()
                } catch (e: Exception) {
                    _state.update { it.copy(databaseError = "Failed to clear conversation: ${e.localizedMessage}") }
                }
            }
        } else {
            _state.update { it.copy(chatMessages = emptyList()) }
        }
    }
}
