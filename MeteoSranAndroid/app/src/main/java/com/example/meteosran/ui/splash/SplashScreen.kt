package com.example.meteosran.ui.splash

import android.view.HapticFeedbackConstants
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.meteosran.R
import com.example.meteosran.theme.MeteoSranBlue
import com.example.meteosran.theme.MeteoSranTheme
import com.example.meteosran.ui.components.AnimatedOrbBackground
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun SplashScreen(
    onSplashComplete: () -> Unit,
    modifier: Modifier = Modifier
) {
    // 1. Independent Animatable States for Staggered Choreography
    val logoScale = remember { Animatable(0.3f) }
    val logoAlpha = remember { Animatable(0f) }

    val textTranslationY = remember { Animatable(40f) }
    val textAlpha = remember { Animatable(0f) }

    val loaderAlpha = remember { Animatable(0f) }

    // Access the view for haptic feedback
    val view = LocalView.current

    LaunchedEffect(Unit) {
        // Step 1: Logo Entrance
        launch {
            logoAlpha.animateTo(
                targetValue = 1f,
                animationSpec = tween(durationMillis = 800, easing = EaseOutExpo)
            )
        }
        launch {
            logoScale.animateTo(
                targetValue = 1f,
                animationSpec = spring(
                    dampingRatio = Spring.DampingRatioMediumBouncy,
                    stiffness = Spring.StiffnessLow
                )
            )
            // Trigger haptic feedback exactly when the spring settles
            view.performHapticFeedback(HapticFeedbackConstants.CONTEXT_CLICK)
        }

        // Wait for the logo to partially settle before revealing text
        delay(300)

        // Step 2: Text Reveal (Slide up + Fade)
        launch {
            textAlpha.animateTo(
                targetValue = 1f,
                animationSpec = tween(durationMillis = 600, easing = EaseOutCubic)
            )
        }
        launch {
            textTranslationY.animateTo(
                targetValue = 0f,
                animationSpec = spring(
                    dampingRatio = Spring.DampingRatioNoBouncy,
                    stiffness = Spring.StiffnessMedium
                )
            )
        }

        // Wait before showing the loader
        delay(200)

        // Step 3: Loader Fade In
        launch {
            loaderAlpha.animateTo(
                targetValue = 1f,
                animationSpec = tween(durationMillis = 500)
            )
        }

        // Note for Pro-Dev: In production, replace this delay with your actual
        // initialization logic (e.g., waiting for a StateFlow to emit 'Ready').
        delay(2000)

        // Final haptic before transition
        view.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
        onSplashComplete()
    }

    AnimatedOrbBackground {
        Box(
            modifier = modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                // Animated App Logo
                Image(
                    painter = painterResource(id = R.drawable.meteosran_logo),
                    contentDescription = "MeteoSran App Logo",
                    modifier = Modifier
                        .size(140.dp)
                        .scale(logoScale.value)
                        .alpha(logoAlpha.value)
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Typography Container with spatial translation
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier
                        .alpha(textAlpha.value)
                        .graphicsLayer {
                            translationY = textTranslationY.value
                        }
                ) {
                    Text(
                        text = "MeteoSran",
                        fontFamily = MeteoSranTheme.typography.headlineLarge.fontFamily,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 32.sp,
                        letterSpacing = 0.5.sp,
                        color = if (MeteoSranTheme.customColors.isDark) Color.White else Color(0xFF0F172A)
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = "L'intelligence météorologique ivoirienne N°1\nau service du monde",
                        fontFamily = MeteoSranTheme.typography.bodyMedium.fontFamily,
                        fontSize = 14.sp,
                        letterSpacing = 0.5.sp,
                        textAlign = TextAlign.Center,
                        color = if (MeteoSranTheme.customColors.isDark) Color(0xFF94A3B8) else Color(0xFF64748B)
                    )
                }

                Spacer(modifier = Modifier.height(48.dp))

                // Custom Premium Gradient Loader
                MeteoPremiumLoader(
                    modifier = Modifier
                        .size(44.dp)
                        .alpha(loaderAlpha.value),
                    primaryColor = MeteoSranBlue,
                    isDark = MeteoSranTheme.customColors.isDark
                )
            }
        }
    }
}

/**
 * A state-of-the-art circular progress indicator utilizing SweepGradient.
 * Inspired by premium watchOS activity rings and advanced Android Canvas rendering.
 */
@Composable
fun MeteoPremiumLoader(
    modifier: Modifier = Modifier,
    primaryColor: Color,
    isDark: Boolean
) {
    val infiniteTransition = rememberInfiniteTransition(label = "loader_transition")

    // Smooth 360 degree rotation
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "loader_rotation"
    )

    // Define a beautiful multi-stop gradient for the sweep
    // Blending the primary brand color with a lighter cyan and a rich indigo
    val gradientColors = listOf(
        Color.Transparent,
        primaryColor.copy(alpha = 0.3f),
        Color(0xFF38BDF8), // Light Sky Blue
        primaryColor,
        Color(0xFF8B5CF6)  // Premium Indigo/Purple touch
    )

    // Subtle background track color based on theme
    val trackColor = if (isDark) {
        Color.White.copy(alpha = 0.05f)
    } else {
        Color.Black.copy(alpha = 0.05f)
    }

    Canvas(
        modifier = modifier
            .graphicsLayer { rotationZ = rotation }
            .semantics { contentDescription = "Loading weather data" }
    ) {
        val strokeWidth = 4.dp.toPx()
        val radius = (size.minDimension - strokeWidth) / 2
        val centerOffset = Offset(size.width / 2, size.height / 2)

        // 1. Draw the Background Track
        // This gives the loader spatial context, a staple in high-end UI design.
        drawCircle(
            color = trackColor,
            radius = radius,
            center = centerOffset,
            style = Stroke(width = strokeWidth)
        )

        // 2. Create the SweepGradient Brush
        val sweepBrush = Brush.sweepGradient(
            colors = gradientColors,
            center = centerOffset
        )

        // 3. Draw the Gradient Arc
        // We use a 280-degree sweep to leave a gap, emphasizing the rotation speed
        drawArc(
            brush = sweepBrush,
            startAngle = 0f,
            sweepAngle = 280f,
            useCenter = false,
            topLeft = Offset(strokeWidth / 2, strokeWidth / 2),
            size = Size(radius * 2, radius * 2),
            style = Stroke(
                width = strokeWidth,
                cap = StrokeCap.Round // Apple-style rounded end caps
            )
        )
    }
}