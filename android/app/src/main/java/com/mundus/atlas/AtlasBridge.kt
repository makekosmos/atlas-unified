package com.mundus.atlas

import android.app.Activity
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.widget.FrameLayout
import com.longbridge.nsh.NshComponent
import com.longbridge.nsh.NshComponentContext
import com.mundus.atlas.mobile.AtlasMobileEngine
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.Executors

private const val TAG = "Atlas/Engine"

internal class AtlasBridge(
    private val activity: Activity,
    private val context: NshComponentContext,
) : NshComponent {
    private val main = Handler(Looper.getMainLooper())
    private val io = Executors.newSingleThreadExecutor()
    private val debugFeatures = (activity.applicationInfo.flags and android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0
    private var engine: AtlasMobileEngine? = null
    private var route = "journal"
    @Volatile private var journalEntries: List<Any?> = emptyList()

    init {
        io.execute {
            try {
                engine = (activity.application as AtlasApplication).engine
                publishState()
                publishJournal()
            } catch (error: Exception) {
                Log.e(TAG, "Could not open the mobile Engine", error)
            }
        }
    }

    override fun view(): View = View(activity).apply {
        layoutParams = FrameLayout.LayoutParams(1, 1)
        visibility = View.INVISIBLE
    }

    override fun setProp(name: String, value: Any?) {
        if (name != "route") return
        val next = value as? String ?: "journal"
        if (next == "tasks" && !debugFeatures) return
        route = next
        main.post { publishState() }
    }

    override fun command(name: String, args: Any?) {
        when (name) {
            "journal.create" -> (args as? Map<*, *>)?.get("text")?.toString()?.let { text ->
                io.execute { runEngine { it.journalCreate(text) } }
            }
            "journal.update" -> {
                val values = args as? Map<*, *> ?: return
                val id = values["id"] as? String ?: return
                val text = values["text"] as? String ?: return
                io.execute { runEngine { it.journalUpdate(id, text) } }
            }
            "journal.delete" -> {
                val id = (args as? Map<*, *>)?.get("id") as? String ?: return
                io.execute { runEngine { it.journalDelete(id) } }
            }
            "reload" -> io.execute { publishJournal() }
        }
    }

    private fun runEngine(action: (AtlasMobileEngine) -> String) {
        val mobile = engine ?: return
        try {
            action(mobile)
            publishJournal()
        } catch (error: Exception) {
            Log.e(TAG, "Engine operation failed", error)
        }
    }

    private fun publishJournal() {
        val entries = engine?.journalList() ?: return
        val payload = jsonValue(JSONArray(entries))
        journalEntries = payload as? List<Any?> ?: emptyList()
        main.post {
            context.emit("journal", payload)
            context.emit("state", stateSnapshot())
        }
    }

    private fun publishState() {
        main.post { context.emit("state", stateSnapshot()) }
    }

    private fun stateSnapshot(): Map<String, Any?> {
        val darkColors = mapOf(
            "background" to "#0d0c10",
            "foreground" to "#e7e5ea",
            "muted" to "#8d8a94",
            "border" to "#27262a",
            "accent" to "#af94f9",
            "card" to "#131216",
        )
        val lightColors = mapOf(
            "background" to "#f7f6f8",
            "foreground" to "#242127",
            "muted" to "#76727c",
            "border" to "#dedbe2",
            "accent" to "#7654d6",
            "card" to "#ffffff",
        )
        val appearance = mapOf(
            "settings" to mapOf(
                "mode" to "dark",
                "light_theme" to "default",
                "dark_theme" to "default",
                "accent_source" to "theme",
                "material" to "default",
                "font_size" to 13,
                "font_family" to "Inter",
            ),
            "policy" to mapOf("following" to false),
            "capabilities" to mapOf("materials" to listOf("default"), "wallpaper_accent" to false),
        )
        val state = mapOf(
                "route" to route,
                "title" to if (route == "tasks") "Задачи" else if (route == "settings") "Настройки" else "Дневник",
                "todos" to emptyList<Any>(),
                "journalEntries" to journalEntries,
                "version" to BuildConfig.VERSION_NAME,
                "appearance" to appearance,
                "appearanceEditable" to false,
                "themes" to listOf(mapOf("key" to "default", "name" to "Default", "light" to lightColors, "dark" to darkColors)),
                "colors" to darkColors,
                "sidebarVisible" to true,
                "devFeatures" to debugFeatures,
                "chrome" to "mobile",
            )
        return state
    }

    override fun destroy() {
        io.shutdown()
    }
}

private fun jsonValue(value: Any?): Any? = when (value) {
    null, JSONObject.NULL -> null
    is JSONObject -> value.keys().asSequence().associateWith { key -> jsonValue(value.opt(key)) }
    is JSONArray -> (0 until value.length()).map { index -> jsonValue(value.opt(index)) }
    else -> value
}
