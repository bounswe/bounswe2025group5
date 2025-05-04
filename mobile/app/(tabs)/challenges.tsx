import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  StyleSheet,
  GestureResponderEvent,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { AuthContext } from '../_layout';

const API_BASE = 'http://localhost:8080';
const ADMIN_TYPE_PLACEHOLDER = 'admin';

type Challenge = {
  challengeId: number;
  name: string;
  description: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: string;
  wasteType: string;
  attendee: boolean;
};

export default function ChallengesScreen() {
  const { userType, username } = useContext(AuthContext);
  const isAdmin = String(userType) === ADMIN_TYPE_PLACEHOLDER;

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAttendedOnly, setShowAttendedOnly] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [expanded, setExpanded] = useState<number[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/challenges?username=${username}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data: Challenge[] = await res.json();
      setChallenges(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAttendLeave = async (challengeId: number, attend: boolean) => {
    // Optimistic update
    setChallenges(prev =>
      prev.map(ch =>
        ch.challengeId === challengeId ? { ...ch, attendee: attend } : ch
      )
    );
    try {
      const url = attend
        ? `${API_BASE}/api/challenges/attend`
        : `${API_BASE}/api/challenges/leave/${username}/${challengeId}`;
      const options = attend
        ? {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, challengeId }),
          }
        : { method: 'DELETE' };
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`Status ${res.status}`);
    } catch (err) {
      console.error(err);
      setError('Action failed');
      // revert change
      setChallenges(prev =>
        prev.map(ch =>
          ch.challengeId === challengeId ? { ...ch, attendee: !attend } : ch
        )
      );
    }
  };

  const toggleExpand = (id: number) => {
    setExpanded(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const filtered = challenges.filter(ch => {
    if (showActiveOnly && ch.status !== 'Active') return false;
    if (showAttendedOnly && !ch.attendee) return false;
    return true;
  });

  // Full-screen loader on initial fetch
  if (loading && challenges.length === 0) {
    return <ActivityIndicator size="large" style={styles.center} />;
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title" style={styles.title}>Challenges</ThemedText>
      {loading && <ActivityIndicator style={styles.inlineSpinner} size="small" />}
      {error && <ThemedText type="default" style={styles.error}>{error}</ThemedText>}

      <View style={styles.filterRow}>
        <View style={styles.switchRow}>
          <Switch value={showAttendedOnly} onValueChange={setShowAttendedOnly} />
          <ThemedText type="default" style={styles.switchLabel}>Attended only</ThemedText>
        </View>
        <View style={styles.switchRow}>
          <Switch value={showActiveOnly} onValueChange={setShowActiveOnly} />
          <ThemedText type="default" style={styles.switchLabel}>Active only</ThemedText>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.challengeId)}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => toggleExpand(item.challengeId)}>
              <View style={styles.cardHeader}>
                <ThemedText type="subtitle" style={styles.cardTitle}>{item.name}</ThemedText>
                <ThemedText type="default" style={styles.cardDate}>
                  {item.startDate} – {item.endDate}
                </ThemedText>
              </View>
            </TouchableOpacity>

            {expanded.includes(item.challengeId) && (
              <View style={styles.cardBody}>
                <ThemedText type="default" style={styles.cardDescription}>{item.description}</ThemedText>
                <ThemedText type="default" style={styles.cardInfo}>
                  Amount: {item.amount} | Type: {item.wasteType}
                </ThemedText>

                {!isAdmin && item.status === 'Active' && (
                  <TouchableOpacity
                    style={item.attendee ? styles.warningButton : styles.secondaryButton}
                    onPress={() => handleAttendLeave(item.challengeId, !item.attendee)}
                  >
                    <ThemedText type="defaultSemiBold" style={styles.buttonText}>
                      {item.attendee ? 'Leave Challenge' : 'Attend Challenge'}
                    </ThemedText>
                  </TouchableOpacity>
                )}

                {isAdmin && (
                  <TouchableOpacity style={styles.dangerButton} onPress={() => {/* TODO: end challenge */}}>
                    <ThemedText type="defaultSemiBold" style={styles.buttonText}>End Challenge</ThemedText>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.secondaryButton} onPress={() => {/* TODO: leaderboard */}}>
                  <ThemedText type="defaultSemiBold" style={styles.buttonText}>View Leaderboard</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  inlineSpinner: { alignSelf: 'center', marginVertical: 8 },
  title: { fontSize: 24, fontWeight: '600', marginVertical: 12, textAlign: 'center' },
  error: { color: 'red', textAlign: 'center', marginBottom: 12 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  switchLabel: { marginLeft: 8, fontSize: 14 },
  card: { backgroundColor: '#FFF', borderRadius: 8, padding: 16, marginVertical: 6, elevation: 2 },
  cardHeader: { marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  cardDate: { fontSize: 12, color: '#666' },
  cardBody: { borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 12 },
  cardDescription: { fontSize: 14, color: '#333', marginBottom: 8 },
  cardInfo: { fontSize: 14, color: '#555', marginBottom: 12 },
  dangerButton: { backgroundColor: '#E53935', padding: 10, borderRadius: 6, alignItems: 'center', marginBottom: 8 },
  secondaryButton: { backgroundColor: '#2196F3', padding: 10, borderRadius: 6, alignItems: 'center', marginBottom: 8 },
  warningButton: { backgroundColor: '#FF9800', padding: 10, borderRadius: 6, alignItems: 'center', marginBottom: 8 },
  buttonText: { fontSize: 14, color: '#FFF', fontWeight: '500' },
});
