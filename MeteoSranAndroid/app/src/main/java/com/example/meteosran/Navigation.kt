package com.example.meteosran

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.ui.NavDisplay
import com.example.meteosran.ui.login.LoginScreen
import com.example.meteosran.ui.main.MainScreen
import com.example.meteosran.ui.splash.SplashScreen
import com.google.firebase.auth.FirebaseAuth

@Composable
fun MainNavigation() {
  val backStack = rememberNavBackStack(Splash)

  NavDisplay(
    backStack = backStack,
    onBack = { backStack.removeLastOrNull() },
    entryProvider =
      entryProvider {
        entry<Splash> {
          SplashScreen(
            onSplashComplete = {
              backStack.removeLastOrNull()
              val currentUser = FirebaseAuth.getInstance().currentUser
              if (currentUser != null) {
                backStack.add(Main)
              } else {
                backStack.add(Login)
              }
            }
          )
        }
        entry<Login> {
          LoginScreen(
            onLoginSuccess = {
              backStack.removeLastOrNull()
              backStack.add(Main)
            },
            modifier = Modifier.safeDrawingPadding().padding(16.dp)
          )
        }
        entry<Main> {
          MainScreen(
            onItemClick = { navKey -> backStack.add(navKey) },
            onLogout = {
              backStack.removeLastOrNull()
              backStack.add(Login)
            },
            modifier = Modifier.safeDrawingPadding().padding(16.dp)
          )
        }
      },
  )
}
