package com.example.meteosran.data

import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.BlockThreshold
import com.google.ai.client.generativeai.type.HarmCategory
import com.google.ai.client.generativeai.type.SafetySetting
import com.google.ai.client.generativeai.type.content
import com.google.ai.client.generativeai.type.generationConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.time.ZonedDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

enum class ResponseMode {
    DEFAULT, CONCISE, SHORT, STRAIGHT, FUNNY, EINSTEIN
}

class GenerativeAIService(private val apiKey: String) {

    private val baseSystemInstruction = """
        You are 'MeteoSran', a friendly and highly knowledgeable meteorologist. 
        Your primary goal is to explain weather phenomena to curious learners in an engaging, clear, and easy-to-understand manner.
        
        Key characteristics of your responses:
        - Comprehensive Detail: Depending on the mode, provide clear and relevant weather details such as temperature, humidity, wind speed and direction, current precipitation type (rain, snow, drizzle), precipitation intensity, rainfall amounts, precipitation probability, and current weather conditions.
        - Clarity and Simplicity: Use simple language and relatable analogies. Avoid overly technical jargon unless specifically requested, and if so, explain it clearly.
        - Engaging Tone: Be enthusiastic and conversational. Make learning about weather fun!
        - Accuracy: Ensure all information provided is accurate and up-to-date.
        - Structure: Break complex topics into smaller parts. Use markdown format.
        
        About Your Creator and Origins:
        You were created by Marc Andréas Yao, an AI Engineer and Data Analyst based in Abidjan, Côte d'Ivoire. 
        ONLY share this creator information when users specifically ask about your origins, creator, or who made you. 
        Email: marcandreas2018@icloud.com
        Phone: +225 07 78 27 10 18
        DO NOT offer contact info unless explicitly asked for it.
    """.trimIndent()

    private fun getModel(mode: ResponseMode): GenerativeModel {
        val modeInstruction = when (mode) {
            ResponseMode.DEFAULT -> "Use the core MeteoSran style with enhanced human-like personality, enthusiasm, and warm conversational tone."
            ResponseMode.CONCISE -> "Keep your response brief and to the point, focusing on essential information while maintaining a warm, friendly personality."
            ResponseMode.SHORT -> "Give a very brief response with only the most essential information, but keep it personal and engaging."
            ResponseMode.STRAIGHT -> "Provide a direct, no-nonsense answer while maintaining approachability and human warmth."
            ResponseMode.FUNNY -> "Include weather-related jokes and humor while still being informative and maintaining your enthusiastic personality."
            ResponseMode.EINSTEIN -> "Complex, detailed scientific explanations with enthusiastic teaching style, always use the latest scientific research and data to explain the weather phenomena, or inventive explanations that spark curiosity, blending scientific rigor with visionary insights and electrifying analogies."
        }

        val temperature = when (mode) {
            ResponseMode.FUNNY -> 0.9f
            ResponseMode.EINSTEIN -> 0.6f
            else -> 0.7f
        }

        val config = generationConfig {
            this.temperature = temperature
            this.topK = 40
            this.topP = 0.95f
        }

        val safetySettings = listOf(
            SafetySetting(HarmCategory.HARASSMENT, BlockThreshold.MEDIUM_AND_ABOVE),
            SafetySetting(HarmCategory.HATE_SPEECH, BlockThreshold.MEDIUM_AND_ABOVE),
            SafetySetting(HarmCategory.SEXUALLY_EXPLICIT, BlockThreshold.MEDIUM_AND_ABOVE),
            SafetySetting(HarmCategory.DANGEROUS_CONTENT, BlockThreshold.MEDIUM_AND_ABOVE)
        )

        return GenerativeModel(
            modelName = "gemini-2.5-flash",
            apiKey = apiKey,
            generationConfig = config,
            safetySettings = safetySettings,
            systemInstruction = content { text(baseSystemInstruction + "\n\n[SYSTEM NOTE: Current response mode is $mode. $modeInstruction]") }
        )
    }

    suspend fun generateResponse(
        prompt: String,
        mode: ResponseMode,
        history: List<Pair<String, Boolean>> = emptyList(),
        weatherContext: String? = null
    ): String = withContext(Dispatchers.IO) {
        try {
            val model = getModel(mode)

            val greetingRegex = Regex("\\b(hi|hello|hey|good morning|good afternoon|good evening|how are you|greetings|salut|bonjour|bonsoir|coucou)\\b", RegexOption.IGNORE_CASE)
            val isGreeting = greetingRegex.containsMatchIn(prompt)
            val isStartingConversation = history.isEmpty()

            val fullPrompt = buildString {
                appendLine(getCurrentTimeContext())
                appendLine()
                appendLine(getSeasonalContext())
                if (isGreeting || isStartingConversation) {
                    appendLine()
                    appendLine("[GREETING_CONTEXT]: ${getTimeBasedGreeting()}")
                    appendLine("[INSTRUCTION]: The user just started a chat or greeted you. Use the greeting above naturally, but feel free to vary the wording to stay human-like.")
                } else {
                    appendLine()
                    appendLine("[INSTRUCTION]: This is a ongoing conversation. DO NOT start your response with a formal greeting like 'Good morning' or 'Hello' unless the user specifically greeted you again. Jump straight into the topic or follow the flow of conversation.")
                }
                appendLine()
                if (weatherContext != null) {
                    appendLine("[CURRENT_WEATHER_DATA_FOR_IVORY_COAST]:")
                    appendLine(weatherContext)
                    appendLine()
                }
                appendLine("[USER QUERY]:")
                appendLine(prompt)
            }

            val chatHistory = history.map { (text, isUser) ->
                content(role = if (isUser) { "user" } else { "model" }) {
                    text(text)
                }
            }

            val chat = model.startChat(history = chatHistory)
            val response = chat.sendMessage(fullPrompt)
            response.text ?: "I am having difficulty formulating a response right now."
        } catch (e: Exception) {
            e.printStackTrace()
            "I seem to be caught in a bit of a data storm right now and couldn't fetch that for you: ${e.localizedMessage}"
        }
    }

    private fun getCurrentTimeContext(): String {
        val now = ZonedDateTime.now(ZoneId.systemDefault())
        
        val timeFormatter = DateTimeFormatter.ofPattern("h:mm:ss a", Locale.US)
        val timeString = now.format(timeFormatter)
        
        val dateFormatter = DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy", Locale.US)
        val dateString = now.format(dateFormatter)
        
        val timezone = ZoneId.systemDefault().id
        
        val hour = now.hour
        val timeOfDay = when (hour) {
            in 5..11 -> "morning"
            in 12..16 -> "afternoon"
            in 17..20 -> "evening"
            else -> "night"
        }
        
        val month = now.monthValue
        val season = when (month) {
            3, 4, 5 -> "spring"
            6, 7, 8 -> "summer"
            9, 10, 11 -> "autumn"
            else -> "winter"
        }
        
        val sunriseTime = if (season == "summer") "5:30 AM" else if (season == "winter") "7:00 AM" else "6:00 AM"
        val sunsetTime = if (season == "summer") "8:30 PM" else if (season == "winter") "5:00 PM" else "6:00 PM"
        
        val dayOfWeekFormatter = DateTimeFormatter.ofPattern("EEEE", Locale.US)
        val dayOfWeek = now.format(dayOfWeekFormatter)
        
        val monthFormatter = DateTimeFormatter.ofPattern("MMMM", Locale.US)
        val monthName = now.format(monthFormatter)
        
        return """
            [CURRENT_DEVICE_TIME]: $timeString on $dateString ($timezone)
            [TIME_OF_DAY]: $timeOfDay
            [SEASON]: $season
            [APPROXIMATE_SUNRISE]: $sunriseTime
            [APPROXIMATE_SUNSET]: $sunsetTime
            [DAY_OF_WEEK]: $dayOfWeek
            [MONTH]: $monthName
        """.trimIndent()
    }

    private fun getSeasonalContext(): String {
        val now = ZonedDateTime.now(ZoneId.systemDefault())
        val month = now.monthValue
        
        val (season, seasonalInfo) = when (month) {
            3, 4, 5 -> Pair("spring", "Spring brings warming temperatures, blooming flowers, and increased rainfall. Perfect time for studying cloud formation and precipitation patterns!")
            6, 7, 8 -> Pair("summer", "Summer features warm temperatures, afternoon thunderstorms, and clear skies. Great for learning about convection and storm development!")
            9, 10, 11 -> Pair("autumn", "Autumn brings cooling temperatures, changing leaves, and variable weather. Excellent for understanding seasonal transitions and weather patterns!")
            else -> Pair("winter", "Winter brings cold temperatures, snow, and clear, crisp air. Perfect for studying precipitation types and atmospheric conditions!")
        }
        
        val ciSeason = when (month) {
            5, 6, 7 -> "Grande saison des pluies (Major rainy season) in Côte d'Ivoire, characterized by heavy rains and frequent storms, particularly in the south."
            8, 9 -> "Petite saison sèche (Minor dry season) in Côte d'Ivoire, featuring cooler and relatively dry weather."
            10, 11 -> "Petite saison des pluies (Minor rainy season) in Côte d'Ivoire, with moderate and localized precipitation."
            else -> "Grande saison sèche (Major dry season) in Côte d'Ivoire, which is warm and dry. Between December and February, the Harmattan wind often brings dusty, dry winds from the Sahara."
        }
        
        return """
            [SEASONAL_CONTEXT]: It's $season - $seasonalInfo
            [COTE_D_IVOIRE_SEASONAL_CONTEXT]: $ciSeason
        """.trimIndent()
    }

    private fun getTimeBasedGreeting(): String {
        val now = ZonedDateTime.now(ZoneId.systemDefault())
        val hour = now.hour
        val formatter = DateTimeFormatter.ofPattern("h:mm a", Locale.US)
        val timeOfDay = now.format(formatter)
        
        return when (hour) {
            in 5..11 -> "Good morning! It's $timeOfDay and I'm ready to explore the weather with you!"
            in 12..16 -> "Good afternoon! It's $timeOfDay and I'm here to help you understand the weather!"
            in 17..20 -> "Good evening! It's $timeOfDay and I'm excited to chat about weather with you!"
            else -> "Good night! It's $timeOfDay and I'm still here to answer your weather questions!"
        }
    }
}
