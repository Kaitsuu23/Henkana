package com.henkana

import android.os.Bundle
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Draw behind system bars (edge-to-edge)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        hideNavigationBar()
    }

    // Android mengembalikan navigation bar setelah di-swipe atau saat app
    // kembali dari background. Terapkan ulang tiap window kembali fokus.
    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideNavigationBar()
    }

    private fun hideNavigationBar() {
        val controller = WindowCompat.getInsetsController(window, window.decorView)

        // Hanya navigation bar yang disembunyikan — status bar tetap tampil.
        controller.hide(WindowInsetsCompat.Type.navigationBars())

        // Muncul sementara saat di-swipe dari tepi, lalu auto-hide sendiri.
        controller.systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    }
}
