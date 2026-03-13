// GeoCheckr — Tutorial/Onboarding Screen
// Zeigt Spielregeln beim ersten Start

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface TutorialStep {
  emoji: string;
  title: string;
  description: string;
  tip?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    emoji: '📱',
    title: 'Willkommen bei GeoCheckr!',
    description: 'Ein Location-Guessing Spiel für 2-8 Spieler. Finde die Stadt und gewinne!',
    tip: 'Perfekt für Kneipenabende, Familien und Schulen.'
  },
  {
    emoji: '📷',
    title: 'QR-Code scannen',
    description: 'Scanne einen QR-Code um eine Location zu starten. Oder spiele ohne QR-Codes!',
    tip: 'Drucke QR-Codes aus und hänge sie auf.'
  },
  {
    emoji: '👀',
    title: 'Beobachten',
    description: 'Du siehst ein Bild der Location. Studiere die Umgebung genau!',
    tip: 'Die Zeit ist begrenzt — nutze sie klug!'
  },
  {
    emoji: '🎯',
    title: 'Raten',
    description: 'Wähle die richtige Stadt aus 4 Optionen.',
    tip: 'Je näher an der echten Stadt, desto mehr Punkte!'
  },
  {
    emoji: '🏆',
    title: 'Gewinnen',
    description: 'Erreiche zuerst den Ziel-Score um das Spiel zu gewinnen!',
    tip: 'Spieler mit der meisten Geografie-Kenntnis gewinnt.'
  },
];

interface Props {
  onComplete: () => void;
}

export default function TutorialScreen({ onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = TUTORIAL_STEPS[currentStep];
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;

  const nextStep = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress dots */}
      <View style={styles.dots}>
        {TUTORIAL_STEPS.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === currentStep && styles.dotActive]}
          />
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.emoji}>{step.emoji}</Text>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>
        {step.tip && (
          <View style={styles.tipBox}>
            <Text style={styles.tipText}>💡 {step.tip}</Text>
          </View>
        )}
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
          onPress={prevStep}
          disabled={currentStep === 0}
        >
          <Text style={[styles.navText, currentStep === 0 && styles.navTextDisabled]}>
            ← Zurück
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
          <Text style={styles.nextText}>
            {isLast ? '🚀 Los geht\'s!' : 'Weiter →'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity style={styles.skipButton} onPress={onComplete}>
          <Text style={styles.skipText}>Überspringen</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
    justifyContent: 'space-between',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#333',
  },
  dotActive: {
    backgroundColor: '#e94560',
    width: 30,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 18,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 20,
  },
  tipBox: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e94560',
    marginTop: 10,
  },
  tipText: {
    color: '#e94560',
    fontSize: 14,
    textAlign: 'center',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  navButtonDisabled: {
    opacity: 0,
  },
  navText: {
    color: '#888',
    fontSize: 16,
  },
  navTextDisabled: {
    color: '#333',
  },
  nextButton: {
    backgroundColor: '#e94560',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  nextText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    alignSelf: 'center',
    padding: 10,
  },
  skipText: {
    color: '#666',
    fontSize: 14,
  },
});
