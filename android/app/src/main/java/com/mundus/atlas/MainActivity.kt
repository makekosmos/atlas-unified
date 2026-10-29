package com.mundus.atlas

import android.app.Activity
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Bundle
import android.util.Log
import android.os.Build
import android.window.OnBackInvokedCallback
import android.view.View
import com.longbridge.nsh.NshComponent
import com.longbridge.nsh.NshComponentContext
import com.longbridge.nsh.NshView

class MainActivity : Activity() {
    private lateinit var nsh: NshView
    private var atlasBridge: AtlasBridge? = null
    private var backCallback: OnBackInvokedCallback? = null

    override fun onCreate(state: Bundle?) {
        super.onCreate(state)
        applyAtlasBackground("#0d0c10")
        nsh = NshView(this)
        nsh.setBackgroundColor(Color.rgb(13, 12, 16))
        nsh.setErrorListener { message -> Log.e("Atlas/NSH", message) }
        nsh.setStorageDirectory(filesDir.resolve("nsh"))
        nsh.registerComponent("atlas.bridge", NshComponent.Factory { context ->
            AtlasBridge(this, context).also { atlasBridge = it }
        })
        if (Build.VERSION.SDK_INT >= 33) {
            backCallback = OnBackInvokedCallback { handleBack() }
            onBackInvokedDispatcher.registerOnBackInvokedCallback(
                android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,
                backCallback!!,
            )
        }
        setContentView(nsh)
        nsh.loadAssetBundle("nsh")
    }

    fun applyAtlasBackground(value: String) {
        val color = runCatching { Color.parseColor(value) }.getOrDefault(Color.rgb(13, 12, 16))
        window.setBackgroundDrawable(ColorDrawable(color))
        window.statusBarColor = color
        window.navigationBarColor = color
        window.navigationBarDividerColor = color
        window.decorView.systemUiVisibility = if (Color.luminance(color) > 0.5f) {
            View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
        } else {
            0
        }
        if (::nsh.isInitialized) nsh.setBackgroundColor(color)
    }

    @Deprecated("Android back is routed through NSH first")
    override fun onBackPressed() {
        handleBack()
    }

    private fun handleBack() {
        if (atlasBridge?.handleSystemBack() == true) return
        if (!nsh.handleBack()) finish()
    }

    override fun onDestroy() {
        if (Build.VERSION.SDK_INT >= 33) backCallback?.let(onBackInvokedDispatcher::unregisterOnBackInvokedCallback)
        backCallback = null
        atlasBridge = null
        nsh.destroy()
        super.onDestroy()
    }
}
