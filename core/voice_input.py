import io
import wave
import numpy as np
import sounddevice as sd
import speech_recognition as sr
from config.settings import RECOGNITION_LANGUAGE

CHANNELS = 1


def _probe_sample_rate(device_idx) -> int:
    # Prefer 16 kHz: Google STT is tuned for it and the upload payload is
    # ~3x smaller than 48 kHz, which is the single biggest latency win.
    for rate in (16000, 48000, 44100, 22050):
        try:
            sd.check_input_settings(device=device_idx, channels=CHANNELS,
                                    dtype="int16", samplerate=rate)
            return rate
        except Exception:
            continue
    return 16000


def _setup_device():
    try:
        hostapis = sd.query_hostapis()
        devices = sd.query_devices()
        for api_idx, api in enumerate(hostapis):
            if "WASAPI" in api["name"]:
                for dev_idx, dev in enumerate(devices):
                    if dev["hostapi"] == api_idx and dev["max_input_channels"] > 0:
                        rate = _probe_sample_rate(dev_idx)
                        return dev_idx, rate
        default_idx = sd.default.device[0]
        if isinstance(default_idx, int) and default_idx >= 0:
            rate = _probe_sample_rate(default_idx)
            return default_idx, rate
    except Exception as e:
        print(f"[MIC] device setup warning: {e}")
    return None, 44100


_INPUT_DEVICE, _SAMPLE_RATE = _setup_device()

# 100ms per chunk — keeps latency low for VAD
_CHUNK_MS = 100
_CHUNK_SIZE = int(_SAMPLE_RATE * _CHUNK_MS / 1000)

# Target rate for STT upload — Google is tuned for 16 kHz and the smaller
# payload uploads/transcribes noticeably faster than 48 kHz.
_TARGET_RATE = 16000


class VoiceInput:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        # Don't let a slow/stalled Google request hang the loop.
        self.recognizer.operation_timeout = 8
        dev_name = "default"
        if _INPUT_DEVICE is not None:
            try:
                dev_name = sd.query_devices(_INPUT_DEVICE)["name"]
            except Exception:
                pass
        print(f"[MIC] ready — {dev_name} @ {_SAMPLE_RATE} Hz")

    def listen(self, max_duration: int = 8) -> str | None:
        """
        Record using VAD — stops automatically ~0.5s after you stop speaking.
        Falls back to fixed-duration if streaming fails.
        """
        frames = self._record_vad(max_duration)
        if frames is None:
            frames = self._record_fixed(5)
        if frames is None or len(frames) == 0:
            return None
        combined = np.concatenate(frames)
        trimmed = self._trim_silence(combined)
        audio_data = self._frames_to_audio(trimmed)
        return self._transcribe(audio_data)

    # ── recording ────────────────────────────────────────────────────────────

    def _record_vad(self, max_duration: int) -> list | None:
        """Stream audio in 100ms chunks, stop after silence detected post-speech.

        Uses an adaptive noise floor calibrated from the first few chunks instead
        of a fixed RMS threshold — a hardcoded value rejects genuine speech on
        quiet mics (common with WASAPI shared-mode capture on Windows)."""
        CALIBRATION_CHUNKS = 3     # ~0.3s sampling ambient noise before listening
        SPEECH_MIN    = 3          # need ≥ 0.3s of speech before we care about silence
        SILENCE_STOP  = 5          # stop after 0.5s of silence following speech
        FLOOR_MIN     = 150        # absolute floor so a dead-silent room still works

        max_chunks = int(max_duration * 1000 / _CHUNK_MS)
        frames = []
        speech_chunks = 0
        silent_count  = 0
        peak_rms      = 0.0
        noise_samples = []
        threshold     = None

        stream_kwargs = dict(
            samplerate=_SAMPLE_RATE,
            channels=CHANNELS,
            dtype="int16",
        )
        if _INPUT_DEVICE is not None:
            stream_kwargs["device"] = _INPUT_DEVICE
        if hasattr(sd, "WasapiSettings"):
            stream_kwargs["extra_settings"] = sd.WasapiSettings(exclusive=False)

        try:
            with sd.InputStream(**stream_kwargs) as stream:
                for i in range(max_chunks):
                    chunk, _ = stream.read(_CHUNK_SIZE)
                    frames.append(chunk.copy())

                    rms = float(np.sqrt(np.mean(chunk.astype(np.float32) ** 2)))
                    peak_rms = max(peak_rms, rms)

                    # First chunks: measure the ambient noise floor.
                    if i < CALIBRATION_CHUNKS:
                        noise_samples.append(rms)
                        continue
                    if threshold is None:
                        floor = max(noise_samples) if noise_samples else 0.0
                        # Speech must clearly exceed the measured noise floor.
                        threshold = max(FLOOR_MIN, floor * 2.5)
                        print(f"[MIC] noise floor ~{floor:.0f}, "
                              f"speech threshold {threshold:.0f}")

                    if rms > threshold:
                        speech_chunks += 1
                        silent_count = 0
                    elif speech_chunks >= SPEECH_MIN:
                        silent_count += 1
                        if silent_count >= SILENCE_STOP:
                            break
        except Exception as e:
            print(f"[MIC] VAD stream error: {e}")
            return None

        print(f"[MIC] peak RMS {peak_rms:.0f}, speech chunks {speech_chunks}")
        if speech_chunks < SPEECH_MIN:
            return None
        return frames

    def _record_fixed(self, duration: int) -> list | None:
        """Fallback: record for a fixed duration."""
        num_frames = int(duration * _SAMPLE_RATE)
        try:
            if hasattr(sd, "WasapiSettings") and _INPUT_DEVICE is not None:
                data = sd.rec(num_frames, samplerate=_SAMPLE_RATE,
                              channels=CHANNELS, dtype="int16",
                              device=_INPUT_DEVICE,
                              extra_settings=sd.WasapiSettings(exclusive=False))
            elif _INPUT_DEVICE is not None:
                data = sd.rec(num_frames, samplerate=_SAMPLE_RATE,
                              channels=CHANNELS, dtype="int16",
                              device=_INPUT_DEVICE)
            else:
                data = sd.rec(num_frames, samplerate=_SAMPLE_RATE,
                              channels=CHANNELS, dtype="int16")
            sd.wait()
            return [data]
        except Exception as e:
            print(f"[MIC] fixed recording failed: {e}")
            return None

    # ── helpers ───────────────────────────────────────────────────────────────

    def _trim_silence(self, audio: np.ndarray, threshold: float = 300) -> np.ndarray:
        """Remove leading/trailing silence so STT gets a shorter clip."""
        window = int(_SAMPLE_RATE * 0.02)  # 20ms windows
        active = []
        for i in range(0, len(audio) - window, window):
            rms = float(np.sqrt(np.mean(audio[i:i+window].astype(np.float32) ** 2)))
            if rms > threshold:
                active.append(i)
        if not active:
            return audio
        pad = window * 2  # 40ms padding around speech
        start = max(0, active[0] - pad)
        end = min(len(audio), active[-1] + window + pad)
        return audio[start:end]

    def _resample_to_16k(self, audio: np.ndarray) -> tuple[np.ndarray, int]:
        """Downsample to 16 kHz so the upload to Google is small and fast.
        WASAPI shared mode often forces 48 kHz capture; sending that raw is
        ~3x more data than Google needs. STT quality at 16 kHz is unchanged."""
        if _SAMPLE_RATE <= _TARGET_RATE:
            return audio, _SAMPLE_RATE
        flat = audio.reshape(-1).astype(np.float32)
        n_out = int(len(flat) * _TARGET_RATE / _SAMPLE_RATE)
        if n_out <= 0:
            return audio, _SAMPLE_RATE
        x_old = np.arange(len(flat))
        x_new = np.linspace(0, len(flat) - 1, n_out)
        resampled = np.interp(x_new, x_old, flat).astype(np.int16)
        return resampled, _TARGET_RATE

    def _frames_to_audio(self, frames: np.ndarray) -> sr.AudioData:
        frames, rate = self._resample_to_16k(frames)
        buf = io.BytesIO()
        with wave.open(buf, "wb") as wf:
            wf.setnchannels(CHANNELS)
            wf.setsampwidth(2)
            wf.setframerate(rate)
            wf.writeframes(frames.tobytes())
        buf.seek(0)
        with sr.AudioFile(buf) as source:
            return self.recognizer.record(source)

    def _transcribe(self, audio_data: sr.AudioData) -> str | None:
        try:
            text = self.recognizer.recognize_google(
                audio_data, language=RECOGNITION_LANGUAGE
            )
            print(f"[YOU]: {text}")
            return text.lower()
        except sr.UnknownValueError:
            print("[MIC] speech not understood")
            return None
        except sr.RequestError as e:
            print(f"[MIC] STT request error: {e}")
            return None
        except Exception as e:
            print(f"[MIC] transcription error: {e}")
            return None
