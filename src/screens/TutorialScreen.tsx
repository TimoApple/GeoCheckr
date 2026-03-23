// GeoCheckr — Tutorial (3 slides, skip any time)
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';

const { width } = Dimensions.get('window');

const SLIDES = [
  { icon: '🌍', title: 'GeoCheckr', sub: 'Finde heraus wo du bist!' },
  { icon: '👆', title: 'Navigiere', sub: 'Bewege dich durch Street View\nKlicke auf Pfeile um zu laufen' },
  { icon: '📍', title: 'Rate den Ort', sub: 'Tippe den Stadtnamen\noder zeige auf die Karte' },
];

export default function TutorialScreen({ navigation }: any) {
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const p = Math.round(e.nativeEvent.contentOffset.x / width);
          setPage(p);
        }}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <Text style={styles.icon}>{s.icon}</Text>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.sub}>{s.sub}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.replace('Setup')}>
          <Text style={styles.skipText}>Überspringen</Text>
        </TouchableOpacity>
        {page < 2 ? (
          <TouchableOpacity style={styles.nextBtn} onPress={() => {
            scrollRef.current?.scrollTo({ x: (page + 1) * width, animated: true });
            setPage(page + 1);
          }}>
            <Text style={styles.nextText}>Weiter →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.startBtn} onPress={() => navigation.replace('Setup')}>
            <Text style={styles.startText}>Los geht's! 🚀</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  slide: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  icon: { fontSize: 80, marginBottom: 30 },
  title: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  sub: { color: '#aaa', fontSize: 18, textAlign: 'center', lineHeight: 26 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#333', marginHorizontal: 5 },
  dotActive: { backgroundColor: '#e94560', width: 24 },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 30, paddingBottom: 50 },
  skipBtn: { paddingVertical: 14, paddingHorizontal: 20 },
  skipText: { color: '#666', fontSize: 16 },
  nextBtn: { backgroundColor: '#e94560', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 },
  nextText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  startBtn: { backgroundColor: '#4CAF50', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 },
  startText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
