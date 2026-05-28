package com.example.meteosran.ui.login

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.meteosran.R
import com.example.meteosran.theme.MeteoSranBlue
import com.example.meteosran.theme.MeteoSranTheme
import com.example.meteosran.ui.components.AnimatedOrbBackground
import com.example.meteosran.ui.components.GlassCard
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.OAuthProvider
import com.google.firebase.auth.userProfileChangeRequest
import kotlinx.coroutines.delay
import java.util.Locale

// Data class for Login Translation parity with the web version
data class LoginTranslations(
    val tagline: String,
    val firstName: String,
    val lastName: String,
    val email: String,
    val password: String,
    val showPassword: String,
    val hidePassword: String,
    val passRequirements: String,
    val minChar: String,
    val uppercase: String,
    val specialChar: String,
    val signInBtn: String,
    val createAccountBtn: String,
    val authenticating: String,
    val or: String,
    val googleBtn: String,
    val appleBtn: String,
    val hasAccount: String,
    val noAccount: String,
    val switchSignUp: String,
    val switchSignIn: String,
    val errorsInvalidCredential: String,
    val errorsUserNotFound: String,
    val errorsWrongPassword: String,
    val errorsEmailInUse: String,
    val errorsWeakPassword: String,
    val errorsTooManyRequests: String,
    val errorsPopupClosed: String,
    val errorsNetworkFailed: String,
    val errorsOperationNotAllowed: String,
    val errorsDefault: String
)

val FrenchTranslations = LoginTranslations(
    tagline = "Météo-Intelligence Avancée de Nouvelle Génération",
    firstName = "Prénom",
    lastName = "Nom",
    email = "Adresse e-mail",
    password = "Mot de passe",
    showPassword = "Afficher le mot de passe",
    hidePassword = "Masquer le mot de passe",
    passRequirements = "Respecte toutes les exigences de mot de passe.",
    minChar = "Au moins 8 caractères",
    uppercase = "Au moins 1 lettre majuscule",
    specialChar = "Au moins 1 caractère spécial (ex., !@#$%)",
    signInBtn = "Se connecter",
    createAccountBtn = "Créer un compte",
    authenticating = "Authentification...",
    or = "OU",
    googleBtn = "Continuer avec Google",
    appleBtn = "Continuer avec Apple",
    hasAccount = "Tu as déjà un compte ? ",
    noAccount = "Tu n'as pas de compte ? ",
    switchSignUp = "S'inscrire",
    switchSignIn = "Se connecter",
    errorsInvalidCredential = "E-mail ou mot de passe incorrect. Essaie encore.",
    errorsUserNotFound = "Aucun compte trouvé avec cet e-mail.",
    errorsWrongPassword = "Mot de passe incorrect. Essaie encore.",
    errorsEmailInUse = "Cet e-mail est déjà enregistré. Essaie plutôt de te connecter.",
    errorsWeakPassword = "Le mot de passe est trop faible. Utilise au moins 6 caractères.",
    errorsTooManyRequests = "Trop de tentatives échouées. Réessaie plus tard.",
    errorsPopupClosed = "La fenêtre de connexion a été fermée. Réessaie.",
    errorsNetworkFailed = "Erreur réseau. Vérifie ta connexion.",
    errorsOperationNotAllowed = "Cette méthode de connexion est actuellement désactivée.",
    errorsDefault = "Une erreur inattendue est survenue. Réessaie."
)

val EnglishTranslations = LoginTranslations(
    tagline = "Next-Level Climate Intelligence",
    firstName = "First Name",
    lastName = "Last Name",
    email = "Email address",
    password = "Password",
    showPassword = "Show password",
    hidePassword = "Hide password",
    passRequirements = "Please meet all password requirements.",
    minChar = "At least 8 characters",
    uppercase = "At least 1 uppercase letter",
    specialChar = "At least 1 special character (e.g., !@#$%)",
    signInBtn = "Sign In",
    createAccountBtn = "Create Account",
    authenticating = "Authenticating...",
    or = "OR",
    googleBtn = "Continue with Google",
    appleBtn = "Continue with Apple",
    hasAccount = "Already have an account? ",
    noAccount = "Don't have an account? ",
    switchSignUp = "Sign Up",
    switchSignIn = "Sign In",
    errorsInvalidCredential = "Incorrect email or password. Please try again.",
    errorsUserNotFound = "No account found with this email.",
    errorsWrongPassword = "Incorrect password. Please try again.",
    errorsEmailInUse = "This email is already registered. Try logging in instead.",
    errorsWeakPassword = "Password is too weak. Please use at least 6 characters.",
    errorsTooManyRequests = "Too many failed attempts. Please try again later.",
    errorsPopupClosed = "The sign-in window was closed. Please try again.",
    errorsNetworkFailed = "Network error. Please check your connection.",
    errorsOperationNotAllowed = "This sign-in method is currently disabled.",
    errorsDefault = "An unexpected error occurred. Please try again."
)

// Helper to find the activity context
fun Context.getActivity(): Activity? {
    var currentContext = this
    while (currentContext is ContextWrapper) {
        if (currentContext is Activity) {
            return currentContext
        }
        currentContext = currentContext.baseContext
    }
    return null
}

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    modifier: Modifier = Modifier
) {
    val auth = remember { FirebaseAuth.getInstance() }
    val context = LocalContext.current
    val focusManager = LocalFocusManager.current
    val activity = remember(context) { context.getActivity() }

    // Detect browser/device language setting for translations parity
    val currentLanguage = remember { Locale.getDefault().language }
    val t = remember(currentLanguage) {
        if (currentLanguage == "fr") FrenchTranslations else EnglishTranslations
    }

    var isLoginMode by remember { mutableStateOf(true) }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var firstName by remember { mutableStateOf("") }
    var lastName by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }

    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }

    // Password validation logic matching web app
    val hasMinLength = password.length >= 8
    val hasUpperCase = password.any { it.isUpperCase() }
    val hasSymbol = password.any { !it.isLetterOrDigit() }
    val isPasswordValid = hasMinLength && hasUpperCase && hasSymbol

    val isDark = MeteoSranTheme.customColors.isDark

    // Realistic keyframe horizontal shake animation matching css animate-shake
    var shakeTrigger by remember { mutableStateOf(false) }
    var shakeOffset by remember { mutableStateOf(0.dp) }

    LaunchedEffect(shakeTrigger) {
        if (shakeTrigger) {
            val steps = listOf(-15.dp, 12.dp, -8.dp, 6.dp, -3.dp, 0.dp)
            for (step in steps) {
                shakeOffset = step
                delay(50)
            }
            shakeTrigger = false
        }
    }

    fun getFriendlyErrorMessage(exception: Exception?): String {
        val message = exception?.message ?: ""
        return when {
            message.contains("INVALID_LOGIN_CREDENTIALS", true) || message.contains("invalid-credential", true) -> {
                t.errorsInvalidCredential
            }
            message.contains("WEAK_PASSWORD", true) || message.contains("weak-password", true) -> {
                t.errorsWeakPassword
            }
            message.contains("EMAIL_ALREADY_IN_USE", true) || message.contains("email-already-in-use", true) -> {
                t.errorsEmailInUse
            }
            message.contains("USER_NOT_FOUND", true) || message.contains("user-not-found", true) -> {
                t.errorsUserNotFound
            }
            message.contains("WRONG_PASSWORD", true) || message.contains("wrong-password", true) -> {
                t.errorsWrongPassword
            }
            message.contains("TOO_MANY_ATTEMPTS", true) || message.contains("too-many-requests", true) -> {
                t.errorsTooManyRequests
            }
            message.contains("network-request-failed", true) -> {
                t.errorsNetworkFailed
            }
            message.contains("operation-not-allowed", true) -> {
                t.errorsOperationNotAllowed
            }
            else -> {
                exception?.localizedMessage ?: t.errorsDefault
            }
        }
    }

    // Google Sign-In with popup parity on Android (using startActivityForSignInWithProvider)
    fun handleGoogleSignIn() {
        if (activity == null) {
            error = "Activity context missing."
            shakeTrigger = true
            return
        }
        error = null
        loading = true
        val provider = OAuthProvider.newBuilder("google.com").build()
        auth.startActivityForSignInWithProvider(activity, provider)
            .addOnSuccessListener {
                loading = false
                onLoginSuccess()
            }
            .addOnFailureListener { exception ->
                loading = false
                error = getFriendlyErrorMessage(exception)
                shakeTrigger = true
            }
    }

    // Apple Sign-In with popup parity on Android (using startActivityForSignInWithProvider)
    fun handleAppleSignIn() {
        if (activity == null) {
            error = "Activity context missing."
            shakeTrigger = true
            return
        }
        error = null
        loading = true
        val provider = OAuthProvider.newBuilder("apple.com")
            .setScopes(listOf("email", "name"))
            .build()
        auth.startActivityForSignInWithProvider(activity, provider)
            .addOnSuccessListener {
                loading = false
                onLoginSuccess()
            }
            .addOnFailureListener { exception ->
                loading = false
                error = getFriendlyErrorMessage(exception)
                shakeTrigger = true
            }
    }

    AnimatedOrbBackground {
        Box(
            modifier = modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            val scrollState = rememberScrollState()
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(scrollState)
                    .padding(horizontal = 24.dp, vertical = 16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                GlassCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .widthIn(max = 480.dp)
                        .offset(x = shakeOffset),
                    cornerRadius = 28.dp
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        // Logo Icon Box matching web's blue/purple gradient
                        Box(
                            modifier = Modifier
                                .size(64.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(
                                    Brush.linearGradient(
                                        colors = listOf(
                                            Color(0xFF3B82F6),
                                            Color(0xFF8B5CF6)
                                        )
                                    )
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Image(
                                painter = painterResource(id = R.drawable.meteosran_logo),
                                contentDescription = "MeteoSran Logo",
                                modifier = Modifier.size(40.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // App Title
                        Text(
                            text = "MeteoSran",
                            fontFamily = MeteoSranTheme.typography.titleLarge.fontFamily,
                            fontWeight = FontWeight.Bold,
                            fontSize = 28.sp,
                            color = if (isDark) Color.White else Color(0xFF0F172A)
                        )

                        // Tagline (dynamic translations based on language context)
                        Text(
                            text = t.tagline,
                            fontFamily = MeteoSranTheme.typography.bodySmall.fontFamily,
                            fontSize = 13.sp,
                            color = if (isDark) Color(0xFF94A3B8) else Color(0xFF64748B),
                            modifier = Modifier.padding(top = 4.dp),
                            textAlign = TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(24.dp))

                        // Error Banner
                        AnimatedVisibility(
                            visible = error != null,
                            enter = fadeIn(),
                            exit = fadeOut()
                        ) {
                            error?.let {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(bottom = 16.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(Color(0x1AE53935))
                                        .border(1.dp, Color(0x4DE53935), RoundedCornerShape(12.dp))
                                        .padding(12.dp)
                                ) {
                                    Text(
                                        text = it,
                                        color = if (isDark) Color(0xFFFF8A80) else Color(0xFFC62828),
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Medium,
                                        textAlign = TextAlign.Center,
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                }
                            }
                        }

                        // Form Inputs
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // Register Details (First & Last Name)
                            AnimatedVisibility(
                                visible = !isLoginMode,
                                enter = fadeIn(),
                                exit = fadeOut()
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    OutlinedTextField(
                                        value = firstName,
                                        onValueChange = { firstName = it },
                                        placeholder = { Text(t.firstName, fontSize = 13.sp) },
                                        modifier = Modifier.weight(1f),
                                        shape = RoundedCornerShape(50.dp),
                                        singleLine = true,
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedBorderColor = MeteoSranBlue,
                                            unfocusedBorderColor = if (isDark) Color(0x1AFFFFFF) else Color(0x80FFFFFF),
                                            focusedContainerColor = if (isDark) Color(0x4D000000) else Color(0x66FFFFFF),
                                            unfocusedContainerColor = if (isDark) Color(0x33000000) else Color(0x4DFFFFFF),
                                            focusedTextColor = if (isDark) Color.White else Color(0xFF0F172A),
                                            unfocusedTextColor = if (isDark) Color.White else Color(0xFF0F172A),
                                            focusedPlaceholderColor = if (isDark) Color(0xFF64748B) else Color(0xFF94A3B8),
                                            unfocusedPlaceholderColor = if (isDark) Color(0xFF64748B) else Color(0xFF94A3B8)
                                        )
                                    )
                                    OutlinedTextField(
                                        value = lastName,
                                        onValueChange = { lastName = it },
                                        placeholder = { Text(t.lastName, fontSize = 13.sp) },
                                        modifier = Modifier.weight(1f),
                                        shape = RoundedCornerShape(50.dp),
                                        singleLine = true,
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedBorderColor = MeteoSranBlue,
                                            unfocusedBorderColor = if (isDark) Color(0x1AFFFFFF) else Color(0x80FFFFFF),
                                            focusedContainerColor = if (isDark) Color(0x4D000000) else Color(0x66FFFFFF),
                                            unfocusedContainerColor = if (isDark) Color(0x33000000) else Color(0x4DFFFFFF),
                                            focusedTextColor = if (isDark) Color.White else Color(0xFF0F172A),
                                            unfocusedTextColor = if (isDark) Color.White else Color(0xFF0F172A),
                                            focusedPlaceholderColor = if (isDark) Color(0xFF64748B) else Color(0xFF94A3B8),
                                            unfocusedPlaceholderColor = if (isDark) Color(0xFF64748B) else Color(0xFF94A3B8)
                                        )
                                    )
                                }
                            }

                            // Email
                            OutlinedTextField(
                                value = email,
                                onValueChange = { email = it },
                                placeholder = { Text(t.email, fontSize = 13.sp) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(50.dp),
                                singleLine = true,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = MeteoSranBlue,
                                    unfocusedBorderColor = if (isDark) Color(0x1AFFFFFF) else Color(0x80FFFFFF),
                                    focusedContainerColor = if (isDark) Color(0x4D000000) else Color(0x66FFFFFF),
                                    unfocusedContainerColor = if (isDark) Color(0x33000000) else Color(0x4DFFFFFF),
                                    focusedTextColor = if (isDark) Color.White else Color(0xFF0F172A),
                                    unfocusedTextColor = if (isDark) Color.White else Color(0xFF0F172A),
                                    focusedPlaceholderColor = if (isDark) Color(0xFF64748B) else Color(0xFF94A3B8),
                                    unfocusedPlaceholderColor = if (isDark) Color(0xFF64748B) else Color(0xFF94A3B8)
                                )
                            )

                            // Password
                            OutlinedTextField(
                                value = password,
                                onValueChange = { password = it },
                                placeholder = { Text(t.password, fontSize = 13.sp) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(50.dp),
                                singleLine = true,
                                visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
                                keyboardActions = KeyboardActions(onDone = { focusManager.clearFocus() }),
                                trailingIcon = {
                                    IconButton(onClick = { showPassword = !showPassword }) {
                                        Icon(
                                            imageVector = if (showPassword) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                            contentDescription = if (showPassword) t.hidePassword else t.showPassword,
                                            tint = if (isDark) Color(0xFF64748B) else Color(0xFF94A3B8)
                                        )
                                    }
                                },
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = MeteoSranBlue,
                                    unfocusedBorderColor = if (isDark) Color(0x1AFFFFFF) else Color(0x80FFFFFF),
                                    focusedContainerColor = if (isDark) Color(0x4D000000) else Color(0x66FFFFFF),
                                    unfocusedContainerColor = if (isDark) Color(0x33000000) else Color(0x4DFFFFFF),
                                    focusedTextColor = if (isDark) Color.White else Color(0xFF0F172A),
                                    unfocusedTextColor = if (isDark) Color.White else Color(0xFF0F172A),
                                    focusedPlaceholderColor = if (isDark) Color(0xFF64748B) else Color(0xFF94A3B8),
                                    unfocusedPlaceholderColor = if (isDark) Color(0xFF64748B) else Color(0xFF94A3B8)
                                )
                            )
                        }

                        // Password Requirements Checklist (for Sign Up)
                        AnimatedVisibility(
                            visible = !isLoginMode,
                            enter = fadeIn(),
                            exit = fadeOut()
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 12.dp, horizontal = 4.dp),
                                verticalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                RequirementItem(label = t.minChar, meets = hasMinLength)
                                RequirementItem(label = t.uppercase, meets = hasUpperCase)
                                RequirementItem(label = t.specialChar, meets = hasSymbol)
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Gradient Submit Button matching web version
                        val buttonAlpha = if (loading) 0.5f else 1.0f
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp)
                                .clip(RoundedCornerShape(50.dp))
                                .background(
                                    Brush.horizontalGradient(
                                        colors = listOf(
                                            Color(0xFF2563EB), // from-blue-600
                                            Color(0xFF3B82F6)  // to-blue-500
                                        )
                                    ),
                                    alpha = buttonAlpha
                                )
                                .clickable(enabled = !loading) {
                                    error = null

                                    if (email.isBlank() || password.isBlank()) {
                                        error = t.errorsDefault
                                        shakeTrigger = true
                                        return@clickable
                                    }

                                    if (!isLoginMode) {
                                        if (firstName.isBlank() || lastName.isBlank()) {
                                            error = t.errorsDefault
                                            shakeTrigger = true
                                            return@clickable
                                        }
                                        if (!isPasswordValid) {
                                            error = t.passRequirements
                                            shakeTrigger = true
                                            return@clickable
                                        }
                                    }

                                    loading = true
                                    if (isLoginMode) {
                                        auth.signInWithEmailAndPassword(email, password)
                                            .addOnCompleteListener { task ->
                                                loading = false
                                                if (task.isSuccessful) {
                                                    onLoginSuccess()
                                                } else {
                                                    error = getFriendlyErrorMessage(task.exception)
                                                    shakeTrigger = true
                                                }
                                            }
                                    } else {
                                        auth.createUserWithEmailAndPassword(email, password)
                                            .addOnCompleteListener { task ->
                                                if (task.isSuccessful) {
                                                    val profileUpdates = userProfileChangeRequest {
                                                        displayName = "${firstName.trim()} ${lastName.trim()}"
                                                    }
                                                    task.result?.user?.updateProfile(profileUpdates)
                                                        ?.addOnCompleteListener {
                                                            loading = false
                                                            onLoginSuccess()
                                                        }
                                                } else {
                                                    loading = false
                                                    error = getFriendlyErrorMessage(task.exception)
                                                    shakeTrigger = true
                                                }
                                            }
                                    }
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            if (loading) {
                                CircularProgressIndicator(
                                    color = Color.White,
                                    modifier = Modifier.size(20.dp),
                                    strokeWidth = 2.dp
                                )
                            } else {
                                Text(
                                    text = if (isLoginMode) t.signInBtn else t.createAccountBtn,
                                    fontFamily = MeteoSranTheme.typography.bodyMedium.fontFamily,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White,
                                    fontSize = 14.sp
                                )
                            }
                        }

                        // Divider text OR
                        Spacer(modifier = Modifier.height(16.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .height(1.dp)
                                    .background(if (isDark) Color(0x1AFFFFFF) else Color(0x1F000000))
                            )
                            Text(
                                text = t.or,
                                fontSize = 10.sp,
                                fontFamily = MeteoSranTheme.typography.bodySmall.fontFamily,
                                fontWeight = FontWeight.Bold,
                                color = if (isDark) Color(0xFF64748B) else Color(0xFF94A3B8),
                                modifier = Modifier.padding(horizontal = 8.dp)
                            )
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .height(1.dp)
                                    .background(if (isDark) Color(0x1AFFFFFF) else Color(0x1F000000))
                            )
                        }

                        // Social Buttons with authentic styling and action flows
                        Spacer(modifier = Modifier.height(16.dp))
                        SocialButton(
                            text = t.googleBtn,
                            iconResource = R.drawable.google_icon,
                            backgroundColor = if (isDark) Color(0x0DFFFFFF) else Color(0x66FFFFFF),
                            textColor = if (isDark) Color.White else Color(0xFF1E293B),
                            borderColor = if (isDark) Color(0x1AFFFFFF) else Color(0x99FFFFFF),
                            onClick = { handleGoogleSignIn() }
                        )

                        Spacer(modifier = Modifier.height(8.dp))
                        SocialButton(
                            text = t.appleBtn,
                            iconResource = R.drawable.apple_icon,
                            backgroundColor = if (isDark) Color(0x66000000) else Color(0xCC000000),
                            textColor = Color.White,
                            borderColor = if (isDark) Color(0x1AFFFFFF) else Color(0x33FFFFFF),
                            onClick = { handleAppleSignIn() }
                        )

                        Spacer(modifier = Modifier.height(24.dp))

                        // Switch mode label
                        Row(
                            horizontalArrangement = Arrangement.Center,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = if (isLoginMode) t.noAccount else t.hasAccount,
                                fontSize = 13.sp,
                                fontFamily = MeteoSranTheme.typography.bodySmall.fontFamily,
                                color = if (isDark) Color(0xFF94A3B8) else Color(0xFF64748B)
                            )
                            Text(
                                text = if (isLoginMode) t.switchSignUp else t.switchSignIn,
                                fontSize = 13.sp,
                                fontFamily = MeteoSranTheme.typography.bodyMedium.fontFamily,
                                fontWeight = FontWeight.Bold,
                                color = MeteoSranBlue,
                                modifier = Modifier.clickable {
                                    isLoginMode = !isLoginMode
                                    error = null
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Bottom security label
                Text(
                    text = "Secured by Firebase Auth.",
                    fontFamily = MeteoSranTheme.typography.bodySmall.fontFamily,
                    fontSize = 11.sp,
                    color = if (isDark) Color(0xFF475569) else Color(0xFF94A3B8)
                )
            }
        }
    }
}

@Composable
fun RequirementItem(
    label: String,
    meets: Boolean
) {
    val isDark = MeteoSranTheme.customColors.isDark
    val activeColor = if (isDark) Color(0xFF4ADE80) else Color(0xFF22C55E)
    val inactiveColor = if (isDark) Color(0xFF475569) else Color(0xFF94A3B8)

    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Icon(
            imageVector = if (meets) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
            contentDescription = null,
            tint = if (meets) activeColor else inactiveColor,
            modifier = Modifier.size(16.dp)
        )
        Text(
            text = label,
            fontSize = 12.sp,
            color = if (meets) activeColor else inactiveColor,
            fontFamily = MeteoSranTheme.typography.bodySmall.fontFamily
        )
    }
}

@Composable
fun SocialButton(
    text: String,
    iconResource: Int,
    backgroundColor: Color,
    textColor: Color,
    borderColor: Color,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(48.dp)
            .clip(RoundedCornerShape(50.dp))
            .background(backgroundColor)
            .border(1.dp, borderColor, RoundedCornerShape(50.dp))
            .clickable { onClick() }
            .padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center
    ) {
        Image(
            painter = painterResource(id = iconResource),
            contentDescription = null,
            modifier = Modifier.size(18.dp)
        )
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            text = text,
            color = textColor,
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium,
            fontFamily = MeteoSranTheme.typography.bodyMedium.fontFamily
        )
    }
}
