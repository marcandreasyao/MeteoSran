package com.example.meteosran.data

import android.content.Context
import android.util.Log
import com.example.meteosran.data.local.*
import com.example.meteosran.ui.main.ChatMessage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ChatRepository(context: Context) {
    private val database = MeteoSranDatabase.getDatabase(context)
    private val chatSessionDao = database.chatSessionDao()
    private val messageDao = database.messageDao()
    private val TAG = "ChatRepository"

    // Convert Local Entities to network/UI DTOs
    private fun LocalChatSession.toDto() = ChatSessionDto(
        id = id,
        userId = userId,
        title = title,
        memorySummary = memorySummary,
        isPinned = isPinned,
        createdAt = createdAt,
        updatedAt = updatedAt
    )

    private fun ChatSessionDto.toLocal(userId: String) = LocalChatSession(
        id = id,
        userId = userId,
        title = title,
        memorySummary = memorySummary,
        isPinned = isPinned,
        createdAt = createdAt,
        updatedAt = updatedAt
    )

    private fun LocalMessage.toChatMessage() = ChatMessage(
        id = id,
        text = text,
        isUser = role == "user",
        timestamp = timestamp,
        image = if (imageBase64 != null && imageMimeType != null && imageName != null) {
            ImageDto(data = imageBase64, mimeType = imageMimeType, name = imageName)
        } else {
            null
        }
    )

    private fun ChatMessage.toLocal(chatId: String, isSynced: Boolean) = LocalMessage(
        id = id,
        chatSessionId = chatId,
        role = if (isUser) "user" else "model",
        text = text,
        timestamp = timestamp,
        imageBase64 = image?.data,
        imageMimeType = image?.mimeType,
        imageName = image?.name,
        isSynced = isSynced
    )

    /**
     * Read cached sessions from local database.
     */
    suspend fun getLocalSessions(userId: String): List<ChatSessionDto> = withContext(Dispatchers.IO) {
        chatSessionDao.getSessionsForUser(userId).map { it.toDto() }
    }

    /**
     * Read cached messages for a session from local database.
     */
    suspend fun getLocalMessages(chatId: String): List<ChatMessage> = withContext(Dispatchers.IO) {
        messageDao.getMessagesForSession(chatId).map { it.toChatMessage() }
    }

    /**
     * Fetch sessions from remote server and cache them in local database.
     */
    suspend fun fetchAndCacheSessions(userId: String): List<ChatSessionDto> = withContext(Dispatchers.IO) {
        try {
            val remote = RetrofitClient.getChatSessions(userId)
            chatSessionDao.insertSessions(remote.map { it.toLocal(userId) })
            remote
        } catch (e: Exception) {
            Log.w(TAG, "Failed to fetch remote sessions, falling back to local: ${e.message}")
            getLocalSessions(userId)
        }
    }

    /**
     * Fetch messages from remote server and cache them in local database.
     */
    suspend fun fetchAndCacheMessages(chatId: String): List<ChatMessage> = withContext(Dispatchers.IO) {
        try {
            val remote = RetrofitClient.getMessages(chatId)
            val localList = remote.map { msg ->
                LocalMessage(
                    id = msg.id,
                    chatSessionId = chatId,
                    role = msg.role,
                    text = msg.text,
                    timestamp = try {
                        java.time.OffsetDateTime.parse(msg.timestamp).toInstant().toEpochMilli()
                    } catch (e: Exception) {
                        System.currentTimeMillis()
                    },
                    imageBase64 = msg.image?.data,
                    imageMimeType = msg.image?.mimeType,
                    imageName = msg.image?.name,
                    isSynced = true
                )
            }
            messageDao.insertMessages(localList)
            localList.map { it.toChatMessage() }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to fetch remote messages, falling back to local: ${e.message}")
            getLocalMessages(chatId)
        }
    }

    /**
     * Inserts a message locally first.
     */
    suspend fun saveMessageLocally(chatId: String, message: ChatMessage, isSynced: Boolean) = withContext(Dispatchers.IO) {
        messageDao.insertMessage(message.toLocal(chatId, isSynced))
    }

    /**
     * Creates/persists a local session.
     */
    suspend fun createLocalSession(userId: String, chatId: String, title: String) = withContext(Dispatchers.IO) {
        val nowIso = java.time.OffsetDateTime.now().toString()
        val local = LocalChatSession(
            id = chatId,
            userId = userId,
            title = title,
            memorySummary = null,
            isPinned = false,
            createdAt = nowIso,
            updatedAt = nowIso
        )
        chatSessionDao.insertSession(local)
    }

    /**
     * Rename a chat session locally and remotely.
     */
    suspend fun renameSession(chatId: String, newTitle: String) = withContext(Dispatchers.IO) {
        chatSessionDao.updateSessionTitle(chatId, newTitle)
        try {
            RetrofitClient.updateChatSession(chatId, title = newTitle)
        } catch (e: Exception) {
            Log.w(TAG, "Failed to rename session remotely, will sync title on next fetch: ${e.message}")
        }
    }

    /**
     * Delete a chat session locally and remotely.
     */
    suspend fun deleteSession(chatId: String) = withContext(Dispatchers.IO) {
        chatSessionDao.deleteSession(chatId)
        messageDao.deleteMessagesForSession(chatId)
        try {
            RetrofitClient.deleteChatSession(chatId)
        } catch (e: Exception) {
            Log.w(TAG, "Failed to delete session remotely: ${e.message}")
        }
    }

    /**
     * Synchronize all locally saved messages that have isSynced = false with PostgreSQL/Neon.
     */
    suspend fun syncPendingMessages() = withContext(Dispatchers.IO) {
        try {
            val unsynced = messageDao.getUnsyncedMessages()
            if (unsynced.isEmpty()) return@withContext

            Log.d(TAG, "Syncing ${unsynced.size} unsynced messages to PostgreSQL...")
            for (msg in unsynced) {
                try {
                    val imageDto = if (msg.imageBase64 != null && msg.imageMimeType != null && msg.imageName != null) {
                        ImageDto(data = msg.imageBase64, mimeType = msg.imageMimeType, name = msg.imageName)
                    } else {
                        null
                    }
                    RetrofitClient.saveMessage(
                        chatId = msg.chatSessionId,
                        id = msg.id,
                        role = msg.role,
                        text = msg.text,
                        timestamp = msg.timestamp,
                        image = imageDto
                    )
                    messageDao.markMessageSynced(msg.id)
                    Log.d(TAG, "Successfully synced message: ${msg.id}")
                } catch (e: Exception) {
                    Log.w(TAG, "Failed to sync message ${msg.id}: ${e.message}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in syncPendingMessages: ${e.message}")
        }
    }
}
