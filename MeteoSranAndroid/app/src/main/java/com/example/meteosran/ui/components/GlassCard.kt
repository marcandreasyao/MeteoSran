package com.example.meteosran.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.example.meteosran.theme.MeteoSranTheme

@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 24.dp,
    borderWidth: Dp = 1.dp,
    content: @Composable BoxScope.() -> Unit
) {
    val customColors = MeteoSranTheme.customColors
    val shape = RoundedCornerShape(cornerRadius)

    val borderBrush = if (customColors.isDark) {
        Brush.linearGradient(
            colors = listOf(
                Color(0x33FFFFFF), // Translucent white highlight
                Color(0x0DFFFFFF), // Fade out
                Color(0x1AFFFFFF)
            )
        )
    } else {
        Brush.linearGradient(
            colors = listOf(
                Color(0x80FFFFFF), // Opaque white highlight
                Color(0x1AFFFFFF),
                Color(0x4DFFFFFF)
            )
        )
    }

    Box(
        modifier = modifier
            .clip(shape)
            .background(customColors.glassBackground)
            .border(BorderStroke(borderWidth, borderBrush), shape)
            .padding(16.dp),
        content = content
    )
}
