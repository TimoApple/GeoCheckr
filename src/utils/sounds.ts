// GeoCheckr — Sound Effects via Vibration ONLY
// No external dependencies - guaranteed to work

import { Vibration } from 'react-native';

export async function playClickSound() {
  Vibration.vibrate(50);
}

export async function playSuccessSound() {
  Vibration.vibrate([0, 100, 50, 100]);
}

export async function playErrorSound() {
  Vibration.vibrate(500);
}

export async function playPerfectSound() {
  Vibration.vibrate([0, 100, 50, 100, 50, 200]);
}

export async function playSkipSound() {
  Vibration.vibrate(80);
}

export async function playTimerWarning() {
  Vibration.vibrate([0, 300, 100, 300]);
}

export async function playTimerTick() {
  Vibration.vibrate(30);
}

export async function playScanSound() {
  Vibration.vibrate(80);
}
