package com.example.meteosran.ui.splash

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.meteosran.R
import com.example.meteosran.theme.MeteoSranBlue
import com.example.meteosran.theme.MeteoSranTheme
import com.example.meteosran.ui.components.AnimatedOrbBackground
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(
    onSplashComplete: () -> Unit,
    modifier: Modifier = Modifier
) {
    // Spring/Scale Animations
    val scale = remember { Animatable(0.5f) }
    val alpha = remember { Animatable(0f) }

    LaunchedEffect(Unit) {
        // Trigger parallel fade-in and spring scale animation
        scale.animateTo(
            targetValue = 1f,
            animationSpec = tween(durationMillis = 1000)
        )
        alpha.animateTo(
            targetValue = 1f,
            animationSpec = tween(durationMillis = 1000)
        )
        // Wait on the splash screen for 2.5 seconds total
        delay(1500)
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
                    contentDescription = "MeteoSran Logo",
                    modifier = Modifier
                        .size(140.dp)
                        .scale(scale.value)
                        .alpha(alpha.value)
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Brand Title
                Text(
                    text = "MeteoSran",
                    fontFamily = MeteoSranTheme.typography.headlineLarge.fontFamily,
                    fontWeight = FontWeight.Bold,
                    fontSize = 32.sp,
                    color = if (MeteoSranTheme.customColors.isDark) Color.White else Color(0xFF0F172A),
                    modifier = Modifier.alpha(alpha.value)
                )

                Text(
                    text = "L'intelligence météo en Côte d'Ivoire",
                    fontFamily = MeteoSranTheme.typography.bodyMedium.fontFamily,
                    fontSize = 14.sp,
                    color = if (MeteoSranTheme.customColors.isDark) Color(0xFF94A3B8) else Color(0xFF64748B),
                    modifier = Modifier.alpha(alpha.value)
                )

                Spacer(modifier = Modifier.height(48.dp))

                // Loading Spinner
                CircularProgressIndicator(
                    color = MeteoSranBlue,
                    modifier = Modifier
                        .size(32.dp)
                        .alpha(alpha.value)
                )
            }
        }
    }
}
