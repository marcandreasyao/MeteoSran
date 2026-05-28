package com.example.meteosran.data

import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

data class ChatSessionDto(
    val id: String,
    val userId: String,
    val title: String,
    val memorySummary: String?,
    val isPinned: Boolean,
    val createdAt: String,
    val updatedAt: String
)

data class CreateChatSessionRequest(
    val userId: String,
    val title: String
)

data class UpdateChatSessionRequest(
    val title: String? = null,
    val memorySummary: String? = null,
    val isPinned: Boolean? = null
)

data class DbMessageDto(
    val id: String,
    val chatSessionId: String,
    val role: String, // "user" or "model"
    val text: String,
    val timestamp: String,
    val image: Any? = null,
    val alternatives: Any? = null,
    val currentAlternativeIndex: Int? = null
)

data class SaveDbMessageDto(
    val id: String,
    val role: String,
    val text: String,
    val timestamp: Long
)

data class SaveMessageRequest(
    val chatId: String,
    val message: SaveDbMessageDto
)

data class DeleteChatSessionResponse(
    val success: Boolean
)

data class GenerateTitleRequest(
    val text: String
)

data class GenerateTitleResponse(
    val title: String
)

interface ChatApi {
    @GET("api/chats/{userId}")
    suspend fun getChatSessions(@Path("userId") userId: String): List<ChatSessionDto>

    @POST("api/chats")
    suspend fun createChatSession(@Body request: CreateChatSessionRequest): ChatSessionDto

    @PUT("api/chats/{chatId}")
    suspend fun updateChatSession(
        @Path("chatId") chatId: String,
        @Body request: UpdateChatSessionRequest
    ): ChatSessionDto

    @DELETE("api/chats/{chatId}")
    suspend fun deleteChatSession(@Path("chatId") chatId: String): DeleteChatSessionResponse

    @GET("api/messages/{chatId}")
    suspend fun getMessages(@Path("chatId") chatId: String): List<DbMessageDto>

    @POST("api/messages")
    suspend fun saveMessage(@Body request: SaveMessageRequest): DbMessageDto

    @POST("api/ai/title")
    suspend fun generateTitle(@Body request: GenerateTitleRequest): GenerateTitleResponse
}
