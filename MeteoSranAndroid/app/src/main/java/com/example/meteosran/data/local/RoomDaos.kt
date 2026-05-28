package com.example.meteosran.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface ChatSessionDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSessions(sessions: List<LocalChatSession>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSession(session: LocalChatSession)

    @Query("SELECT * FROM chat_sessions WHERE userId = :userId ORDER BY updatedAt DESC")
    suspend fun getSessionsForUser(userId: String): List<LocalChatSession>

    @Query("DELETE FROM chat_sessions WHERE id = :sessionId")
    suspend fun deleteSession(sessionId: String)

    @Query("UPDATE chat_sessions SET title = :newTitle WHERE id = :sessionId")
    suspend fun updateSessionTitle(sessionId: String, newTitle: String)

    @Query("UPDATE chat_sessions SET memorySummary = :summary WHERE id = :sessionId")
    suspend fun updateSessionMemory(sessionId: String, summary: String)

    @Query("DELETE FROM chat_sessions")
    suspend fun deleteAllSessions()
}

@Dao
interface MessageDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessages(messages: List<LocalMessage>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: LocalMessage)

    @Query("SELECT * FROM messages WHERE chatSessionId = :chatSessionId ORDER BY timestamp ASC")
    suspend fun getMessagesForSession(chatSessionId: String): List<LocalMessage>

    @Query("SELECT * FROM messages WHERE isSynced = 0")
    suspend fun getUnsyncedMessages(): List<LocalMessage>

    @Query("UPDATE messages SET isSynced = 1 WHERE id = :messageId")
    suspend fun markMessageSynced(messageId: String)

    @Query("DELETE FROM messages WHERE chatSessionId = :chatSessionId")
    suspend fun deleteMessagesForSession(chatSessionId: String)

    @Query("DELETE FROM messages")
    suspend fun deleteAllMessages()
}
