package com.example.meteosran.data

import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.BlockThreshold
import com.google.ai.client.generativeai.type.HarmCategory
import com.google.ai.client.generativeai.type.SafetySetting
import com.google.ai.client.generativeai.type.content
import com.google.ai.client.generativeai.type.generationConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

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

            val fullPrompt = buildString {
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
}
