import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playClickSound, playSuccessSound } from '../utils/sounds';

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  tip?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: 'Willkommen bei GeoCheckr!',
    description: 'Ein Geografie-Party-Spiel für 2-8 Spieler. Scanne QR-Codes, betrachte Bilder und errate Orte weltweit!',
    icon: '🌍',
    tip: 'Perfekt für Familienabende, Partys und Schulunterricht.'
  },
  {
    id: 2,
    title: 'QR-Code scannen',
    description: 'Jede Spielkarte hat einen QR-Code. Scanne ihn mit der App, um das Bild zu laden.',
    icon: '📱',
    tip: 'Halte die Kamera ruhig und achte auf gute Beleuchtung.'
  },
  {
    id: 3,
    title: 'Bild betrachten',
    description: 'Du hast 30 Sekunden Zeit, um das Bild zu analysieren. Achte auf Details wie Straßenschilder, Architektur und Vegetation.',
    icon: '🔍',
    tip: 'Letzte 5 Sekunden: Countdown!'
  },
  {
    id: 4,
    title: 'Ort erraten',
    description: 'Nenne die Stadt, die am nächsten zum gezeigten Ort liegt. Nutze Spracheingabe oder tippe den Namen ein.',
    icon: '🎤',
    tip: 'Tipp: Nutze Hinweise wie Schilder, Sprache und Architektur.'
  },
  {
    id: 5,
    title: 'Punkte sammeln',
    description: 'Je näher du bist, desto mehr Punkte! Ziel: Erreiche zuerst den Ziel-Score um zu gewinnen!',
    icon: '🏆',
    tip: '< 100km = 3 Pkt, < 500km = 2 Pkt, < 2000km = 1 Punkt'
  },
  {
    id: 6,
    title: 'Bereit?',
    description: 'Du bist jetzt startklar! Wähle Spieler, Schwierigkeit und leg los. Viel Spaß!',
    icon: '🚀',
    tip: ''
  }
];

export default function TutorialScreen({ navigation, onComplete }: any) {
  const [currentStep, setCurrentStep] = useState(0);
  const [userName, setUserName] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const step = tutorialSteps[currentStep];
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tutorialSteps.length - 1;

  const animateStep = (newStep: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      })
    ]).start();
    
    setTimeout(() => {
      setCurrentStep(newStep);
    }, 130);
  };

  const handleNext = () => {
    playClickSound();
    if (!isLastStep) {
      animateStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const handlePrev = () => {
    playClickSound();
    if (!isFirstStep) {
      animateStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    playSuccessSound();
    completeTutorial();
  };

  const completeTutorial = async () => {
    try {
      // Save both keys for compatibility
      await AsyncStorage.setItem('geocheckr_tutorial_seen', 'true');
      await AsyncStorage.setItem('geocheckr_tutorial_done', 'true');
      if (userName.trim()) {
        await AsyncStorage.setItem('geocheckr_user_name', userName.trim());
      }
    } catch (error) {
      console.error('Error saving tutorial:', error);
    }
    // Support both navigation (inside Stack) and onComplete (outside Navigation)
    if (onComplete) {
      onComplete();
    } else if (navigation?.replace) {
      navigation.replace('Home');
    }
  };

  const saveUserName = async (name: string) => {
    setUserName(name);
    try {
      await AsyncStorage.setItem('geocheckr_user_name', name);
    } catch (error) {}
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentStep + 1} / {tutorialSteps.length}
        </Text>
      </View>

      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipButtonText}>Überspringen</Text>
      </TouchableOpacity>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <Text style={styles.stepIcon}>{step.icon}</Text>
          
          {/* Title */}
          <Text style={styles.stepTitle}>{step.title}</Text>
          
          {/* Description */}
          <Text style={styles.stepDescription}>{step.description}</Text>
          
          {/* Tip */}
          {step.tip ? (
            <View style={styles.tipContainer}>
              <Text style={styles.tipText}>💡 {step.tip}</Text>
            </View>
          ) : null}

          {/* Name Input (nur beim ersten Schritt) */}
          {isFirstStep && (
            <View style={styles.nameContainer}>
              <Text style={styles.nameLabel}>Wie heißt du? (optional)</Text>
              <TextInput
                style={styles.nameInput}
                value={userName}
                onChangeText={saveUserName}
                placeholder="Dein Name"
                placeholderTextColor="#555577"
                autoCapitalize="words"
                returnKeyType="done"
                selectionColor="#4CAF50"
              />
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* Step Indicators */}
      <View style={styles.stepIndicators}>
        {tutorialSteps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.stepIndicator,
              index === currentStep && styles.stepIndicatorActive,
              index < currentStep && styles.stepIndicatorCompleted
            ]}
          />
        ))}
      </View>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        {!isFirstStep && (
          <TouchableOpacity style={styles.prevButton} onPress={handlePrev}>
            <Text style={styles.prevButtonText}>← Zurück</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.nextButton, isFirstStep && styles.nextButtonFull]} 
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {isLastStep ? '🚀 Los geht\'s!' : 'Weiter →'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a14',
    paddingTop: 50,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#1e1e30',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff3333',
    borderRadius: 2,
  },
  progressText: {
    color: '#8888aa',
    fontSize: 12,
    textAlign: 'center',
  },
  skipButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    color: '#555577577',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 17,
    color: '#bbb',
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 25,
  },
  tipContainer: {
    backgroundColor: '#12121f',
    padding: 15,
    borderRadius: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#1e1e30',
  },
  tipText: {
    color: '#FFD700',
    fontSize: 15,
    lineHeight: 22,
  },
  nameContainer: {
    width: '100%',
    marginTop: 25,
  },
  nameLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  nameInput: {
    backgroundColor: '#0f0f1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#1e1e30',
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  stepIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1e1e30',
  },
  stepIndicatorActive: {
    backgroundColor: '#ff3333',
    width: 24,
  },
  stepIndicatorCompleted: {
    backgroundColor: '#4CAF50',
  },
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 10,
  },
  prevButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: '#12121f',
    borderWidth: 1,
    borderColor: '#1e1e30',
  },
  prevButtonText: {
    color: '#8888aa',
    fontSize: 16,
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#ff3333',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#ff3333',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonFull: {
    // No extra margin needed
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
