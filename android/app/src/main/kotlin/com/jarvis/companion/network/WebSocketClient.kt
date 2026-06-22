package com.jarvis.companion.network

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.telephony.SmsManager
import android.util.Log
import com.jarvis.companion.utils.AppLauncher
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class WebSocketClient(private val context: Context, private val bridgeUrl: String) {

    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.SECONDS)
        .build()

    private var socket: WebSocket? = null
    private val handler = Handler(Looper.getMainLooper())
    private var isConnected = false

    fun connect() {
        val request = Request.Builder().url(bridgeUrl).build()
        socket = client.newWebSocket(request, JarvisWebSocketListener())
    }

    fun disconnect() {
        isConnected = false
        socket?.close(1000, "App closed")
    }

    private fun reconnectAfterDelay() {
        if (!isConnected) {
            handler.postDelayed({
                Log.i("JARVIS_WS", "Reconnecting…")
                connect()
            }, 5000)
        }
    }

    private inner class JarvisWebSocketListener : WebSocketListener() {

        override fun onOpen(webSocket: WebSocket, response: Response) {
            isConnected = true
            Log.i("JARVIS_WS", "Connected to bridge at $bridgeUrl")
        }

        override fun onMessage(webSocket: WebSocket, text: String) {
            try {
                val json = JSONObject(text)
                when (json.getString("action")) {
                    "launch_app" -> handleLaunchApp(json.getString("package"))
                    "send_sms"   -> handleSendSms(json.getString("recipient"), json.getString("message"))
                }
            } catch (e: Exception) {
                Log.e("JARVIS_WS", "Parse error: ${e.message}")
            }
        }

        override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
            isConnected = false
            Log.e("JARVIS_WS", "Connection failed: ${t.message}")
            reconnectAfterDelay()
        }

        override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
            isConnected = false
            Log.i("JARVIS_WS", "Disconnected: $reason")
            if (code != 1000) reconnectAfterDelay()
        }
    }

    private fun handleLaunchApp(packageName: String) {
        Log.i("JARVIS_WS", "Launching: $packageName")
        val launched = AppLauncher.launch(context, packageName)
        if (!launched) Log.w("JARVIS_WS", "Not found: $packageName")
    }

    private fun handleSendSms(recipient: String, message: String) {
        try {
            @Suppress("DEPRECATION")
            SmsManager.getDefault().sendTextMessage(recipient, null, message, null, null)
            Log.i("JARVIS_WS", "SMS sent to $recipient")
        } catch (e: Exception) {
            Log.e("JARVIS_WS", "SMS failed: ${e.message}")
        }
    }
}
