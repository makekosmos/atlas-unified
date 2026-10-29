package com.mundus.atlas

import android.app.Application
import com.mundus.atlas.mobile.AtlasMobileEngine

/** Keep one in-process Engine and its open data directory for the app process. */
internal class AtlasApplication : Application() {
    val engine: AtlasMobileEngine by lazy(LazyThreadSafetyMode.SYNCHRONIZED) {
        AtlasMobileEngine.open(filesDir.absolutePath)
    }
}
