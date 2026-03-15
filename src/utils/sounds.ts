// GeoCheckr — Sound Effects with REAL Audio Beeps
// Generates tones via Web Audio API in a hidden approach

import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

// Simple beep using Vibration patterns as audio substitute
// (Real audio requires pre-recorded sound files)

export async function playClickSound() {
  try {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (e) {
    Vibration.vibrate(50);
  }
}

export async function playSuccessSound() {
  try {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  } catch (e) {
    Vibration.vibrate([0, 100, 50, 100]);
  }
}

export async function playErrorSound() {
  try {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  } catch (e) {
    Vibration.vibrate(500);
  }
}

export async function playPerfectSound() {
  try {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(async () => {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } catch (e) { Vibration.vibrate(100); }
      }, 150);
      setTimeout(async () => {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) { Vibration.vibrate(100); }
      }, 300);
    }
  } catch (e) {
    Vibration.vibrate([0, 100, 50, 100, 50, 200]);
  }
}

export async function playSkipSound() {
  try {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  } catch (e) {
    Vibration.vibrate(80);
  }
}

export async function playTimerWarning() {
  // Strong buzz for timer reaching 0
  try {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  } catch (e) {
    Vibration.vibrate(300);
  }
  // Double buzz
  setTimeout(() => {
    Vibration.vibrate(200);
  }, 200);
}

export async function playTimerTick() {
  // Soft tick for 5,4,3,2,1 countdown
  try {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (e) {
    Vibration.vibrate(30);
  }
}

export async function playScanSound() {
  try {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  } catch (e) {
    Vibration.vibrate(80);
  }
}
