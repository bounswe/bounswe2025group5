import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, ActivityIndicator, Switch, TextInput, Modal, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

const API_BASE = 'http://localhost:8080';

type Challenge = {
  name: string;
  description: string;
  amount: number;
  startDate: string;
  endDate: string;
  wasteType: string;
};

export default function ChallengesScreen() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [attended, setAttended] = useState<Challenge[]>([]);
  const [showAttendedOnly, setShowAttendedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newChallenge, setNewChallenge] = useState<Challenge>({
    name: '', description: '', amount: 0, startDate: '', endDate: '', wasteType: ''
  });

  const toggleExpand = (name: string) => {
    setExpanded(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [allRes, userRes] = await Promise.all([
        fetch(`${API_BASE}/api/challenges`),
        fetch(`${API_BASE}/api/challenges/attended_challenges`),
      ]);
      const all = await allRes.json();
      const user = await userRes.json();
      setChallenges(all);
      setAttended(user);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const createChallengeAPI = async () => {
    try {
      setLoading(true);
      await fetch(`${API_BASE}/api/challenges/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChallenge),
      });
      setModalVisible(false);
      // reset form
      setNewChallenge({ name: '', description: '', amount: 0, startDate: '', endDate: '', wasteType: '' });
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <ActivityIndicator style={styles.center} />;

  const dataToShow = showAttendedOnly ? attended : challenges;

  return (
    <View style={styles.container}>
      <ThemedText type="title" style={styles.title}>Challenges</ThemedText>

      {/* Create */}
      <TouchableOpacity style={styles.createButton} onPress={() => setModalVisible(true)}>
        <ThemedText type="default" style={styles.createButtonText}>Create Challenge</ThemedText>
      </TouchableOpacity>

      {/* Filter */}
      <View style={styles.filterRow}>
        <Switch value={showAttendedOnly} onValueChange={setShowAttendedOnly} />
        <ThemedText type="default">Attended only</ThemedText>
      </View>

      {/* Error */}
      {error && <ThemedText type="default" style={styles.errorText}>Failed to load challenges</ThemedText>}

      {/* List or Empty */}
      {dataToShow.length === 0 ? (
        <View style={styles.center}><ThemedText type="default">No challenges found.</ThemedText></View>
      ) : (
        <FlatList
          data={dataToShow}
          keyExtractor={item => item.name}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity onPress={() => toggleExpand(item.name)}>
                <View style={styles.header}>
                  <ThemedText type="title">{item.name}</ThemedText>
                  <ThemedText type="default">{item.startDate} - {item.endDate}</ThemedText>
                </View>
              </TouchableOpacity>
              {expanded.includes(item.name) && (
                <View style={styles.details}>
                  <ThemedText type="default">{item.description}</ThemedText>
                  <ThemedText type="default">Amount: {item.amount}</ThemedText>
                  <ThemedText type="default">Type: {item.wasteType}</ThemedText>
                  <TouchableOpacity style={styles.leaderboardButton} onPress={() => {}}>
                    <ThemedText type="default" style={styles.leaderboardText}>View Leaderboard</ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}

      {/* Modal for Create */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ThemedText type="title" style={styles.modalTitle}>New Challenge</ThemedText>
            {(['name','description','amount','startDate','endDate','wasteType'] as (keyof Challenge)[]).map(key => (
              <TextInput
                key={key}
                placeholder={key}
                value={key === 'amount' ? (newChallenge.amount === 0 ? '' : String(newChallenge.amount)) : String(newChallenge[key])}
                onChangeText={text => setNewChallenge(prev => ({
                  ...prev,
                  [key]: key === 'amount' ? Number(text) : text
                }))}
                keyboardType={key === 'amount' ? 'numeric' : 'default'}
                style={styles.input}
              />
            ))}
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCancel}>
                <ThemedText type="default">Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity onPress={createChallengeAPI} style={styles.modalSave}>
                <ThemedText type="default">Save</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  createButton: { backgroundColor: '#4CAF50', padding: 12, borderRadius: 6, marginBottom: 12, alignItems: 'center' },
  createButtonText: { fontSize: 16, color: '#fff' },
  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 8 },
  errorText: { color: 'red', marginBottom: 12, textAlign: 'center' },
  card: { borderWidth: 1, borderRadius: 8, borderColor: '#ccc', padding: 12, marginBottom: 12 },
  header: { marginBottom: 8 },
  details: { marginTop: 8 },
  leaderboardButton: { marginTop: 8, padding: 8, backgroundColor: '#2196F3', borderRadius: 4, alignItems: 'center' },
  leaderboardText: { color: '#fff' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', backgroundColor: '#fff', borderRadius: 8, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 4, padding: 8, marginBottom: 10 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  modalCancel: { padding: 10 },
  modalSave: { padding: 10 }
});