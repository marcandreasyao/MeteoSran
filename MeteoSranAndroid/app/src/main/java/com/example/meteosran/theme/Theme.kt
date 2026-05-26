package com.example.meteosran.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

@Immutable
data class MeteoSranCustomColors(
    val glassBackground: Color = Color.Unspecified,
    val glassBorder: Color = Color.Unspecified,
    val orbColors: List<Color> = emptyList(),
    val isDark: Boolean = false
)

val LocalMeteoSranCustomColors = staticCompositionLocalOf { MeteoSranCustomColors() }

object MeteoSranTheme {
    val customColors: MeteoSranCustomColors
        @Composable
        get() = LocalMeteoSranCustomColors.current

    val typography: androidx.compose.material3.Typography
        @Composable
        get() = MaterialTheme.typography
}

private val DarkColorScheme = darkColorScheme(
    primary = MeteoSranBlue,
    secondary = PurpleGrey80,
    tertiary = Pink80,
    background = Bg1Dark,
    surface = Bg1Dark,
    onPrimary = Color.White,
    onBackground = Color.White,
    onSurface = Color.White
)

private val LightColorScheme = lightColorScheme(
    primary = MeteoSranBlue,
    secondary = PurpleGrey40,
    tertiary = Pink40,
    background = Bg1Light,
    surface = Bg2Light,
    onPrimary = Color.White,
    onBackground = Color(0xFF1C1B1F),
    onSurface = Color(0xFF1C1B1F)
)

val darkCustomColors = MeteoSranCustomColors(
    glassBackground = GlassBgDark,
    glassBorder = GlassBorderDark,
    orbColors = DarkOrbColors,
    isDark = true
)

val lightCustomColors = MeteoSranCustomColors(
    glassBackground = GlassBgLight,
    glassBorder = GlassBorderLight,
    orbColors = LightOrbColors,
    isDark = false
)

@Composable
fun MeteoSranTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    // Disabled by default to maintain beautiful, brand-specific UI
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit,
) {
    val colorScheme =
        when {
            dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
                val context = LocalContext.current
                if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
            }
            darkTheme -> DarkColorScheme
            else -> LightColorScheme
        }

    val customColors = if (darkTheme) darkCustomColors else lightCustomColors

    CompositionLocalProvider(
        LocalMeteoSranCustomColors provides customColors
    ) {
        MaterialTheme(colorScheme = colorScheme, typography = Typography, content = content)
    }
}
