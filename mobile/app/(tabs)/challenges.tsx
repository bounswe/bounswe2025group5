import React, { useState, useContext } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  StyleSheet,
  GestureResponderEvent,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { AuthContext } from '../_layout';

// Placeholder admin type constant; replace with your actual admin identifier
const ADMIN_TYPE_PLACEHOLDER = 'admin';

type Challenge = {
  name: string;
  description: string;
  amount: number;
  startDate: string;
  endDate: string;
  wasteType: string;
  isAttendee?: boolean;
};

const mockChallenges: Challenge[] = [
  {
    name: 'Plastic Waste Reduction',
    description: 'A challenge to reduce plastic waste in our community.',
    amount: 100,
    startDate: '2025-05-01',
    endDate: '2025-06-01',
    wasteType: 'Plastic',
    isAttendee: true,
  },
  {
    name: 'Paper Recycling Drive',
    description: 'Collect and recycle at least 200 kg of paper materials.',
    amount: 200,
    startDate: '2025-05-10',
    endDate: '2025-06-10',
    wasteType: 'Paper',
    isAttendee: false,
  },
  {
    name: 'Glass Reuse Challenge',
    description: 'Encourage reuse of glass bottles and jars.',
    amount: 150,
    startDate: '2025-05-15',
    endDate: '2025-06-15',
    wasteType: 'Glass',
    isAttendee: true,
  },
];

export default function ChallengesScreen() {
  const { userType } = useContext(AuthContext);
  const [showAttendedOnly, setShowAttendedOnly] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newChallenge, setNewChallenge] = useState<Challenge>({
    name: '',
    description: '',
    amount: 0,
    startDate: '',
    endDate: '',
    wasteType: '',
  });

  const challenges = mockChallenges;
  const attended = mockChallenges.filter(c => c.isAttendee);
  const dataToShow = showAttendedOnly ? attended : challenges;

  const isAdmin = String(userType) === ADMIN_TYPE_PLACEHOLDER;

  const toggleExpand = (name: string) => {
    setExpanded(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const handleAction = (item: Challenge, action: string) => (e: GestureResponderEvent) => {
    console.log(`${action} pressed for`, item.name);
  };

  const submitChallenge = () => {
    console.log('Creating challenge:', newChallenge);
    setModalVisible(false);
    setNewChallenge({ name: '', description: '', amount: 0, startDate: '', endDate: '', wasteType: '' });
  };

  return (
    <View style={styles.container}>
      <ThemedText type="title" style={styles.screenTitle}>Challenges</ThemedText>

      {isAdmin && (
        <TouchableOpacity style={styles.primaryButton} onPress={() => setModalVisible(true)}>
          <ThemedText type="defaultSemiBold" style={styles.primaryButtonText}>Create Challenge</ThemedText>
        </TouchableOpacity>
      )}

      <View style={styles.toggleRow}>
        <Switch value={showAttendedOnly} onValueChange={setShowAttendedOnly} />
        <ThemedText type="default" style={styles.toggleLabel}>Show attended only</ThemedText>
      </View>

      <FlatList
        data={dataToShow}
        keyExtractor={item => item.name}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => toggleExpand(item.name)}>
              <View style={styles.cardHeader}>
                <ThemedText type="subtitle" style={styles.cardTitle}>{item.name}</ThemedText>
                <ThemedText type="default" style={styles.cardDate}>
                  {item.startDate} – {item.endDate}
                </ThemedText>
              </View>
            </TouchableOpacity>

            {expanded.includes(item.name) && (
              <View style={styles.cardBody}>
                <ThemedText type="default" style={styles.cardDescription}>{item.description}</ThemedText>
                <ThemedText type="default" style={styles.cardInfo}>Amount: {item.amount} | Type: {item.wasteType}</ThemedText>

                {isAdmin && (
                  <TouchableOpacity style={styles.dangerButton} onPress={handleAction(item, 'End Challenge')}>
                    <ThemedText type="defaultSemiBold" style={styles.buttonText}>End Challenge</ThemedText>
                  </TouchableOpacity>
                )}

                {!isAdmin && (
                  <TouchableOpacity
                    style={item.isAttendee ? styles.warningButton : styles.secondaryButton}
                    onPress={handleAction(item, item.isAttendee ? 'Leave Challenge' : 'Attend Challenge')}
                  >
                    <ThemedText type="defaultSemiBold" style={styles.buttonText}>{item.isAttendee ? 'Leave Challenge' : 'Attend Challenge'}</ThemedText>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.secondaryButton} onPress={handleAction(item, 'View Leaderboard')}>
                  <ThemedText type="defaultSemiBold" style={styles.buttonText}>View Leaderboard</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ThemedText type="subtitle" style={styles.modalTitle}>New Challenge</ThemedText>
            {(['name','description','amount','startDate','endDate','wasteType'] as (keyof Challenge)[]).map(key => (
              <TextInput
                key={key}
                placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                value={key === 'amount' ? (newChallenge.amount === 0 ? '' : String(newChallenge.amount)) : newChallenge[key] as string}
                onChangeText={text => setNewChallenge(prev => ({
                  ...prev,
                  [key]: key === 'amount' ? Number(text) : text,
                }))}
                keyboardType={key === 'amount' ? 'numeric' : 'default'}
                style={styles.input}
              />
            ))}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <ThemedText type="defaultSemiBold">Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={submitChallenge}>
                <ThemedText type="defaultSemiBold">Save</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', paddingHorizontal: 16 },
  screenTitle: { fontSize: 22, fontWeight: '600', marginVertical: 12, textAlign: 'center' },
  primaryButton: { backgroundColor: '#4CAF50', paddingVertical: 12, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
  primaryButtonText: { fontSize: 16, color: '#FFF' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 8 },
  toggleLabel: { marginLeft: 8, fontSize: 14 },
  card: { backgroundColor: '#FFF', borderRadius: 8, padding: 16, marginVertical: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  cardHeader: { marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  cardDate: { fontSize: 12, color: '#666', marginTop: 2 },
  cardBody: { borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 12 },
  cardDescription: { fontSize: 14, color: '#333', marginBottom: 8 },
  cardInfo: { fontSize: 14, color: '#555', marginBottom: 12 },
  dangerButton: { backgroundColor: '#E53935', paddingVertical: 8, borderRadius: 6, alignItems: 'center', marginBottom: 8 },
  secondaryButton: { backgroundColor: '#2196F3', paddingVertical: 8, borderRadius: 6, alignItems: 'center', marginBottom: 8 },
  warningButton: { backgroundColor: '#FF9800', paddingVertical: 8, borderRadius: 6, alignItems: 'center', marginBottom: 8 },
  buttonText: { fontSize: 14, color: '#FFF', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '90%', backgroundColor: '#FFF', borderRadius: 8, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 4, padding: 10, marginBottom: 10 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  cancelButton: { padding: 10 },
  saveButton: { padding: 10 },
});