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
import com.example.meteosran.data.ChatRepository
import com.example.meteosran.utils.LocationHelper
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.UUID

import com.example.meteosran.data.ImageDto

data class ChatMessage(
    val id: String,
    val text: String,
    val isUser: Boolean,
    val timestamp: Long = System.currentTimeMillis(),
    val image: ImageDto? = null
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
    val sidebarLoading: Boolean = false,
    val locationMode: String = "fixed", // "auto" | "manual" | "ip" | "fixed"
    val manualCityName: String = "",
    val resolvedLocationCoordinates: Pair<Double, Double>? = null
)

class MainScreenViewModel(application: Application) : AndroidViewModel(application) {

    constructor() : this(Application())

    private val _state = MutableStateFlow(MainScreenState())
    val state: StateFlow<MainScreenState> = _state.asStateFlow()

    private var aiService: GenerativeAIService? = null

    private val chatRepository = try {
        ChatRepository(application)
    } catch (e: Exception) {
        null
    }

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

        // 3. Load persisted settings (API Key, Location Mode, Manual City)
        try {
            val savedKey = sharedPrefs?.getString("gemini_api_key", "") ?: ""
            if (savedKey.isNotBlank()) {
                _state.update { it.copy(geminiApiKey = savedKey) }
                aiService = GenerativeAIService(savedKey)
            }
            val savedMode = sharedPrefs?.getString("location_mode", "fixed") ?: "fixed"
            val savedCity = sharedPrefs?.getString("manual_city_name", "") ?: ""
            _state.update {
                it.copy(
                    locationMode = savedMode,
                    manualCityName = savedCity
                )
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

    fun setLocationMode(mode: String) {
        _state.update { it.copy(locationMode = mode) }
        try {
            sharedPrefs?.edit()?.putString("location_mode", mode)?.apply()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        fetchWeather()
    }

    fun setManualCity(cityName: String) {
        _state.update { it.copy(manualCityName = cityName) }
        try {
            sharedPrefs?.edit()?.putString("manual_city_name", cityName)?.apply()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        if (_state.value.locationMode == "manual") {
            fetchWeather()
        }
    }

    // Resolves coordinates for manual location mode
    private suspend fun resolveCityCoordinates(cityName: String): Pair<Double, Double>? = withContext(Dispatchers.IO) {
        try {
            val localDictionary = mapOf(
                "abidjan" to Pair(5.30966, -4.01266),
                "yamoussoukro" to Pair(6.81881, -5.27674),
                "bouaké" to Pair(7.69385, -5.03079),
                "bouake" to Pair(7.69385, -5.03079),
                "san pédro" to Pair(4.74851, -6.6363),
                "san pedro" to Pair(4.74851, -6.6363),
                "korhogo" to Pair(9.45803, -5.62961),
                "man" to Pair(7.41251, -7.55383),
                "daloa" to Pair(6.87735, -6.45022),
                "gagnoa" to Pair(6.13193, -5.9506),
                "grand-bassam" to Pair(5.2118, -3.7388),
                "grand bassam" to Pair(5.2118, -3.7388),
                "assinie" to Pair(5.1584, -3.2929),
                "odienné" to Pair(9.5051, -7.5643),
                "odienne" to Pair(9.5051, -7.5643),
                "ferkessédougou" to Pair(9.5928, -5.1983),
                "ferkessedougou" to Pair(9.5928, -5.1983)
            )

            val normalized = cityName.trim().lowercase()
            if (localDictionary.containsKey(normalized)) {
                return@withContext localDictionary[normalized]
            }

            val urlString = "https://geocoding-api.open-meteo.com/v1/search?name=${java.net.URLEncoder.encode(cityName, "UTF-8")}&count=1&language=en&format=json"
            val connection = java.net.URL(urlString).openConnection() as java.net.HttpURLConnection
            connection.requestMethod = "GET"
            connection.connectTimeout = 5000
            connection.readTimeout = 5000

            val responseText = connection.inputStream.bufferedReader().use { it.readText() }
            val jsonElement = com.google.gson.JsonParser.parseString(responseText)
            if (jsonElement.isJsonObject) {
                val results = jsonElement.asJsonObject.getAsJsonArray("results")
                if (results != null && results.size() > 0) {
                    val firstResult = results.get(0).asJsonObject
                    val lat = firstResult.get("latitude").asDouble
                    val lon = firstResult.get("longitude").asDouble
                    return@withContext Pair(lat, lon)
                }
            }
            null
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    fun fetchWeather(lat: Double? = null, lon: Double? = null) {
        viewModelScope.launch {
            _state.update { it.copy(weatherLoading = true, weatherError = null) }
            val context = try {
                getApplication<Application>()
            } catch (e: Exception) {
                null
            }

            try {
                var targetLat = lat
                var targetLon = lon

                if (targetLat == null || targetLon == null) {
                    when (_state.value.locationMode) {
                        "auto" -> {
                            if (context != null && LocationHelper.hasLocationPermission(context)) {
                                val gpsLocation = LocationHelper.getCurrentLocation(context)
                                if (gpsLocation != null) {
                                    targetLat = gpsLocation.latitude
                                    targetLon = gpsLocation.longitude
                                    _state.update { it.copy(resolvedLocationCoordinates = Pair(gpsLocation.latitude, gpsLocation.longitude)) }
                                } else {
                                    _state.update { it.copy(resolvedLocationCoordinates = null, weatherError = "Impossible d'obtenir la position GPS. Repli sur le mode fixe.") }
                                }
                            } else {
                                _state.update { it.copy(resolvedLocationCoordinates = null) }
                            }
                        }
                        "manual" -> {
                            val city = _state.value.manualCityName
                            if (city.isNotBlank()) {
                                val resolved = resolveCityCoordinates(city)
                                if (resolved != null) {
                                    targetLat = resolved.first
                                    targetLon = resolved.second
                                    _state.update { it.copy(resolvedLocationCoordinates = resolved) }
                                } else {
                                    _state.update { it.copy(resolvedLocationCoordinates = null, weatherError = "Impossible de résoudre la ville: $city") }
                                }
                            } else {
                                _state.update { it.copy(resolvedLocationCoordinates = null) }
                            }
                        }
                        else -> {
                            _state.update { it.copy(resolvedLocationCoordinates = null) }
                        }
                    }
                } else {
                    _state.update { it.copy(resolvedLocationCoordinates = Pair(targetLat, targetLon)) }
                }

                val response = if (targetLat != null && targetLon != null) {
                    RetrofitClient.fetchWeather(lat = targetLat, lon = targetLon)
                } else {
                    val fixedVal = if (_state.value.locationMode == "ip") 0 else 1
                    RetrofitClient.fetchWeather(fixed = fixedVal)
                }
                _state.update { it.copy(weather = response, weatherLoading = false) }
            } catch (e: Exception) {
                _state.update {
                    it.copy(
                        weatherLoading = false,
                        weatherError = "Échec du chargement météo: ${e.localizedMessage}"
                    )
                }
            }
        }
    }

    fun loadChatSessions() {
        val uid = _state.value.userId ?: return
        viewModelScope.launch {
            _state.update { it.copy(sidebarLoading = true, databaseError = null) }
            // Instant local load
            if (chatRepository != null) {
                try {
                    val localSessions = chatRepository.getLocalSessions(uid)
                    _state.update { it.copy(chatSessions = localSessions) }
                } catch (e: Exception) {
                    Log.w("MainScreenViewModel", "Failed to load local sessions: ${e.message}")
                }
            }
            try {
                val sessions = if (chatRepository != null) {
                    chatRepository.fetchAndCacheSessions(uid)
                } else {
                    RetrofitClient.getChatSessions(uid)
                }
                _state.update { it.copy(chatSessions = sessions, sidebarLoading = false) }
                
                // Trigger background sync of any unsynced offline messages
                chatRepository?.syncPendingMessages()
            } catch (e: Exception) {
                _state.update { it.copy(sidebarLoading = false, databaseError = "Failed to load chats: ${e.localizedMessage}") }
            }
        }
    }

    fun selectChatSession(chatId: String) {
        _state.update { it.copy(activeChatId = chatId, chatMessages = emptyList(), chatLoading = true, databaseError = null) }
        viewModelScope.launch {
            if (chatRepository != null) {
                try {
                    val localMessages = chatRepository.getLocalMessages(chatId)
                    if (localMessages.isNotEmpty()) {
                        _state.update { it.copy(chatMessages = localMessages, chatLoading = false) }
                    }
                } catch (e: Exception) {
                    Log.w("MainScreenViewModel", "Failed to load local messages: ${e.message}")
                }
            }
            try {
                val mappedMessages = if (chatRepository != null) {
                    chatRepository.fetchAndCacheMessages(chatId)
                } else {
                    RetrofitClient.getMessages(chatId).map { msg ->
                        ChatMessage(
                            id = msg.id,
                            text = msg.text,
                            isUser = msg.role == "user",
                            timestamp = try {
                                java.time.OffsetDateTime.parse(msg.timestamp).toInstant().toEpochMilli()
                            } catch (e: Exception) {
                                System.currentTimeMillis()
                            },
                            image = msg.image
                        )
                    }
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
        val activeChatId = _state.value.activeChatId
        viewModelScope.launch {
            try {
                if (chatRepository != null) {
                    chatRepository.deleteSession(chatId)
                    _state.update {
                        it.copy(
                            chatSessions = it.chatSessions.filter { session -> session.id != chatId }
                        )
                    }
                    if (activeChatId == chatId) {
                        createNewChat()
                    }
                } else {
                    RetrofitClient.deleteChatSession(chatId)
                    loadChatSessions()
                    if (activeChatId == chatId) {
                        createNewChat()
                    }
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
                if (chatRepository != null) {
                    chatRepository.renameSession(chatId, newTitle)
                    _state.update {
                        it.copy(
                            chatSessions = it.chatSessions.map { session ->
                                if (session.id == chatId) session.copy(title = newTitle) else session
                            }
                        )
                    }
                } else {
                    RetrofitClient.updateChatSession(chatId, title = newTitle)
                    loadChatSessions()
                }
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

    fun sendMessage(text: String, image: ImageDto? = null) {
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

        val promptText = if (text.trim().isEmpty() && image != null) {
            "Could you analyze this image and explain the weather conditions or phenomena visible in it?"
        } else {
            text
        }

        val activeId = _state.value.activeChatId
        if (activeId == null) {
            // New Conversation: Create session on database first
            viewModelScope.launch {
                _state.update { it.copy(chatLoading = true, databaseError = null) }
                try {
                    // 1. Generate smart title using AI proxy
                    val title = try {
                        RetrofitClient.generateTitle(promptText)
                    } catch (e: Exception) {
                        val words = promptText.split(" ")
                        if (words.size > 4) words.take(4).joinToString(" ") + "..." else promptText
                    }

                    // 2. Generate a local ID for fallback
                    val newChatId = UUID.randomUUID().toString()

                    // Insert locally first to keep UI snappy
                    if (chatRepository != null) {
                        chatRepository.createLocalSession(uid, newChatId, title)
                        val localSessionDto = ChatSessionDto(
                            id = newChatId,
                            userId = uid,
                            title = title,
                            memorySummary = null,
                            isPinned = false,
                            createdAt = java.time.OffsetDateTime.now().toString(),
                            updatedAt = java.time.OffsetDateTime.now().toString()
                        )
                        _state.update {
                            it.copy(
                                activeChatId = newChatId,
                                chatSessions = listOf(localSessionDto) + it.chatSessions
                            )
                        }
                    }

                    // 3. Register chat session in Neon Database
                    val finalChatId = try {
                        val newSession = RetrofitClient.createChatSession(uid, title)
                        if (chatRepository != null) {
                            // If online succeeded, swap the temporary session for the server-created one
                            chatRepository.deleteSession(newChatId)
                            chatRepository.createLocalSession(uid, newSession.id, title)
                        }
                        _state.update { it.copy(activeChatId = newSession.id) }
                        newSession.id
                    } catch (e: Exception) {
                        Log.w("MainScreenViewModel", "Failed to create remote session: ${e.message}")
                        if (chatRepository == null) {
                            throw e
                        }
                        newChatId
                    }

                    // Refresh sessions list
                    loadChatSessions()

                    // 4. Save message and get AI response
                    saveMessageAndGenerateAiResponse(finalChatId, promptText, image)
                } catch (e: Exception) {
                    _state.update { it.copy(chatLoading = false, databaseError = "Failed to create session: ${e.localizedMessage}") }
                }
            }
        } else {
            // Active Conversation: Save directly
            saveMessageAndGenerateAiResponse(activeId, promptText, image)
        }
    }

    private fun saveMessageAndGenerateAiResponse(chatId: String, text: String, image: ImageDto? = null) {
        val userMsgId = UUID.randomUUID().toString()
        val userMsg = ChatMessage(id = userMsgId, text = text, isUser = true, image = image)

        // Show user message instantly in UI
        _state.update {
            it.copy(
                chatMessages = it.chatMessages + userMsg,
                chatLoading = true
            )
        }

        viewModelScope.launch {
            try {
                // 1. Create a tiny DB thumbnail from the base64 image (max 200px @ 60% quality)
                val dbImage = image?.let { img ->
                    try {
                        val thumb = com.example.meteosran.utils.ImageCompressionHelper.compressAndResizeBase64(
                            base64Data = img.data,
                            maxDimension = 200,
                            quality = 60
                        )
                        if (thumb != null) {
                            ImageDto(data = thumb.base64, mimeType = thumb.mimeType, name = img.name)
                        } else {
                            img
                        }
                    } catch (e: Exception) {
                        img
                    }
                }

                val userMsgForDb = userMsg.copy(image = dbImage)

                // 2. Save user message locally first
                chatRepository?.saveMessageLocally(chatId, userMsgForDb, isSynced = false)

                // 3. Try to save user message to remote database
                try {
                    RetrofitClient.saveMessage(chatId, userMsgId, "user", text, userMsg.timestamp, dbImage)
                    chatRepository?.saveMessageLocally(chatId, userMsgForDb, isSynced = true)
                } catch (remoteEx: Exception) {
                    Log.w("MainScreenViewModel", "Failed to save user message remotely: ${remoteEx.message}")
                }

                // 4. Prepare weather and coordinates context for complete location awareness
                val weatherContext = buildString {
                    _state.value.weather?.let {
                        append("Location: ${it.location}, Temperature: ${it.temperature}°C, Condition: ${it.weatherText}, Humidity: ${it.relativeHumidity}%, Real Feel: ${it.realFeelTemperature.value}°C")
                    }
                    _state.value.resolvedLocationCoordinates?.let { (lat, lon) ->
                        if (isNotEmpty()) append("\n")
                        append("User Coordinates: Latitude $lat, Longitude $lon")
                    }
                }.takeIf { it.isNotEmpty() }

                // 5. Extract chat history for Gemini context (applying Historical Image Stripping token optimization)
                val history = _state.value.chatMessages.dropLast(1).map { msg ->
                    val textWithPlaceholder = if (msg.image != null) {
                        val imgName = msg.image.name
                        val placeholder = "[Image: $imgName was shared]"
                        if (msg.text.isBlank()) placeholder else "${msg.text}\n$placeholder"
                    } else {
                        msg.text
                    }
                    com.example.meteosran.data.HistoryMessage(
                        text = textWithPlaceholder,
                        isUser = msg.isUser,
                        image = null // Strip Base64 data from historical messages to optimize tokens!
                    )
                }

                // 6. Query Gemini API, passing the current turn's full-resolution image
                val aiResponseText = aiService?.generateResponse(
                    prompt = text,
                    mode = _state.value.selectedMode,
                    history = history,
                    currentImage = image,
                    weatherContext = weatherContext
                ) ?: "Erreur d'initialisation de l'IA."

                val aiMsgId = UUID.randomUUID().toString()
                val aiMsg = ChatMessage(id = aiMsgId, text = aiResponseText, isUser = false)

                // 7. Save AI message locally first
                chatRepository?.saveMessageLocally(chatId, aiMsg, isSynced = false)

                _state.update {
                    it.copy(
                        chatMessages = it.chatMessages + aiMsg,
                        chatLoading = false
                    )
                }

                // 8. Try to save AI response to remote database
                try {
                    RetrofitClient.saveMessage(chatId, aiMsgId, "model", aiResponseText, aiMsg.timestamp)
                    chatRepository?.saveMessageLocally(chatId, aiMsg, isSynced = true)
                } catch (remoteEx: Exception) {
                    Log.w("MainScreenViewModel", "Failed to save AI response remotely: ${remoteEx.message}")
                }

                // Trigger background sync of any unsynced offline messages
                chatRepository?.syncPendingMessages()
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
                    if (chatRepository != null) {
                        chatRepository.deleteSession(activeId)
                    } else {
                        RetrofitClient.deleteChatSession(activeId)
                    }
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
