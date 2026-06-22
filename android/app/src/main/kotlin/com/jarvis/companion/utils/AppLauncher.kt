package com.jarvis.companion.utils

import android.content.Context
import android.content.Intent
import android.util.Log

object AppLauncher {

    fun launch(context: Context, packageName: String): Boolean {
        val intent = context.packageManager.getLaunchIntentForPackage(packageName)
        return if (intent != null) {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
            Log.i("AppLauncher", "Launched $packageName")
            true
        } else {
            Log.w("AppLauncher", "Package not found: $packageName")
            false
        }
    }
}
