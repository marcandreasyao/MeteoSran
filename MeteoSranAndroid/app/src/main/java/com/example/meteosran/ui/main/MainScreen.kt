package com.example.meteosran.ui.main

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation3.runtime.NavKey
import coil.compose.AsyncImage
import com.example.meteosran.R
import com.example.meteosran.data.ForecastDay
import com.example.meteosran.data.ResponseMode
import com.example.meteosran.data.WeatherResponse
import com.example.meteosran.data.ChatSessionDto
import com.example.meteosran.theme.MeteoSranBlue
import com.example.meteosran.theme.MeteoSranTheme
import com.example.meteosran.ui.components.AnimatedOrbBackground
import com.example.meteosran.ui.components.GlassCard
import kotlinx.coroutines.launch

@Composable
fun MainScreen(
    onItemClick: (NavKey) -> Unit,
    onLogout: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: MainScreenViewModel = viewModel()
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var showSettingsDialog by remember { mutableStateOf(false) }

    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val coroutineScope = rememberCoroutineScope()

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                drawerShape = RoundedCornerShape(topEnd = 24.dp, bottomEnd = 24.dp),
                drawerContainerColor = if (MeteoSranTheme.customColors.isDark) Color(0xFF1E293B) else Color.White,
                modifier = Modifier
                    .width(300.dp)
                    .fillMaxHeight()
            ) {
                SidebarDrawerContent(
                    state = state,
                    onNewChatClicked = {
                        viewModel.createNewChat()
                        coroutineScope.launch { drawerState.close() }
                    },
                    onSessionClicked = { chatId ->
                        viewModel.selectChatSession(chatId)
                        coroutineScope.launch { drawerState.close() }
                    },
                    onRenameSession = { chatId, newTitle ->
                        viewModel.renameChatSession(chatId, newTitle)
                    },
                    onDeleteSession = { chatId ->
                        viewModel.deleteChatSession(chatId)
                    },
                    onLogoutClicked = {
                        viewModel.logout(onLogout)
                    }
                )
            }
        }
    ) {
        AnimatedOrbBackground {
            Box(modifier = modifier.fillMaxSize()) {
                Column(
                    modifier = Modifier.fillMaxSize()
                ) {
                    // Sleek Header with Hamburger Toggle
                    HeaderBar(
                        selectedMode = state.selectedMode,
                        onModeSelected = { viewModel.setMode(it) },
                        onSettingsClicked = { showSettingsDialog = true },
                        onMenuClicked = {
                            coroutineScope.launch { drawerState.open() }
                        }
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
                        val isLandscape = maxWidth > maxHeight
                        if (isLandscape) {
                            // Landscape Grid Layout
                            Row(
                                modifier = Modifier.fillMaxSize(),
                                horizontalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                WeatherSection(
                                    weather = state.weather,
                                    loading = state.weatherLoading,
                                    error = state.weatherError,
                                    onRefresh = { viewModel.fetchWeather() },
                                    modifier = Modifier
                                        .weight(0.45f)
                                        .fillMaxHeight()
                                )
                                ChatSection(
                                    messages = state.chatMessages,
                                    chatLoading = state.chatLoading,
                                    databaseError = state.databaseError,
                                    onSendMessage = { viewModel.sendMessage(it) },
                                    onClearChat = { viewModel.clearChat() },
                                    modifier = Modifier
                                        .weight(0.55f)
                                        .fillMaxHeight()
                                )
                            }
                        } else {
                            // Portrait Vertical Stack
                            Column(
                                modifier = Modifier.fillMaxSize(),
                                verticalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                WeatherSection(
                                    weather = state.weather,
                                    loading = state.weatherLoading,
                                    error = state.weatherError,
                                    onRefresh = { viewModel.fetchWeather() },
                                    modifier = Modifier
                                        .weight(0.48f)
                                        .fillMaxWidth()
                                )
                                ChatSection(
                                    messages = state.chatMessages,
                                    chatLoading = state.chatLoading,
                                    databaseError = state.databaseError,
                                    onSendMessage = { viewModel.sendMessage(it) },
                                    onClearChat = { viewModel.clearChat() },
                                    modifier = Modifier
                                        .weight(0.52f)
                                        .fillMaxWidth()
                                )
                            }
                        }
                    }
                }

                // Settings modal for API Key input
                if (showSettingsDialog) {
                    SettingsDialog(
                        currentApiKey = state.geminiApiKey,
                        onSave = {
                            viewModel.setApiKey(it)
                            showSettingsDialog = false
                        },
                        onDismiss = { showSettingsDialog = false }
                    )
                }
            }
        }
    }
}

@Composable
fun SidebarDrawerContent(
    state: MainScreenState,
    onNewChatClicked: () -> Unit,
    onSessionClicked: (String) -> Unit,
    onRenameSession: (String, String) -> Unit,
    onDeleteSession: (String) -> Unit,
    onLogoutClicked: () -> Unit
) {
    val isDark = MeteoSranTheme.customColors.isDark
    var editingSessionId by remember { mutableStateOf<String?>(null) }
    var editTitleText by remember { mutableStateOf("") }
    var deletingSessionId by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp)
    ) {
        // App Header in Drawer
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.padding(bottom = 16.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(
                        Brush.linearGradient(
                            colors = listOf(Color(0xFF3B82F6), Color(0xFF8B5CF6))
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Image(
                    painter = painterResource(id = R.drawable.meteosran_logo),
                    contentDescription = null,
                    modifier = Modifier.size(24.dp)
                )
            }
            Text(
                text = "MeteoSran",
                fontFamily = MeteoSranTheme.typography.titleLarge.fontFamily,
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp,
                color = if (isDark) Color.White else Color(0xFF0F172A)
            )
        }

        // Profile Section
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(if (isDark) Color(0x1AFFFFFF) else Color(0x05000000))
                .padding(12.dp)
        ) {
            Text(
                text = state.displayName ?: "Utilisateur",
                fontFamily = MeteoSranTheme.typography.bodyMedium.fontFamily,
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp,
                color = if (isDark) Color.White else Color(0xFF0F172A)
            )
            Text(
                text = state.userEmail ?: "",
                fontFamily = MeteoSranTheme.typography.bodySmall.fontFamily,
                fontSize = 11.sp,
                color = if (isDark) Color(0xFF94A3B8) else Color(0xFF64748B)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // New Chat Button
        Button(
            onClick = onNewChatClicked,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = MeteoSranBlue,
                contentColor = Color.White
            )
        ) {
            Icon(
                imageVector = Icons.Default.Add,
                contentDescription = null,
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Nouvelle Conversation",
                fontFamily = MeteoSranTheme.typography.bodyMedium.fontFamily,
                fontWeight = FontWeight.SemiBold,
                fontSize = 13.sp
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Conversations List Title
        Text(
            text = "Historique",
            fontFamily = MeteoSranTheme.typography.titleSmall.fontFamily,
            fontWeight = FontWeight.Bold,
            fontSize = 12.sp,
            color = if (isDark) Color(0xFF64748B) else Color(0xFF94A3B8),
            modifier = Modifier.padding(bottom = 8.dp)
        )

        // Scrollable List
        Box(modifier = Modifier.weight(1f)) {
            if (state.sidebarLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = MeteoSranBlue, modifier = Modifier.size(24.dp))
                }
            } else if (state.chatSessions.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        text = "Aucun historique",
                        fontFamily = MeteoSranTheme.typography.bodySmall.fontFamily,
                        fontSize = 12.sp,
                        color = if (isDark) Color(0xFF64748B) else Color(0xFF94A3B8)
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    items(state.chatSessions) { session ->
                        val isActive = session.id == state.activeChatId
                        val isEditing = session.id == editingSessionId
                        val isDeleting = session.id == deletingSessionId

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(
                                    if (isActive) {
                                        if (isDark) Color(0x260EA5E9) else Color(0x1F0EA5E9)
                                    } else {
                                        Color.Transparent
                                    }
                                )
                                .clickable(enabled = !isEditing) { onSessionClicked(session.id) }
                                .padding(horizontal = 8.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.ChatBubble,
                                contentDescription = null,
                                tint = if (isActive) MeteoSranBlue else (if (isDark) Color(0xFF64748B) else Color(0xFF94A3B8)),
                                modifier = Modifier.size(16.dp)
                            )

                            Spacer(modifier = Modifier.width(8.dp))

                            if (isEditing) {
                                // Inline Rename Input
                                BasicTextField(
                                    value = editTitleText,
                                    onValueChange = { editTitleText = it },
                                    textStyle = LocalTextStyle.current.copy(
                                        color = if (isDark) Color.White else Color(0xFF0F172A),
                                        fontSize = 13.sp,
                                        fontFamily = MeteoSranTheme.typography.bodyMedium.fontFamily
                                    ),
                                    modifier = Modifier
                                        .weight(1f)
                                        .background(if (isDark) Color(0x33000000) else Color(0x0A000000), RoundedCornerShape(4.dp))
                                        .padding(horizontal = 6.dp, vertical = 4.dp),
                                    singleLine = true
                                )
                                
                                Spacer(modifier = Modifier.width(4.dp))

                                IconButton(
                                    onClick = {
                                        onRenameSession(session.id, editTitleText)
                                        editingSessionId = null
                                    },
                                    modifier = Modifier.size(24.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = "Valider",
                                        tint = Color.Green,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }

                                IconButton(
                                    onClick = { editingSessionId = null },
                                    modifier = Modifier.size(24.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Close,
                                        contentDescription = "Annuler",
                                        tint = Color.Red,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            } else if (isDeleting) {
                                // Inline Confirm Delete Input
                                Text(
                                    text = "Supprimer ?",
                                    fontFamily = MeteoSranTheme.typography.bodyMedium.fontFamily,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.Red,
                                    modifier = Modifier.weight(1f)
                                )

                                IconButton(
                                    onClick = {
                                        onDeleteSession(session.id)
                                        deletingSessionId = null
                                    },
                                    modifier = Modifier.size(24.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = "Confirmer la suppression",
                                        tint = Color.Red,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }

                                IconButton(
                                    onClick = { deletingSessionId = null },
                                    modifier = Modifier.size(24.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Close,
                                        contentDescription = "Annuler",
                                        tint = if (isDark) Color.White else Color(0xFF0F172A),
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            } else {
                                // Default Session Row item
                                Text(
                                    text = session.title,
                                    fontFamily = MeteoSranTheme.typography.bodyMedium.fontFamily,
                                    fontSize = 13.sp,
                                    fontWeight = if (isActive) FontWeight.SemiBold else FontWeight.Normal,
                                    color = if (isActive) MeteoSranBlue else (if (isDark) Color.White else Color(0xFF0F172A)),
                                    maxLines = 1,
                                    modifier = Modifier.weight(1f)
                                )

                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    IconButton(
                                        onClick = {
                                            editingSessionId = session.id
                                            editTitleText = session.title
                                        },
                                        modifier = Modifier.size(24.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Edit,
                                            contentDescription = "Renommer",
                                            tint = if (isDark) Color(0xFF64748B) else Color(0xFF94A3B8),
                                            modifier = Modifier.size(14.dp)
                                        )
                                    }

                                    IconButton(
                                        onClick = { deletingSessionId = session.id },
                                        modifier = Modifier.size(24.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Delete,
                                            contentDescription = "Supprimer",
                                            tint = if (isDark) Color(0xFF64748B) else Color(0xFF94A3B8),
                                            modifier = Modifier.size(14.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
        HorizontalDivider(color = if (isDark) Color(0x1AFFFFFF) else Color(0x1F000000))
        Spacer(modifier = Modifier.height(16.dp))

        // Logout Button
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .clickable { onLogoutClicked() }
                .padding(horizontal = 8.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ExitToApp,
                contentDescription = "Déconnexion",
                tint = Color.Red.copy(alpha = 0.8f),
                modifier = Modifier.size(18.dp)
            )
            Text(
                text = "Déconnexion",
                fontFamily = MeteoSranTheme.typography.bodyMedium.fontFamily,
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp,
                color = Color.Red.copy(alpha = 0.8f)
            )
        }
    }
}

@Composable
fun HeaderBar(
    selectedMode: ResponseMode,
    onModeSelected: (ResponseMode) -> Unit,
    onSettingsClicked: () -> Unit,
    onMenuClicked: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            IconButton(
                onClick = onMenuClicked,
                modifier = Modifier
                    .clip(CircleShape)
                    .background(MeteoSranTheme.customColors.glassBackground)
            ) {
                Icon(
                    imageVector = Icons.Default.Menu,
                    contentDescription = "Ouvrir le menu",
                    tint = if (MeteoSranTheme.customColors.isDark) Color.White else Color(0xFF334155)
                )
            }

            Column {
                Text(
                    text = "MeteoSran",
                    fontFamily = MeteoSranTheme.typography.titleLarge.fontFamily,
                    fontWeight = FontWeight.Bold,
                    fontSize = 24.sp,
                    color = if (MeteoSranTheme.customColors.isDark) Color.White else Color(0xFF0F172A)
                )
                Text(
                    text = "Intelligence Météorologique",
                    fontFamily = MeteoSranTheme.typography.bodySmall.fontFamily,
                    color = if (MeteoSranTheme.customColors.isDark) Color(0xFF94A3B8) else Color(0xFF64748B),
                    fontSize = 12.sp
                )
            }
        }

        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            ModeSelectorDropdown(
                selectedMode = selectedMode,
                onModeSelected = onModeSelected
            )

            IconButton(
                onClick = onSettingsClicked,
                modifier = Modifier
                    .clip(CircleShape)
                    .background(MeteoSranTheme.customColors.glassBackground)
            ) {
                Icon(
                    imageVector = Icons.Default.Settings,
                    contentDescription = "Clé API Settings",
                    tint = if (MeteoSranTheme.customColors.isDark) Color.White else Color(0xFF334155)
                )
            }
        }
    }
}

private data class ModeDetails(
    val name: String,
    val icon: String,
    val description: String
)

private val ResponseModeDetails = mapOf(
    ResponseMode.DEFAULT to ModeDetails("Par défaut", "🌤️", "Réponses équilibrées, amicales et informatives"),
    ResponseMode.CONCISE to ModeDetails("Concise", "📝", "Explications brèves et allant droit au but"),
    ResponseMode.SHORT to ModeDetails("Court", "⚡", "Réponses très courtes avec les infos essentielles"),
    ResponseMode.STRAIGHT to ModeDetails("Direct", "🎯", "Réponses directes, sans chichis"),
    ResponseMode.FUNNY to ModeDetails("Drôle", "😄", "Explications humoristiques avec blagues météo"),
    ResponseMode.EINSTEIN to ModeDetails("Einstein", "🧠", "Explications scientifiques complexes et détaillées")
)

@Composable
fun ModeSelectorDropdown(
    selectedMode: ResponseMode,
    onModeSelected: (ResponseMode) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    val details = ResponseModeDetails[selectedMode] ?: ResponseModeDetails[ResponseMode.DEFAULT]!!
    val isDark = MeteoSranTheme.customColors.isDark

    Box {
        Row(
            modifier = Modifier
                .clip(RoundedCornerShape(16.dp))
                .background(MeteoSranTheme.customColors.glassBackground)
                .border(
                    BorderStroke(
                        1.dp,
                        if (isDark) Color(0x33FFFFFF) else Color(0x1F000000)
                    ),
                    RoundedCornerShape(16.dp)
                )
                .clickable { expanded = true }
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = details.icon,
                fontSize = 14.sp
            )
            Text(
                text = details.name,
                fontFamily = MeteoSranTheme.typography.bodyMedium.fontFamily,
                fontWeight = FontWeight.Medium,
                fontSize = 13.sp,
                color = if (isDark) Color.White else Color(0xFF334155)
            )
            Icon(
                imageVector = Icons.Default.ArrowDropDown,
                contentDescription = "Ouvrir le sélecteur",
                tint = if (isDark) Color(0xFF94A3B8) else Color(0xFF64748B),
                modifier = Modifier.size(16.dp)
            )
        }

        val cardBg = if (isDark) Color(0xFF1E293B) else Color.White
        val cardBorder = if (isDark) Color(0x33FFFFFF) else Color(0x1F000000)

        MaterialTheme(
            colorScheme = MaterialTheme.colorScheme.copy(
                surface = cardBg
            ),
            shapes = MaterialTheme.shapes.copy(
                extraSmall = RoundedCornerShape(16.dp)
            )
        ) {
            DropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false },
                modifier = Modifier
                    .width(280.dp)
                    .background(cardBg)
                    .border(BorderStroke(1.dp, cardBorder), RoundedCornerShape(16.dp))
            ) {
                ResponseMode.entries.forEach { mode ->
                    val modeDetails = ResponseModeDetails[mode] ?: ResponseModeDetails[ResponseMode.DEFAULT]!!
                    val isSelected = mode == selectedMode
                    DropdownMenuItem(
                        text = {
                            Column(modifier = Modifier.padding(vertical = 4.dp)) {
                                Text(
                                    text = modeDetails.name,
                                    fontFamily = MeteoSranTheme.typography.bodyMedium.fontFamily,
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 14.sp,
                                    color = if (isSelected) MeteoSranBlue else (if (isDark) Color.White else Color(0xFF0F172A))
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = modeDetails.description,
                                    fontFamily = MeteoSranTheme.typography.bodySmall.fontFamily,
                                    fontSize = 11.sp,
                                    color = if (isSelected) MeteoSranBlue.copy(alpha = 0.8f) else (if (isDark) Color(0xFF94A3B8) else Color(0xFF64748B)),
                                    lineHeight = 14.sp
                                )
                            }
                        },
                        leadingIcon = {
                            Text(
                                text = modeDetails.icon,
                                fontSize = 18.sp,
                                modifier = Modifier.padding(end = 4.dp)
                            )
                        },
                        onClick = {
                            onModeSelected(mode)
                            expanded = false
                        },
                        colors = MenuDefaults.itemColors(
                            textColor = if (isDark) Color.White else Color(0xFF0F172A)
                        ),
                        modifier = Modifier
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(
                                if (isSelected) {
                                    if (isDark) Color(0x260EA5E9) else Color(0x1F0EA5E9)
                                } else {
                                    Color.Transparent
                                }
                            )
                    )
                }
            }
        }
    }
}

@Composable
fun WeatherSection(
    weather: WeatherResponse?,
    loading: Boolean,
    error: String?,
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier
) {
    GlassCard(modifier = modifier) {
        if (loading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = MeteoSranBlue)
            }
        } else if (error != null) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = error,
                    color = Color.Red,
                    textAlign = TextAlign.Center,
                    fontFamily = MeteoSranTheme.typography.bodyMedium.fontFamily
                )
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = onRefresh,
                    colors = ButtonDefaults.buttonColors(containerColor = MeteoSranBlue)
                ) {
                    Icon(imageVector = Icons.Default.Refresh, contentDescription = "Réessayer")
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Réessayer", fontFamily = MeteoSranTheme.typography.bodyMedium.fontFamily)
                }
            }
        } else if (weather != null) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Location & Icon Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = weather.location,
                            fontFamily = MeteoSranTheme.typography.titleLarge.fontFamily,
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp,
                            color = if (MeteoSranTheme.customColors.isDark) Color.White else Color(0xFF0F172A)
                        )
                        Text(
                            text = weather.weatherText,
                            fontFamily = MeteoSranTheme.typography.bodyMedium.fontFamily,
                            color = if (MeteoSranTheme.customColors.isDark) Color(0xFF94A3B8) else Color(0xFF64748B),
                            fontSize = 14.sp
                        )
                    }

                    if (!weather.iconUrl.isNullOrEmpty()) {
                        AsyncImage(
                            model = weather.iconUrl,
                            contentDescription = weather.weatherText,
                            modifier = Modifier.size(64.dp),
                            contentScale = ContentScale.Fit
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Temperature Info
                Row(
                    verticalAlignment = Alignment.Bottom
                ) {
                    Text(
                        text = "${weather.temperature}",
                        fontFamily = MeteoSranTheme.typography.headlineLarge.fontFamily,
                        fontWeight = FontWeight.Bold,
                        fontSize = 54.sp,
                        color = if (MeteoSranTheme.customColors.isDark) Color.White else Color(0xFF0F172A)
                    )
                    Text(
                        text = "°${weather.unit}",
                        fontFamily = MeteoSranTheme.typography.headlineSmall.fontFamily,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 24.sp,
                        color = MeteoSranBlue,
                        modifier = Modifier.padding(bottom = 10.dp)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Telemetry Details Grid
                TelemetryGrid(weather = weather)

                Spacer(modifier = Modifier.height(16.dp))

                // Horizontal Forecast Row
                Text(
                    text = "Prévisions sur 6 jours",
                    fontFamily = MeteoSranTheme.typography.titleSmall.fontFamily,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 13.sp,
                    color = if (MeteoSranTheme.customColors.isDark) Color(0xFF94A3B8) else Color(0xFF475569)
                )

                Spacer(modifier = Modifier.height(8.dp))

                val forecastList = weather.forecast
                if (!forecastList.isNullOrEmpty()) {
                    LazyRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(forecastList) { day ->
                            ForecastItem(day = day)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun TelemetryGrid(weather: WeatherResponse) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Column(modifier = Modifier.weight(1f)) {
            TelemetryRow("Ressenti", "${weather.realFeelTemperature.value}°${weather.realFeelTemperature.unit}")
            TelemetryRow("Humidité", "${weather.relativeHumidity}%")
            TelemetryRow("UV Index", "${weather.uvIndex} (${weather.uvIndexText})")
        }
        Column(modifier = Modifier.weight(1f)) {
            TelemetryRow("Vent", "${weather.wind.speed} ${weather.wind.unit} ${weather.wind.direction}")
            TelemetryRow("Pression", "${weather.pressure.value} ${weather.pressure.unit}")
            TelemetryRow("Précip.", "${weather.precip_mm ?: 0.0} mm")
        }
    }
}

@Composable
fun TelemetryRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            fontFamily = MeteoSranTheme.typography.bodySmall.fontFamily,
            color = if (MeteoSranTheme.customColors.isDark) Color(0xFF64748B) else Color(0xFF94A3B8),
            fontSize = 12.sp
        )
        Text(
            text = value,
            fontFamily = MeteoSranTheme.typography.bodySmall.fontFamily,
            fontWeight = FontWeight.Medium,
            color = if (MeteoSranTheme.customColors.isDark) Color.White else Color(0xFF334155),
            fontSize = 12.sp
        )
    }
}

@Composable
fun ForecastItem(day: ForecastDay) {
    Column(
        modifier = Modifier
            .width(72.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0x0F000000))
            .padding(8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = day.dayOfWeek,
            fontFamily = MeteoSranTheme.typography.labelSmall.fontFamily,
            fontWeight = FontWeight.SemiBold,
            fontSize = 11.sp,
            color = if (MeteoSranTheme.customColors.isDark) Color.White else Color(0xFF334155)
        )

        AsyncImage(
            model = day.iconUrl,
            contentDescription = day.conditionText,
            modifier = Modifier.size(32.dp)
        )

        Text(
            text = "${day.maxTemp.toInt()}°",
            fontFamily = MeteoSranTheme.typography.labelMedium.fontFamily,
            fontWeight = FontWeight.Bold,
            fontSize = 12.sp,
            color = if (MeteoSranTheme.customColors.isDark) Color.White else Color(0xFF1E293B)
        )

        Text(
            text = "${day.minTemp.toInt()}°",
            fontFamily = MeteoSranTheme.typography.labelSmall.fontFamily,
            fontSize = 10.sp,
            color = if (MeteoSranTheme.customColors.isDark) Color(0xFF64748B) else Color(0xFF94A3B8)
        )
    }
}

@Composable
fun ChatSection(
    messages: List<ChatMessage>,
    chatLoading: Boolean,
    databaseError: String?,
    onSendMessage: (String) -> Unit,
    onClearChat: () -> Unit,
    modifier: Modifier = Modifier
) {
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()
    var textInput by remember { mutableStateOf("") }

    val focusManager = LocalFocusManager.current
    val keyboardController = LocalSoftwareKeyboardController.current

    // Keep chat scrolled to bottom when new messages arrive
    LaunchedEffect(messages.size, chatLoading) {
        if (messages.isNotEmpty()) {
            coroutineScope.launch {
                listState.animateScrollToItem(messages.size - 1)
            }
        }
    }

    GlassCard(modifier = modifier) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Chat header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Assistant IA MeteoSran",
                    fontFamily = MeteoSranTheme.typography.titleMedium.fontFamily,
                    fontWeight = FontWeight.Bold,
                    color = if (MeteoSranTheme.customColors.isDark) Color.White else Color(0xFF0F172A)
                )

                if (messages.isNotEmpty()) {
                    Text(
                        text = "Effacer",
                        modifier = Modifier
                            .clickable { onClearChat() }
                            .padding(4.dp),
                        fontFamily = MeteoSranTheme.typography.labelSmall.fontFamily,
                        color = Color.Red.copy(alpha = 0.8f),
                        fontSize = 11.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Database error warning banner if any
            databaseError?.let {
                Text(
                    text = it,
                    color = Color.Red,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Scrolling bubble lists
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) {
                if (messages.isEmpty()) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = "Aide",
                            tint = MeteoSranBlue.copy(alpha = 0.5f),
                            modifier = Modifier.size(36.dp)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Posez une question sur le temps qu'il fait en Côte d'Ivoire. MeteoSran vous expliquera tout de manière ludique !",
                            fontSize = 12.sp,
                            textAlign = TextAlign.Center,
                            fontFamily = MeteoSranTheme.typography.bodySmall.fontFamily,
                            color = if (MeteoSranTheme.customColors.isDark) Color(0xFF64748B) else Color(0xFF94A3B8)
                        )
                    }
                } else {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(messages) { message ->
                            ChatBubble(message = message)
                        }

                        if (chatLoading) {
                            item {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(8.dp),
                                    contentAlignment = Alignment.CenterStart
                                ) {
                                    CircularProgressIndicator(
                                        color = MeteoSranBlue,
                                        modifier = Modifier.size(20.dp),
                                        strokeWidth = 2.dp
                                    )
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Input Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = textInput,
                    onValueChange = { textInput = it },
                    placeholder = {
                        Text(
                            "Poser une question...",
                            fontFamily = MeteoSranTheme.typography.bodyMedium.fontFamily,
                            fontSize = 13.sp
                        )
                    },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(16.dp),
                    maxLines = 3,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                    keyboardActions = KeyboardActions(
                        onSend = {
                            if (textInput.isNotBlank()) {
                                onSendMessage(textInput)
                                textInput = ""
                                keyboardController?.hide()
                                focusManager.clearFocus()
                            }
                        }
                    ),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MeteoSranBlue,
                        unfocusedBorderColor = if (MeteoSranTheme.customColors.isDark) Color(0x33FFFFFF) else Color(0x33000000),
                        focusedContainerColor = Color(0x0A000000),
                        unfocusedContainerColor = Color(0x05000000)
                    )
                )

                IconButton(
                    onClick = {
                        if (textInput.isNotBlank()) {
                            onSendMessage(textInput)
                            textInput = ""
                            keyboardController?.hide()
                            focusManager.clearFocus()
                        }
                    },
                    enabled = textInput.isNotBlank(),
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(if (textInput.isNotBlank()) MeteoSranBlue else Color.Transparent)
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.Send,
                        contentDescription = "Envoyer",
                        tint = if (textInput.isNotBlank()) Color.White else Color.Gray
                    )
                }
            }
        }
    }
}

@Composable
fun ChatBubble(message: ChatMessage) {
    val alignment = if (message.isUser) Alignment.End else Alignment.Start
    val bubbleColor = if (message.isUser) {
        MeteoSranBlue
    } else {
        if (MeteoSranTheme.customColors.isDark) Color(0x1F2E3A59) else Color(0x1F000000)
    }
    val textColor = if (message.isUser) {
        Color.White
    } else {
        if (MeteoSranTheme.customColors.isDark) Color.White else Color(0xFF0F172A)
    }

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = alignment
    ) {
        Box(
            modifier = Modifier
                .widthIn(max = 280.dp)
                .clip(
                    RoundedCornerShape(
                        topStart = 16.dp,
                        topEnd = 16.dp,
                        bottomStart = if (message.isUser) 16.dp else 4.dp,
                        bottomEnd = if (message.isUser) 4.dp else 16.dp
                    )
                )
                .background(bubbleColor)
                .padding(horizontal = 12.dp, vertical = 8.dp)
        ) {
            Text(
                text = message.text,
                color = textColor,
                fontSize = 13.sp,
                fontFamily = MeteoSranTheme.typography.bodyMedium.fontFamily,
                lineHeight = 18.sp
            )
        }
    }
}

@Composable
fun SettingsDialog(
    currentApiKey: String,
    onSave: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var keyInput by remember { mutableStateOf(currentApiKey) }
    val isDark = MeteoSranTheme.customColors.isDark
    val cardBg = if (isDark) Color(0xFF1E293B) else Color.White
    val cardBorder = if (isDark) Color(0x33FFFFFF) else Color(0x1F000000)
    val shape = RoundedCornerShape(24.dp)

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = shape,
            color = cardBg,
            border = BorderStroke(1.dp, cardBorder)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Paramètres de MeteoSran",
                    fontFamily = MeteoSranTheme.typography.titleMedium.fontFamily,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = if (isDark) Color.White else Color(0xFF0F172A)
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "Configurez votre clé API Gemini (gratuite sur Google AI Studio) pour activer l'assistant IA conversationnel.",
                    fontSize = 12.sp,
                    fontFamily = MeteoSranTheme.typography.bodySmall.fontFamily,
                    textAlign = TextAlign.Center,
                    color = if (isDark) Color(0xFF94A3B8) else Color(0xFF475569)
                )

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = keyInput,
                    onValueChange = { keyInput = it },
                    label = { Text("Clé API Gemini", fontFamily = MeteoSranTheme.typography.bodyMedium.fontFamily) },
                    visualTransformation = PasswordVisualTransformation(),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MeteoSranBlue,
                        unfocusedBorderColor = if (isDark) Color(0x33FFFFFF) else Color(0x33000000),
                        focusedLabelColor = MeteoSranBlue,
                        unfocusedLabelColor = if (isDark) Color(0xFF94A3B8) else Color(0xFF64748B),
                        focusedTextColor = if (isDark) Color.White else Color(0xFF0F172A),
                        unfocusedTextColor = if (isDark) Color.White else Color(0xFF0F172A)
                    )
                )

                Spacer(modifier = Modifier.height(20.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss) {
                        Text(
                            "Annuler",
                            fontFamily = MeteoSranTheme.typography.bodyMedium.fontFamily,
                            color = if (isDark) Color(0xFF94A3B8) else Color(0xFF64748B)
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = { onSave(keyInput) },
                        colors = ButtonDefaults.buttonColors(containerColor = MeteoSranBlue),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(
                            "Enregistrer",
                            fontFamily = MeteoSranTheme.typography.bodyMedium.fontFamily,
                            color = Color.White
                        )
                    }
                }
            }
        }
    }
}
