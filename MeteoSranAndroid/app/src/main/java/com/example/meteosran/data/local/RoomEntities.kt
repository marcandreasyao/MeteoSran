package com.example.meteosran.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "chat_sessions")
data class LocalChatSession(
    @PrimaryKey val id: String,
    val userId: String,
    val title: String,
    val memorySummary: String?,
    val isPinned: Boolean,
    val createdAt: String,
    val updatedAt: String
)

@Entity(tableName = "messages")
data class LocalMessage(
    @PrimaryKey val id: String,
    val chatSessionId: String,
    val role: String, // "user" or "model"
    val text: String,
    val timestamp: Long,
    val imageBase64: String? = null,
    val imageMimeType: String? = null,
    val imageName: String? = null,
    val isSynced: Boolean = true
)
