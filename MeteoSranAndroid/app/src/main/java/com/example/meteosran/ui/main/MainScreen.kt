package com.example.meteosran.ui.main

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation3.runtime.NavKey
import coil.compose.AsyncImage
import com.example.meteosran.data.ForecastDay
import com.example.meteosran.data.ResponseMode
import com.example.meteosran.data.WeatherResponse
import com.example.meteosran.theme.MeteoSranBlue
import com.example.meteosran.theme.MeteoSranTheme
import com.example.meteosran.ui.components.AnimatedOrbBackground
import com.example.meteosran.ui.components.GlassCard
import kotlinx.coroutines.launch

@Composable
fun MainScreen(
    onItemClick: (NavKey) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: MainScreenViewModel = viewModel()
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var showSettingsDialog by remember { mutableStateOf(false) }

    AnimatedOrbBackground {
        Box(modifier = modifier.fillMaxSize()) {
            Column(
                modifier = Modifier.fillMaxSize()
            ) {
                // Sleek Apple-style Header
                HeaderBar(
                    selectedMode = state.selectedMode,
                    onModeSelected = { viewModel.setMode(it) },
                    onSettingsClicked = { showSettingsDialog = true }
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

@Composable
fun HeaderBar(
    selectedMode: ResponseMode,
    onModeSelected: (ResponseMode) -> Unit,
    onSettingsClicked: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
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

@Composable
fun ModeSelectorDropdown(
    selectedMode: ResponseMode,
    onModeSelected: (ResponseMode) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }

    Box {
        Button(
            onClick = { expanded = true },
            colors = ButtonDefaults.buttonColors(
                containerColor = MeteoSranTheme.customColors.glassBackground,
                contentColor = if (MeteoSranTheme.customColors.isDark) Color.White else Color(0xFF334155)
            ),
            shape = RoundedCornerShape(12.dp),
            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
        ) {
            Text(
                text = "Mode: ${selectedMode.name}",
                fontFamily = MeteoSranTheme.typography.bodyMedium.fontFamily,
                fontWeight = FontWeight.Medium,
                fontSize = 13.sp
            )
        }

        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
            modifier = Modifier.background(MeteoSranTheme.customColors.glassBackground)
        ) {
            ResponseMode.entries.forEach { mode ->
                DropdownMenuItem(
                    text = {
                        Text(
                            text = mode.name,
                            fontFamily = MeteoSranTheme.typography.bodyMedium.fontFamily
                        )
                    },
                    onClick = {
                        onModeSelected(mode)
                        expanded = false
                    }
                )
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

            Spacer(modifier = Modifier.height(8.dp))

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

    Dialog(onDismissRequest = onDismiss) {
        GlassCard(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(8.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Paramètres de MeteoSran",
                    fontFamily = MeteoSranTheme.typography.titleMedium.fontFamily,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = if (MeteoSranTheme.customColors.isDark) Color.White else Color(0xFF0F172A)
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "Configurez votre clé API Gemini (gratuite sur Google AI Studio) pour activer l'assistant IA conversationnel.",
                    fontSize = 12.sp,
                    fontFamily = MeteoSranTheme.typography.bodySmall.fontFamily,
                    textAlign = TextAlign.Center,
                    color = if (MeteoSranTheme.customColors.isDark) Color(0xFF94A3B8) else Color(0xFF64748B)
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = keyInput,
                    onValueChange = { keyInput = it },
                    label = { Text("Clé API Gemini", fontFamily = MeteoSranTheme.typography.bodyMedium.fontFamily) },
                    visualTransformation = PasswordVisualTransformation(),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss) {
                        Text(
                            "Annuler",
                            fontFamily = MeteoSranTheme.typography.bodyMedium.fontFamily,
                            color = Color.Gray
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
