import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Alert,
  Animated 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    title: 'Ortsnennung',
    description: 'Nenne die Stadt, die am nächsten zum gezeigten Ort liegt. Nutze Spracheingabe oder tippe auf die Karte.',
    icon: '🎤',
    tip: 'Spracheingabe: Mikrofon-Symbol tippen.'
  },
  {
    id: 5,
    title: 'Punkte sammeln',
    description: 'Je näher du bist, desto mehr Punkte! Ziel-Score: 10 Punkte. Erster Spieler, der das Ziel erreicht, gewinnt!',
    icon: '🏆',
    tip: '< 100km: 3 Punkte, < 500km: 2 Punkte, < 2000km: 1 Punkt'
  },
  {
    id: 6,
    title: 'Schwierigkeitsgrade',
    description: '😊 Leicht: Berühmte Wahrzeichen | 🤔 Mittel: Stadtgebiete | 🔥 Schwer: Versteckte Orte',
    icon: '⚖️',
    tip: 'Wähle die passende Schwierigkeit für deine Gruppe.'
  }
];

export default function TutorialScreen({ navigation }: any) {
  const [currentStep, setCurrentStep] = useState(0);
  const [userName, setUserName] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const hasSeenTutorial = await AsyncStorage.getItem('geocheckr_tutorial_seen');
      const savedName = await AsyncStorage.getItem('geocheckr_user_name');
      
      if (!hasSeenTutorial) {
        setShowWelcome(true);
        if (savedName) {
          setUserName(savedName);
        }
      } else {
        navigation.replace('Home');
      }
    } catch (error) {
      console.error('Error checking tutorial status:', error);
    }
  };

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();
      
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 150);
    } else {
      completeTutorial();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();
      
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
      }, 150);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Tutorial überspringen?',
      'Möchtest du das Tutorial wirklich überspringen? Du kannst es jederzeit in den Einstellungen wieder anzeigen.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Überspringen', onPress: completeTutorial }
      ]
    );
  };

  const completeTutorial = async () => {
    try {
      await AsyncStorage.setItem('geocheckr_tutorial_seen', 'true');
      if (userName.trim()) {
        await AsyncStorage.setItem('geocheckr_user_name', userName.trim());
      }
      navigation.replace('Home');
    } catch (error) {
      console.error('Error saving tutorial status:', error);
      navigation.replace('Home');
    }
  };

  const saveUserName = async (name: string) => {
    setUserName(name);
    try {
      await AsyncStorage.setItem('geocheckr_user_name', name);
    } catch (error) {
      console.error('Error saving user name:', error);
    }
  };

  const step = tutorialSteps[currentStep];
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentStep + 1} / {tutorialSteps.length}
        </Text>
      </View>

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
          {step.tip && (
            <View style={styles.tipContainer}>
              <Text style={styles.tipText}>💡 {step.tip}</Text>
            </View>
          )}

          {/* Name Input (nur beim ersten Schritt) */}
          {currentStep === 0 && (
            <View style={styles.nameContainer}>
              <Text style={styles.nameLabel}>Wie heißt du?</Text>
              <TextInput
                style={styles.nameInput}
                value={userName}
                onChangeText={saveUserName}
                placeholder="Dein Name"
                placeholderTextColor="#666"
                autoCapitalize="words"
                returnKeyType="done"
              />
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        {/* Skip Button */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Überspringen</Text>
        </TouchableOpacity>

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

        {/* Navigation Buttons */}
        <View style={styles.navButtons}>
          {currentStep > 0 && (
            <TouchableOpacity style={styles.prevButton} onPress={handlePrev}>
              <Text style={styles.prevButtonText}>← Zurück</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.nextButton, currentStep === 0 && styles.nextButtonFull]} 
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === tutorialSteps.length - 1 ? 'Starten' : 'Weiter →'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  progressText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
    alignItems: 'center',
  },
  stepIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  stepDescription: {
    fontSize: 18,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 30,
  },
  tipContainer: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 30,
    width: '100%',
  },
  tipText: {
    color: '#FFD700',
    fontSize: 16,
    lineHeight: 22,
  },
  nameContainer: {
    width: '100%',
    marginBottom: 20,
  },
  nameLabel: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  nameInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  navigationContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  skipButton: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  skipButtonText: {
    color: '#888',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stepIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#333',
    marginHorizontal: 5,
  },
  stepIndicatorActive: {
    backgroundColor: '#4CAF50',
    width: 20,
  },
  stepIndicatorCompleted: {
    backgroundColor: '#2E7D32',
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prevButton: {
    padding: 15,
  },
  prevButtonText: {
    color: '#888',
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    flex: 1,
    marginLeft: 20,
  },
  nextButtonFull: {
    marginLeft: 0,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
