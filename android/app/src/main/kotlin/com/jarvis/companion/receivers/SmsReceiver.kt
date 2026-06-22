package com.jarvis.companion.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import com.jarvis.companion.network.ApiClient
import com.jarvis.companion.network.SmsPayload
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.Instant

class SmsReceiver : BroadcastReceiver() {

    private val scope = CoroutineScope(Dispatchers.IO)

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        messages.forEach { sms ->
            scope.launch {
                runCatching {
                    ApiClient.api.pushSms(
                        SmsPayload(
                            sender    = sms.originatingAddress ?: "unknown",
                            body      = sms.messageBody,
                            timestamp = Instant.now().toString(),
                        )
                    )
                }
            }
        }
    }
}
