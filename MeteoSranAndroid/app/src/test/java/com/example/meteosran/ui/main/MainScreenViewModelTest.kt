package com.example.meteosran.ui.main

import com.example.meteosran.data.ResponseMode
import junit.framework.TestCase.assertEquals
import kotlinx.coroutines.test.runTest
import org.junit.Test

class MainScreenViewModelTest {

    @Test
    fun uiState_initiallyDefault() = runTest {
        val viewModel = MainScreenViewModel()
        val state = viewModel.state.value
        assertEquals(state.weather, null)
        assertEquals(state.selectedMode, ResponseMode.DEFAULT)
        assertEquals(state.chatMessages.isEmpty(), true)
    }

    @Test
    fun uiState_changeMode_updatesState() = runTest {
        val viewModel = MainScreenViewModel()
        viewModel.setMode(ResponseMode.EINSTEIN)
        assertEquals(viewModel.state.value.selectedMode, ResponseMode.EINSTEIN)
    }

    @Test
    fun uiState_setApiKey_updatesState() = runTest {
        val viewModel = MainScreenViewModel()
        viewModel.setApiKey("test-key")
        assertEquals(viewModel.state.value.geminiApiKey, "test-key")
    }
}
