from pydantic import BaseModel
from datetime import datetime


class Notification(BaseModel):
    app: str
    title: str
    text: str
    timestamp: datetime


class SmsMessage(BaseModel):
    sender: str
    body: str
    timestamp: datetime


class SmsSendRequest(BaseModel):
    recipient: str
    message: str


class AppLaunchRequest(BaseModel):
    package_name: str


class CommandResponse(BaseModel):
    status: str
    message: str
