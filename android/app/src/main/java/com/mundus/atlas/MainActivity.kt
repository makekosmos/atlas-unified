package com.mundus.atlas

import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.util.Log
import com.longbridge.nsh.NshComponent
import com.longbridge.nsh.NshComponentContext
import com.longbridge.nsh.NshView

class MainActivity : Activity() {
    private lateinit var nsh: NshView

    override fun onCreate(state: Bundle?) {
        super.onCreate(state)
        window.statusBarColor = Color.rgb(13, 12, 16)
        window.navigationBarColor = Color.rgb(13, 12, 16)
        nsh = NshView(this)
        nsh.setErrorListener { message -> Log.e("Atlas/NSH", message) }
        nsh.setStorageDirectory(filesDir.resolve("nsh"))
        nsh.registerComponent("atlas.bridge", NshComponent.Factory { context ->
            AtlasBridge(this, context)
        })
        setContentView(nsh)
        nsh.loadAssetBundle("nsh")
    }

    @Deprecated("Android back is routed through NSH first")
    override fun onBackPressed() {
        if (!nsh.handleBack()) super.onBackPressed()
    }

    override fun onDestroy() {
        nsh.destroy()
        super.onDestroy()
    }
}
