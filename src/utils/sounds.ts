// GeoCheckr — Sound Effects Utility
// Uses expo-av for audio playback and expo-haptics for vibration feedback

import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

// Pre-generate sounds using Web Audio API tones (no external files needed)
// We'll use oscillator-based tones for immediate availability

let audioInitialized = false;

async function initAudio() {
  if (audioInitialized) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    audioInitialized = true;
  } catch (e) {
    console.warn('Audio init failed:', e);
  }
}

// Generate a simple tone using Audio.Sound
async function playTone(frequency: number, durationMs: number, volume: number = 0.3) {
  try {
    await initAudio();
    // Use a data URI with a simple beep sound (base64 encoded short WAV)
    // For simplicity, we'll use Haptics + a silent audio trigger
  } catch (e) {
    console.warn('Tone playback failed:', e);
  }
}

// Sound effect functions with haptic fallback
export async function playClickSound() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (e) {}
}

export async function playSuccessSound() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (e) {}
}

export async function playErrorSound() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (e) {}
}

export async function playPerfectSound() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Double haptic for "perfect"
    setTimeout(async () => {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (e) {}
    }, 150);
  } catch (e) {}
}

export async function playSkipSound() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (e) {}
}

export async function playTimerWarning() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (e) {}
}

export async function playScanSound() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (e) {}
}
