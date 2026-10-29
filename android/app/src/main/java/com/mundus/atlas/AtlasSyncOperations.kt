package com.mundus.atlas

import android.app.Activity
import android.os.Build
import com.mundus.atlas.mobile.AtlasMobileEngine
import java.io.File
import org.json.JSONObject

/** Android sync and pairing operations exposed by the Agenda Android flow. */
internal class AtlasSyncOperations(
    private val activity: Activity,
    private val engine: AtlasMobileEngine,
) {
    private val peerTicketFile = File(activity.filesDir, "sync_peer_ticket")
    private var connectionError: String? = null

    fun startSyncIfNeeded() {
        if (snapshot()["running"] != true) startSync()
    }

    fun restartSync() {
        if (snapshot()["running"] == true) readData(engine.stopSync())
        startSync()
    }

    fun showPairingCode() {
        readData(engine.showPairingCode())
    }

    fun connectWithCode(code: String) {
        readData(engine.connectWithPairingCode(code))
        peerTicketFile.writeText(code)
    }

    fun action(operation: String, params: Map<*, *>) {
        val json = JSONObject(params.entries.associate { it.key.toString() to it.value }).toString()
        readData(engine.syncAction(operation, json))
        if (operation == "disconnect_peer" && peers().isEmpty()) peerTicketFile.delete()
    }

    fun snapshot(connectionError: String? = null): MutableMap<String, Any?> {
        if (connectionError != null) this.connectionError = connectionError
        val state = peers()
        state["own_iroh_ticket"] = runCatching { readData(engine.ownIrohTicket()) as? String }.getOrNull()
        state["error"] = this.connectionError
        return state
    }

    fun clearError() {
        connectionError = null
    }

    private fun startSync() {
        val config = JSONObject()
            .put("device_name", Build.MODEL)
            .put("app_version", BuildConfig.VERSION_NAME)
        peerTicketFile.takeIf { it.exists() }?.readText()?.trim()?.ifEmpty { null }
            ?.let { config.put("iroh_peer_ticket", it) }
        readData(engine.startSync(config.toString()))
    }

    private fun peers(): MutableMap<String, Any?> {
        val state = readData(engine.syncStatus()) as? Map<*, *> ?: error("Engine вернул неверный статус синхронизации")
        return state.entries.associateTo(linkedMapOf()) { it.key.toString() to it.value }
    }

    private fun readData(response: String): Any? {
        val envelope = JSONObject(response)
        if (!envelope.optBoolean("ok")) error(envelope.optString("error", "Операция Engine не выполнена"))
        return jsonValue(envelope.opt("data"))
    }
}

private fun jsonValue(value: Any?): Any? = when (value) {
    null, JSONObject.NULL -> null
    is JSONObject -> value.keys().asSequence().associateWith { key -> jsonValue(value.opt(key)) }
    is org.json.JSONArray -> (0 until value.length()).map { index -> jsonValue(value.opt(index)) }
    else -> value
}
