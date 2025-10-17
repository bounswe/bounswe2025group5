import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Platform,
  useColorScheme, // Import useColorScheme
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { AuthContext } from '../_layout';
import { apiRequest } from '../services/apiClient';
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

type LeaderboardEntry = {
  userId: number;
  username: string;
  remainingAmount: number;
};

export default function ChallengesScreen() {
  const { userType, username } = useContext(AuthContext);
  const isAdmin = String(userType) === ADMIN_TYPE_PLACEHOLDER;
  const colorScheme = useColorScheme();

  // Dynamic Colors
  const isDarkMode = colorScheme === 'dark';
  const screenBackgroundColor = isDarkMode ? '#151718' : '#F0F2F5';
  const cardBackgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const subtleTextColor = isDarkMode ? '#A0A0A0' : '#666666'; // For less prominent text like dates
  const borderColor = isDarkMode ? '#3A3A3C' : '#EEEEEE'; // For borders in cards/modals
  const modalBackgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const errorColor = isDarkMode ? '#FF9494' : '#D32F2F'; // Consistent error color
  const activityIndicatorColor = isDarkMode ? '#FFFFFF' : '#000000';
  const switchThumbColor = Platform.OS === 'android' ? (isDarkMode ? "#81b0ff" : "#2196F3") : undefined;
  const switchTrackColor = { false: (isDarkMode ? "#3e3e3e" : "#e0e0e0"), true: (isDarkMode ? "#5c85d6" : "#81b0ff") };


  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAttendedOnly, setShowAttendedOnly] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [expanded, setExpanded] = useState<number[]>([]);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(false);
  const [lbError, setLbError] = useState('');
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (!username) {
        setChallenges([]);
        setLoading(false);
        return;
      }
      const res = await apiRequest(`/api/challenges/${encodeURIComponent(username)}`);
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
    setChallenges(prev =>
      prev.map(ch =>
        ch.challengeId === challengeId ? { ...ch, attendee: attend } : ch
      )
    );
    try {
      if (!username) {
        throw new Error('Username is required to manage challenge attendance');
      }
      if (attend) {
        const res = await apiRequest(`/api/challenges/${challengeId}/attendees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
      } else {
        const res = await apiRequest(
          `/api/challenges/${challengeId}/attendees/${encodeURIComponent(username)}`,
          {
            method: 'DELETE',
          }
        );
        if (!res.ok) throw new Error(`Status ${res.status}`);
      }
    } catch (err) {
      console.error(err);
      setError('Action failed');
      setChallenges(prev =>
        prev.map(ch =>
          ch.challengeId === challengeId ? { ...ch, attendee: !attend } : ch
        )
      );
    }
  };

  const handleViewLeaderboard = async (challengeId: number) => {
    setLbLoading(true);
    setLbError('');
    try {
      const res = await apiRequest(`/api/challenges/${challengeId}/leaderboard`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data: LeaderboardEntry[] = await res.json();
      data.sort((a, b) => b.remainingAmount - a.remainingAmount);
      setLeaderboard(data);
      setLeaderboardVisible(true);
    } catch (err) {
      console.error(err);
      setLbError('Failed to load leaderboard');
    } finally {
      setLbLoading(false);
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

  if (loading && challenges.length === 0) { // Full screen loading
    return (
        <View style={[styles.center, { backgroundColor: screenBackgroundColor }]}>
            <ActivityIndicator testID="full-screen-loading" size="large" color={activityIndicatorColor} />
        </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: screenBackgroundColor }]}>
      {/* Header to match Explore and WasteGoal */}
      <View style={styles.headerContainer}>
        <ThemedText type="title">Challenges</ThemedText>
      </View>

      {loading && <ActivityIndicator style={styles.inlineSpinner} size="small" color={activityIndicatorColor} />}
      {error && <ThemedText type="default" style={[styles.error, {color: errorColor}]}>{error}</ThemedText>}

      <View style={styles.filterRow}>
        <View style={styles.switchRow}>
          <Switch
            testID="attended-only-switch"
            value={showAttendedOnly}
            onValueChange={setShowAttendedOnly}
            thumbColor={switchThumbColor}
            trackColor={switchTrackColor}
          />
          <ThemedText type="default" style={styles.switchLabel}>Attended only</ThemedText>
        </View>
        <View style={styles.switchRow}>
          <Switch
            testID="active-only-switch"
            value={showActiveOnly}
            onValueChange={setShowActiveOnly}
            thumbColor={switchThumbColor}
            trackColor={switchTrackColor}
          />
          <ThemedText type="default" style={styles.switchLabel}>Active only</ThemedText>
        </View>
      </View>

      <FlatList
        testID="challenges-list"
        data={filtered}
        keyExtractor={item => String(item.challengeId)}
        contentContainerStyle={styles.listContentContainer} // Adjusted for new padding structure
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: cardBackgroundColor }]}>
            <TouchableOpacity onPress={() => toggleExpand(item.challengeId)}>
              <View style={styles.cardHeader}>
                <ThemedText type="subtitle" style={styles.cardTitle}>{item.name}</ThemedText>
                <ThemedText type="default" style={[styles.cardDate, {color: subtleTextColor}]}>
                  {item.startDate} – {item.endDate}
                </ThemedText>
              </View>
            </TouchableOpacity>

            {expanded.includes(item.challengeId) && (
              <View style={[styles.cardBody, {borderTopColor: borderColor}]}>
                <ThemedText type="default" style={styles.cardDescription}>{item.description}</ThemedText>
                <ThemedText type="default" style={styles.cardInfo}>
                  Amount: {item.amount} | Type: {item.wasteType}
                </ThemedText>

                {!isAdmin && item.status === 'Active' && (
                  <TouchableOpacity
                    testID={`attend-leave-button-${item.challengeId}`}
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

                <TouchableOpacity style={styles.secondaryButton} testID={`view-leaderboard-button-${item.challengeId}`} onPress={() => handleViewLeaderboard(item.challengeId)}>
                
                  <ThemedText type="defaultSemiBold" style={styles.buttonText}>View Leaderboard</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyListContainer}>
              <ThemedText>No challenges match your filters.</ThemedText>
            </View>
          ) : null
        }
      />

      <Modal visible={leaderboardVisible} testID="leaderboard-modal" animationType="slide" transparent>
        <View style={styles.lbOverlay}>
          <View style={[styles.lbContainer, {backgroundColor: modalBackgroundColor}]}>
            <ThemedText type="title" style={styles.lbTitle}>Leaderboard</ThemedText>
            {lbLoading ? (
              <View style={styles.center}>
                 <ActivityIndicator testID="inline-loading" size="large" color={activityIndicatorColor}/>
              </View>
            ) : lbError ? (
              <ThemedText type="default" style={[styles.error, {color: errorColor}]}>{lbError}</ThemedText>
            ) : (
              <>
                <View style={[styles.lbHeaderRow, {borderBottomColor: borderColor}]}>
                  <ThemedText type="defaultSemiBold" style={styles.lbHeaderCell}>Username</ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.lbHeaderCell}>Remaining</ThemedText>
                </View>
                <FlatList
                  data={leaderboard}
                  keyExtractor={item => String(item.userId)}
                  renderItem={({ item, index }) => (
                    <View style={[styles.lbRow, {borderBottomColor: borderColor}]}>
                      <ThemedText type="defaultSemiBold">{index + 1}. {item.username}</ThemedText>
                      <ThemedText type="default">{item.remainingAmount}</ThemedText>
                    </View>
                  )}
                   ListEmptyComponent={
                     <View style={styles.emptyListContainer}><ThemedText>Leaderboard is empty.</ThemedText></View>
                  }
                />
              </>
            )}
            <TouchableOpacity style={styles.lbCloseButton} testID="leaderboard-close-button" onPress={() => setLeaderboardVisible(false)}>
              <ThemedText type="defaultSemiBold">Close</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { paddingHorizontal: 16, marginTop: 48, marginBottom: 18 },
  listContentContainer: { paddingHorizontal: 16, paddingBottom: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  inlineSpinner: { alignSelf: 'center', marginVertical: 8 },
  error: { textAlign: 'center', marginBottom: 12, marginHorizontal: 16 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  switchLabel: { marginLeft: 8, fontSize: 14 },
  card: { borderRadius: 8, padding: 16, marginVertical: 6, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  cardHeader: { marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  cardDate: { fontSize: 12 },
  cardBody: { borderTopWidth: 1, paddingTop: 12 },
  cardDescription: { fontSize: 14, marginBottom: 8 },
  cardInfo: { fontSize: 14, marginBottom: 12 },
  dangerButton: { backgroundColor: '#E53935', padding: 10, borderRadius: 6, alignItems: 'center', marginBottom: 8 },
  secondaryButton: { backgroundColor: '#2196F3', padding: 10, borderRadius: 6, alignItems: 'center', marginBottom: 8 },
  warningButton: { backgroundColor: '#FF9800', padding: 10, borderRadius: 6, alignItems: 'center', marginBottom: 8 },
  buttonText: { fontSize: 14, color: '#FFF', fontWeight: '500' },
  lbOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  lbContainer: { padding: 16, borderTopLeftRadius: 12, borderTopRightRadius: 12, maxHeight: '60%' },
  lbTitle: { fontSize: 20, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  lbHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, marginBottom: 4 },
  lbHeaderCell: { fontSize: 14, flex: 1, textAlign: 'center', fontWeight: '600' },
  lbRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 },
  lbCloseButton: { marginTop: 16, paddingVertical: 10, alignItems: 'center' },
  emptyListContainer: { alignItems: 'center', marginTop: 20, padding: 16 },
});
