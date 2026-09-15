package com.henkana

import android.os.Build
import android.os.Bundle
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Request to draw behind system bars
        WindowCompat.setDecorFitsSystemWindows(window, false)

        // Configure window insets controller
        val windowInsetsController = WindowCompat.getInsetsController(window, window.decorView)
        windowInsetsController?.let { controller ->
            // Hide the navigation bars (gesture bar)
            controller.hide(WindowInsetsCompat.Type.navigationBars())

            // Set behavior: show transiently on swipe, then auto-hide
            controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
    }
}
