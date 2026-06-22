package com.jarvis.companion.network

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST

data class NotificationPayload(val app: String, val title: String, val text: String, val timestamp: String)
data class SmsPayload(val sender: String, val body: String, val timestamp: String)

interface JarvisApi {
    @POST("notifications/")
    suspend fun pushNotification(@Body payload: NotificationPayload)

    @POST("sms/incoming")
    suspend fun pushSms(@Body payload: SmsPayload)
}

object ApiClient {
    private const val BASE_URL = "http://192.168.29.53:8765/"

    val api: JarvisApi by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(JarvisApi::class.java)
    }
}
