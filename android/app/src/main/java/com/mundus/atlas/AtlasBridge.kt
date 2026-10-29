package com.mundus.atlas

import android.app.Activity
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.widget.FrameLayout
import android.content.ClipData
import android.content.ClipboardManager
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
    @Volatile private var route = "home"
    private var receivedInitialRouteProp = false
    @Volatile private var canHandleBack = false
    @Volatile private var journalEntries: List<Any?> = emptyList()
    @Volatile private var connectionState: Map<String, Any?>? = null
    private var syncOperations: AtlasSyncOperations? = null
    @Volatile private var destroyed = false
    private val connectionPoll = object : Runnable {
        override fun run() {
            if (destroyed || route != "connection") return
            io.execute {
                publishConnection()
                if (!destroyed) main.postDelayed(this, 3000)
            }
        }
    }

    init {
        // Render the mobile shell immediately while the in-process Engine opens.
        // Otherwise the TSX fallback briefly shows the desktop navigation.
        publishState()
        io.execute {
            try {
                engine = (activity.application as AtlasApplication).engine
                syncOperations = AtlasSyncOperations(activity, engine!!)
                publishState()
                publishJournal()
                runCatching { syncOperations?.startSyncIfNeeded() }
                    .onFailure { publishConnection(it.message ?: "Не удалось запустить синхронизацию") }
                publishConnection()
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
        when (name) {
            "route" -> {
                val next = value as? String ?: "home"
                if (!receivedInitialRouteProp) {
                    receivedInitialRouteProp = true
                    if (route == "home" && next == "journal") {
                        main.post { publishState() }
                        return
                    }
                }
                if (next == "tasks" && !debugFeatures) return
                route = next
                main.post { publishState() }
                main.post {
                    main.removeCallbacks(connectionPoll)
                    if (next == "connection") main.post(connectionPoll)
                }
            }
            "canHandleBack" -> canHandleBack = value == true
        }
    }

    fun handleSystemBack(): Boolean {
        if (route == "home" && !canHandleBack) return false
        main.post { context.emit("back", emptyMap<String, Any>()) }
        return true
    }

    override fun command(name: String, args: Any?) {
        when (name) {
            "clipboard.copy" -> {
                val text = (args as? Map<*, *>)?.get("text") as? String ?: return
                main.post {
                    val clipboard = activity.getSystemService(ClipboardManager::class.java)
                    clipboard.setPrimaryClip(ClipData.newPlainText("Atlas journal entry", text))
                }
            }
            "window.background" -> {
                val color = (args as? Map<*, *>)?.get("color") as? String ?: return
                main.post { (activity as? MainActivity)?.applyAtlasBackground(color) }
            }
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
            "connection.show-code" -> io.execute {
                runCatching { syncOperations?.showPairingCode(); syncOperations?.clearError() }
                    .onFailure { publishConnection(it.message ?: "Не удалось получить код") }
                publishConnection()
            }
            "connection.connect-clipboard" -> main.post {
                val clipboard = activity.getSystemService(ClipboardManager::class.java)
                val code = clipboard.primaryClip?.getItemAt(0)?.coerceToText(activity)?.toString()?.trim().orEmpty()
                if (code.isEmpty()) {
                    io.execute { publishConnection("В буфере обмена нет кода подключения") }
                } else io.execute { connectWithCode(code) }
            }
            "connection.restart" -> io.execute {
                runCatching { syncOperations?.restartSync(); syncOperations?.clearError() }
                    .onFailure { publishConnection(it.message ?: "Не удалось запустить синхронизацию") }
                publishConnection()
            }
            "connection.accept" -> syncAction("accept_pairing", args)
            "connection.decline" -> syncAction("decline_pairing", args)
            "connection.cancel" -> syncAction("cancel_pairing", emptyMap<String, Any>())
            "connection.disconnect" -> syncAction("disconnect_peer", args)
        }
    }

    private fun syncAction(operation: String, args: Any?) {
        val params = args as? Map<*, *> ?: emptyMap<Any, Any>()
        io.execute {
            runCatching {
                syncOperations?.action(operation, params) ?: error("Engine ещё запускается")
                syncOperations?.clearError()
            }.onFailure { publishConnection(it.message ?: "Операция подключения не выполнена") }
            publishConnection()
        }
    }

    private fun connectWithCode(code: String) {
        runCatching {
            syncOperations?.connectWithCode(code) ?: error("Engine ещё запускается")
            syncOperations?.clearError()
        }.onFailure { publishConnection(it.message ?: "Не удалось подключиться по этому коду") }
        publishConnection()
    }

    private fun publishConnection(error: String? = null) {
        val sync = syncOperations ?: return
        try {
            val state = sync.snapshot(error)
            connectionState = state
            main.post {
                context.emit("connection", state)
                context.emit("state", stateSnapshot())
            }
        } catch (failure: Exception) {
            val state = linkedMapOf<String, Any?>("running" to false, "peers" to emptyList<Any>(), "incoming_pairing_requests" to emptyList<Any>(), "error" to (error ?: failure.message ?: "Нет подключения к Engine"))
            connectionState = state
            main.post {
                context.emit("connection", state)
                context.emit("state", stateSnapshot())
            }
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
            "accent" to "#60a5fa",
            "card" to "#131216",
        )
        val lightColors = mapOf(
            "background" to "#f8f7f9",
            "foreground" to "#222027",
            "muted" to "#615f67",
            "border" to "#dedde0",
            "accent" to "#2563eb",
            "card" to "#f3f2f4",
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
                "title" to when (route) {
                    "tasks" -> "Задачи"
                    "settings" -> "Настройки"
                    "connection" -> "Подключения"
                    "home" -> "Дневник"
                    else -> "Дневник"
                },
                "todos" to emptyList<Any>(),
                "journalEntries" to journalEntries,
                "connection" to connectionState,
                "version" to BuildConfig.VERSION_NAME,
                "appearance" to appearance,
                "appearanceEditable" to true,
                "themes" to listOf(mapOf("key" to "default", "name" to "Default", "light" to lightColors, "dark" to darkColors)),
                "colors" to darkColors,
                "sidebarVisible" to true,
                "devFeatures" to debugFeatures,
                "chrome" to "mobile",
            )
        return state
    }

    override fun destroy() {
        destroyed = true
        main.removeCallbacks(connectionPoll)
        io.shutdown()
    }
}

private fun jsonValue(value: Any?): Any? = when (value) {
    null, JSONObject.NULL -> null
    is JSONObject -> value.keys().asSequence().associateWith { key -> jsonValue(value.opt(key)) }
    is JSONArray -> (0 until value.length()).map { index -> jsonValue(value.opt(index)) }
    else -> value
}
