package com.example.meteosran.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.dp
import com.example.meteosran.theme.MeteoSranTheme
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun AnimatedOrbBackground(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    val customColors = MeteoSranTheme.customColors
    val isDark = customColors.isDark
    val orbColors = customColors.orbColors

    val infiniteTransition = rememberInfiniteTransition(label = "OrbTransitions")

    // Animations for different motion styles
    val t1 by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 2f * Math.PI.toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(30000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "t1"
    )

    val t2 by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 2f * Math.PI.toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(22000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "t2"
    )

    val t3 by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 2f * Math.PI.toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(40000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "t3"
    )

    val t4 by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 2f * Math.PI.toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(35000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "t4"
    )

    val t5 by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 2f * Math.PI.toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(25000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "t5"
    )

    val t6 by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 2f * Math.PI.toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(32000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "t6"
    )

    val t7 by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 2f * Math.PI.toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(28000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "t7"
    )

    // Base background gradient matching web CSS gradient-bg
    val backgroundBrush = if (isDark) {
        Brush.linearGradient(
            colors = listOf(customColors.glassBackground, Color(0xFF020408)),
            start = Offset(0f, 0f),
            end = Offset(1000f, 1000f)
        )
    } else {
        Brush.linearGradient(
            colors = listOf(Color(0xFFE6F6FF), Color(0xFFFFFFFF)),
            start = Offset(0f, 0f),
            end = Offset(1000f, 1000f)
        )
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(backgroundBrush)
    ) {
        // We apply a heavy blur to the entire drawing canvas for glassmorphism
        androidx.compose.foundation.Canvas(
            modifier = Modifier
                .fillMaxSize()
                .blur(64.dp)
        ) {
            val width = size.width
            val height = size.height
            val baseRadius = (width.coerceAtLeast(height) * 0.4f)

            if (orbColors.isNotEmpty()) {
                // Orb 1: Vertical movement
                val x1 = width * 0.5f
                val y1 = height * 0.5f + (sin(t1) * height * 0.15f)
                drawOrb(x1, y1, baseRadius, orbColors[0], isDark)

                // Orb 2: Reverse circular motion
                val x2 = width * 0.5f + (cos(-t2) * width * 0.2f)
                val y2 = height * 0.5f + (sin(-t2) * height * 0.2f)
                drawOrb(x2, y2, baseRadius, orbColors[1], isDark)

                // Orb 3: Slow linear circular motion
                if (orbColors.size > 2) {
                    val x3 = width * 0.4f + (cos(t3) * width * 0.25f)
                    val y3 = height * 0.6f + (sin(t3) * height * 0.15f)
                    drawOrb(x3, y3, baseRadius, orbColors[2], isDark)
                }

                // Orb 4: Horizontal movement
                if (orbColors.size > 3) {
                    val x4 = width * 0.5f + (cos(t4) * width * 0.25f)
                    val y4 = height * 0.5f
                    drawOrb(x4, y4, baseRadius, orbColors[3], isDark)
                }

                // Orb 5: Large circular motion
                if (orbColors.size > 4) {
                    val x5 = width * 0.5f + (cos(t5) * width * 0.3f)
                    val y5 = height * 0.5f + (sin(t5) * height * 0.25f)
                    drawOrb(x5, y5, baseRadius * 1.3f, orbColors[4], isDark)
                }

                // Dark mode extra deep details
                if (isDark && orbColors.size > 6) {
                    // Orb 6
                    val x6 = width * 0.7f + (cos(t6) * width * 0.15f)
                    val y6 = height * 0.2f + (sin(t6) * height * 0.15f)
                    drawOrb(x6, y6, baseRadius * 0.8f, orbColors[5], isDark)

                    // Orb 7
                    val x7 = width * 0.2f + (cos(-t7) * width * 0.15f)
                    val y7 = height * 0.7f + (sin(-t7) * height * 0.15f)
                    drawOrb(x7, y7, baseRadius * 0.7f, orbColors[6], isDark)
                }
            }
        }

        // Overlay layout content on top of background
        content()
    }
}

private fun DrawScope.drawOrb(
    x: Float,
    y: Float,
    radius: Float,
    color: Color,
    isDark: Boolean
) {
    // Soft blend using transparent fade in radial gradient
    val brush = Brush.radialGradient(
        colors = listOf(
            color.copy(alpha = if (isDark) 0.65f else 0.5f),
            color.copy(alpha = if (isDark) 0.3f else 0.2f),
            Color.Transparent
        ),
        center = Offset(x, y),
        radius = radius
    )
    drawCircle(
        brush = brush,
        radius = radius,
        center = Offset(x, y)
    )
}
