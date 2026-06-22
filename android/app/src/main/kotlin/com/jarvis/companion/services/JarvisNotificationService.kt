package com.jarvis.companion.services

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import com.jarvis.companion.network.ApiClient
import com.jarvis.companion.network.NotificationPayload
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.Instant

class JarvisNotificationService : NotificationListenerService() {

    private val scope = CoroutineScope(Dispatchers.IO)

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val extras = sbn.notification.extras
        val title = extras.getString("android.title") ?: return
        val text  = extras.getCharSequence("android.text")?.toString() ?: ""
        val app   = sbn.packageName

        // Skip JARVIS's own notifications
        if (app == packageName) return

        scope.launch {
            runCatching {
                ApiClient.api.pushNotification(
                    NotificationPayload(
                        app       = app,
                        title     = title,
                        text      = text,
                        timestamp = Instant.now().toString(),
                    )
                )
            }
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) = Unit
}
