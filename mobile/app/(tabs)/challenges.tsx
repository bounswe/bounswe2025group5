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
  useColorScheme,
  Text,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { AuthContext } from '../_layout';
import { API_BASE_URL } from '../apiConfig';
import { useTranslation } from 'react-i18next';

const API_BASE = API_BASE_URL;
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

type ErrorState = {
  key: string | null;
  message: string | null;
};

export default function ChallengesScreen() {
  const { t, i18n } = useTranslation();
  const { userType, username } = useContext(AuthContext);
  const isAdmin = String(userType) === ADMIN_TYPE_PLACEHOLDER;
  const colorScheme = useColorScheme();

  //const [isTurkish, setIsTurkish] = useState(i18n.language === 'tr');
  //const toggleLanguage = () => {
  //  const newLang = isTurkish ? 'en' : 'tr';
  //  i18n.changeLanguage(newLang);
  //  setIsTurkish(!isTurkish);
  //};
  const isTurkish = (i18n.resolvedLanguage || i18n.language || '').toLowerCase().startsWith('tr');
  const toggleLanguage = (value: boolean) => {
    i18n.changeLanguage(value ? 'tr-TR' : 'en-US');
  };

  const isDarkMode = colorScheme === 'dark';
  const screenBackgroundColor = isDarkMode ? '#151718' : '#F0F2F5';
  const cardBackgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const subtleTextColor = isDarkMode ? '#A0A0A0' : '#666666';
  const borderColor = isDarkMode ? '#3A3A3C' : '#EEEEEE';
  const modalBackgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const errorColor = isDarkMode ? '#FF9494' : '#D32F2F';
  const activityIndicatorColor = isDarkMode ? '#FFFFFF' : '#000000';
  const switchThumbColor = Platform.OS === 'android' ? (isDarkMode ? "#81b0ff" : "#2196F3") : undefined;
  const switchTrackColor = { false: (isDarkMode ? "#3e3e3e" : "#e0e0e0"), true: (isDarkMode ? "#5c85d6" : "#81b0ff") };

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<ErrorState>({ key: null, message: null });
  const [showAttendedOnly, setShowAttendedOnly] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [expanded, setExpanded] = useState<number[]>([]);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(false);

  const [lbError, setLbError] = useState<ErrorState>({ key: null, message: null });
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError({ key: null, message: null });
    try {
      const res = await fetch(`${API_BASE}/api/challenges?username=${username}`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Server error: ${res.status}`);
      }
      const data: Challenge[] = await res.json();
      setChallenges(data);
    } catch (err) {
      console.error(err);
      setError({ key: 'errorFailedToLoadChallenges', message: err instanceof Error ? err.message : 'An unknown error occurred' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAttendLeave = async (challengeId: number, attend: boolean) => {
    // Optimistic UI update
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
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Server error: ${res.status}`);
      }
    } catch (err) {
      console.error(err);
      setError({ key: 'errorActionFailed', message: err instanceof Error ? err.message : 'An unknown error occurred' });
      // Revert optimistic update on failure
      setChallenges(prev =>
        prev.map(ch =>
          ch.challengeId === challengeId ? { ...ch, attendee: !attend } : ch
        )
      );
    }
  };

  const handleViewLeaderboard = async (challengeId: number) => {
    setLbLoading(true);
    setLbError({ key: null, message: null });
    try {
      const res = await fetch(`${API_BASE}/api/challenges/leaderboard?id=${challengeId}`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Server error: ${res.status}`);
      }
      const data: LeaderboardEntry[] = await res.json();
      data.sort((a, b) => b.remainingAmount - a.remainingAmount);
      setLeaderboard(data);
      setLeaderboardVisible(true);
    } catch (err) {
      console.error(err);
      setLbError({ key: 'errorFailedToLoadLeaderboard', message: err instanceof Error ? err.message : 'An unknown error occurred' });
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

  if (loading && challenges.length === 0) {
    return (
        <View style={[styles.center, { backgroundColor: screenBackgroundColor }]}>
            <ActivityIndicator testID="full-screen-loading" size="large" color={activityIndicatorColor} />
        </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: screenBackgroundColor }]}>
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <ThemedText type="title">{t('challengesTitle')}</ThemedText>
        </View>
        <View style={styles.languageToggleContainer}>
          <Text style={styles.languageLabel}>EN</Text>
          <Switch
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isDarkMode ? (isTurkish ? '#f5dd4b' : '#f4f4f4') : (isTurkish ? '#f5dd4b' : '#f4f4f4')}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleLanguage}
              value={isTurkish}
          />
          <Text style={styles.languageLabel}>TR</Text>
        </View>
      </View>

      {loading && <ActivityIndicator style={styles.inlineSpinner} size="small" color={activityIndicatorColor} />}
      {/* Render error using the key */}
      {(error.key || error.message) && !loading && (
        <ThemedText type="default" style={[styles.error, { color: errorColor }]}>
          {error.key ? t(error.key) : error.message}
        </ThemedText>
      )}

      <View style={styles.filterRow}>
        <View style={styles.switchRow}>
          <Switch
            testID="attended-only-switch"
            value={showAttendedOnly}
            onValueChange={setShowAttendedOnly}
            thumbColor={switchThumbColor}
            trackColor={switchTrackColor}
          />
          <ThemedText type="default" style={styles.switchLabel}>{t('attendedOnly')}</ThemedText>
        </View>
        <View style={styles.switchRow}>
          <Switch
            testID="active-only-switch"
            value={showActiveOnly}
            onValueChange={setShowActiveOnly}
            thumbColor={switchThumbColor}
            trackColor={switchTrackColor}
          />
          <ThemedText type="default" style={styles.switchLabel}>{t('activeOnly')}</ThemedText>
        </View>
      </View>

      <FlatList
        testID="challenges-list"
        data={filtered}
        keyExtractor={item => String(item.challengeId)}
        contentContainerStyle={styles.listContentContainer}
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
                  {t('challengeAmountAndType', { amount: item.amount, wasteType: item.wasteType })}
                </ThemedText>

                {!isAdmin && item.status === 'Active' && (
                  <TouchableOpacity
                    testID={`attend-leave-button-${item.challengeId}`}
                    style={item.attendee ? styles.warningButton : styles.secondaryButton}
                    onPress={() => handleAttendLeave(item.challengeId, !item.attendee)}
                  >
                    <ThemedText type="defaultSemiBold" style={styles.buttonText}>
                      {item.attendee ? t('leaveChallenge') : t('attendChallenge')}
                    </ThemedText>
                  </TouchableOpacity>
                )}

                {isAdmin && (
                  <TouchableOpacity style={styles.dangerButton} onPress={() => {/* TODO: end challenge */}}>
                    <ThemedText type="defaultSemiBold" style={styles.buttonText}>{t('endChallenge')}</ThemedText>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.secondaryButton} testID={`view-leaderboard-button-${item.challengeId}`} onPress={() => handleViewLeaderboard(item.challengeId)}>
                  <ThemedText type="defaultSemiBold" style={styles.buttonText}>{t('viewLeaderboard')}</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          !loading && !error.key ? (
            <View style={styles.emptyListContainer}>
              <ThemedText>{t('noChallengesMatchFilters')}</ThemedText>
            </View>
          ) : null
        }
      />

      <Modal visible={leaderboardVisible} testID="leaderboard-modal" animationType="slide" transparent>
        <View style={styles.lbOverlay}>
          <View style={[styles.lbContainer, {backgroundColor: modalBackgroundColor}]}>
            <ThemedText type="title" style={styles.lbTitle}>{t('leaderboardTitle')}</ThemedText>
            {lbLoading ? (
              <View style={styles.center}>
                 <ActivityIndicator testID="inline-loading" size="large" color={activityIndicatorColor}/>
              </View>
            ) : lbError.key ? (
              <ThemedText type="default" style={[styles.error, {color: errorColor}]}>
                {t(lbError.key)}
              </ThemedText>
            ) : (
              <>
                <View style={[styles.lbHeaderRow, {borderBottomColor: borderColor}]}>
                  <ThemedText type="defaultSemiBold" style={styles.lbHeaderCell}>{t('username')}</ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.lbHeaderCell}>{t('remaining')}</ThemedText>
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
                     <View style={styles.emptyListContainer}><ThemedText>{t('leaderboardEmpty')}</ThemedText></View>
                  }
                />
              </>
            )}
            <TouchableOpacity style={styles.lbCloseButton} testID="leaderboard-close-button" onPress={() => setLeaderboardVisible(false)}>
              <ThemedText type="defaultSemiBold">{t('close')}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    paddingHorizontal: 16,
    marginTop: 48,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
  },
  languageToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(128,128,128,0.2)',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  languageLabel: {
    color: '#888',
    fontWeight: 'bold',
    marginHorizontal: 6,
    fontSize: 12,
  },
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