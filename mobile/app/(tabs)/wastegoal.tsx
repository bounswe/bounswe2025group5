//app/(tabs)/wastegoal.tsx
import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity,
  Text,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../_layout';
import { Picker } from '@react-native-picker/picker';

const HOST = '162.35.42.102';
const API_BASE = `http://${HOST}:8080/api`;

type WasteGoal = {
  goalId: number;
  wasteType: string;
  amount: number;
  duration: number;
  unit: string;
  progress?: number;
  createdAt: string;
  creatorUsername?: string;
  id?: number;
  username?: string;
  completed?: number;
};

type Navigation = {
  navigate: (screen: string, params?: any) => void;
};

export default function WasteGoalScreen() {
  const navigation = useNavigation<Navigation>();
  const { username, userType } = useContext(AuthContext);
  const colorScheme = useColorScheme();

  const isDarkMode = colorScheme === 'dark';
  const screenBackgroundColor = isDarkMode ? '#151718' : '#F0F2F5';
  const cardBackgroundColor = isDarkMode ? '#2C2C2E' : '#ffffff';
  const modalContentBgColor = isDarkMode ? '#1C1C1E' : '#ffffff';
  const inputBorderColor = isDarkMode ? '#555' : '#ccc';
  const inputTextColor = isDarkMode ? '#E0E0E0' : '#000000';
  const placeholderTextColor = isDarkMode ? '#888' : '#aaa';
  const pickerItemColor = isDarkMode ? '#E0E0E0' : '#000000';
  const pickerBackgroundColor = isDarkMode ? '#2C2C2E' : '#FFFFFF';
  const errorTextColor = isDarkMode ? '#FF9494' : '#D32F2F';
  const errorBackgroundColor = isDarkMode ? '#5D1F1A' : '#FFCDD2';
  const emptyTextColor = isDarkMode ? '#A0A0A0' : '#757575';

  const [goals, setGoals] = useState<WasteGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<WasteGoal | null>(null);
  const [wasteType, setWasteType] = useState('Plastic');
  const [unit, setUnit] = useState('Kilograms');
  const [duration, setDuration] = useState('30');
  const [amount, setAmount] = useState('5.0');
  const [goalFormError, setGoalFormError] = useState('');

  const [addLogModalVisible, setAddLogModalVisible] = useState(false);
  const [currentGoalForLog, setCurrentGoalForLog] = useState<WasteGoal | null>(null);
  const [logEntryAmount, setLogEntryAmount] = useState('');
  const [logFormError, setLogFormError] = useState('');

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<WasteGoal | null>(null);


  useFocusEffect(
    React.useCallback(() => {
      if (username) {
        getGoals();
      } else if (userType === 'guest') {
        setError('Please log in to view and manage waste goals');
        setGoals([]);
      }
    }, [username, userType])
  );

  const getGoals = async () => {
    if (!username || loading) return;
    setLoading(true);
    setError('');
    try {
      const token = await AsyncStorage.getItem('token');
      const url = `${API_BASE}/goals/info?username=${username}&size=50`;
      const response = await fetch(url, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch waste goals: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      const goalsData: WasteGoal[] = Array.isArray(data) ? data : data.goals || [];
      setGoals(goalsData);
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching goals');
    } finally {
      setLoading(false);
    }
  };

  const validateGoalInput = (): boolean => {
    setGoalFormError('');
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setGoalFormError('Amount must be a positive number.');
      return false;
    }
    const parsedDuration = parseInt(duration, 10);
    if (isNaN(parsedDuration) || parsedDuration < 1) {
      setGoalFormError('Duration must be at least 1 day.');
      return false;
    }
    return true;
  };

  const validateLogInput = (): boolean => {
    setLogFormError('');
    const parsedLogAmount = parseFloat(logEntryAmount);
    if (isNaN(parsedLogAmount) || parsedLogAmount <= 0) {
      setLogFormError('Log amount must be a positive number.');
      return false;
    }
    return true;
  };


  const handleAddWasteLog = async () => {
    if (!currentGoalForLog || !username) {
      Alert.alert('Error', 'Goal information is missing.');
      return;
    }
    if (!validateLogInput()) return;

    const goalIdToLog = currentGoalForLog.goalId;
    if (!goalIdToLog) {
      Alert.alert('Error', 'Selected goal has no valid ID for logging.');
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const requestBody = {
        username: username,
        goalId: goalIdToLog,
        amount: parseFloat(logEntryAmount),
        unit: currentGoalForLog.unit,
      };
      const apiEndpoint = `${API_BASE}/logs/create`;
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify(requestBody),
      });
      const responseText = await response.text();
      if (!response.ok) {
        let errorMessage = `Failed to add waste log: ${response.status}`;
        try { const errorJson = JSON.parse(responseText); errorMessage += ` - ${errorJson.message || JSON.stringify(errorJson)}`;}
        catch (e) { errorMessage += ` - ${responseText}`; }
        throw new Error(errorMessage);
      }
      Alert.alert('Success', 'Waste log added successfully!');
      setAddLogModalVisible(false);
      setCurrentGoalForLog(null);
      setLogEntryAmount('');
      setLogFormError('');
      getGoals();
    } catch (err) {
      console.error('Error adding waste log:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add waste log');
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async () => {
    if (!username) return;
    if (!validateGoalInput()) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const requestBody = {
        username,
        unit,
        wasteType,
        duration: parseInt(duration, 10),
        amount: parseFloat(amount)
      };
      const response = await fetch(`${API_BASE}/goals/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create waste goal: ${response.status} ${errorText}`);
      }
      Alert.alert('Success', 'Waste goal created successfully.');
      setModalVisible(false);
      resetForm();
      getGoals();
    } catch (err) {
      console.error('Error creating goal:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create waste goal');
    } finally {
      setLoading(false);
    }
  };

  const editWasteGoal = async () => {
    if (!username || !editingGoal || !editingGoal.goalId) {
        Alert.alert('Error', 'Goal information is incomplete for editing.');
        return;
    }
    if (!validateGoalInput()) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const requestBody = {
        username,
        unit,
        wasteType,
        duration: parseInt(duration, 10),
        amount: parseFloat(amount)
      };
      const response = await fetch(`${API_BASE}/goals/edit/${editingGoal.goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to edit waste goal: ${response.status} ${errorText}`);
      }
      Alert.alert('Success', 'Waste goal updated successfully.');
      setModalVisible(false);
      resetForm();
      getGoals();
    } catch (err) {
      console.error('Error editing goal:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to edit waste goal');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!goalToDelete || !goalToDelete.goalId) {
      Alert.alert('Error', 'No goal selected for deletion or goal ID is missing.');
      setIsDeleteModalVisible(false);
      setGoalToDelete(null);
      return;
    }
    setLoading(true);
    setIsDeleteModalVisible(false);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE}/goals/delete/${goalToDelete.goalId}`, {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete waste goal: ${response.status} ${errorText}`);
      }
      Alert.alert('Success', 'Waste goal deleted successfully.');
      getGoals();
    } catch (err)
{
      console.error('Error deleting goal:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete waste goal');
    } finally {
      setGoalToDelete(null);
      setLoading(false);
    }
  };


  const openEditModal = (goal: WasteGoal) => {
    setGoalFormError('');
    setEditingGoal(goal);
    setWasteType(goal.wasteType);
    setUnit(goal.unit);
    setDuration(goal.duration.toString());
    setAmount(goal.amount.toString());
    setModalVisible(true);
  };

  const resetForm = () => {
    setWasteType('Plastic');
    setUnit('Kilograms');
    setDuration('30');
    setAmount('5.0');
    setEditingGoal(null);
    setGoalFormError('');
  };

  const openAddLogModal = (goal: WasteGoal) => {
    setCurrentGoalForLog(goal);
    setLogEntryAmount('');
    setLogFormError('');
    setAddLogModalVisible(true);
  };

  const openDeleteConfirmationModal = (goal: WasteGoal) => {
    setGoalToDelete(goal);
    setIsDeleteModalVisible(true);
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage < 14.3) {
      return '#2E7D32';
    } else if (percentage < 28.6) {
      return '#66BB6A';
    } else if (percentage < 42.9) {
      return '#9CCC65';
    } else if (percentage < 57.1) {
      return '#FFC107';
    } else if (percentage < 71.4) {
      return '#FFA726';
    } else if (percentage < 85.7) {
      return '#FF7043';
    } else {
      return '#E53935';
    }
  };


  const renderGoalItem = ({ item }: { item: WasteGoal }) => {
    const progressPercentage = item.progress !== undefined ? item.progress : 0;
    const progressBarWidthPercentage = Math.max(0, Math.min(100, progressPercentage));
    const progressBarColor = getProgressBarColor(progressPercentage);

    const accumulatedWaste = (progressPercentage / 100) * item.amount;
    const remainingQuota = Math.max(0, item.amount - accumulatedWaste);


    return (
    <View style={[styles.goalItem, { backgroundColor: cardBackgroundColor }]}>
      <View style={styles.goalHeader}>
        <ThemedText style={styles.goalType}>{item.wasteType}</ThemedText>
        <View style={styles.goalActions}>
          {progressPercentage < 100 && (
            <TouchableOpacity
              style={styles.addLogButton}
              onPress={() => openAddLogModal(item)}
            >
              <Text style={styles.buttonText}>Add Log</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openEditModal(item)}
          >
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => openDeleteConfirmationModal(item)}
          >
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ThemedText style={styles.goalDetails}>
        Target: {item.amount} {item.unit} in {item.duration} days
      </ThemedText>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progressBarWidthPercentage}%`, backgroundColor: progressBarColor }]} />
      </View>
      <View style={styles.progressTextsContainer}>
        <ThemedText style={[styles.goalProgressText, styles.remainingQuotaText, { color: progressBarColor }]}>
          Remaining Quota:                                {remainingQuota.toFixed(1)} {item.unit} in {item.duration} days                              
        </ThemedText>
        <ThemedText style={[styles.goalProgressText, { color: progressBarColor, textAlign: 'right' }]}>
          Waste Load: {progressPercentage.toFixed(1)}%
        </ThemedText>
      </View>
    </View>
  )};

  return (
    <ThemedView style={[styles.container, { backgroundColor: screenBackgroundColor }]}>
      <View style={styles.headerContainer}>
        <ThemedText type="title">
          Waste Reduction Goals
        </ThemedText>
      </View>

      {!username && userType === 'guest' ? (
        <ThemedText style={[styles.errorText, { color: errorTextColor, backgroundColor: errorBackgroundColor }]}>
          Please log in to view and manage waste goals.
        </ThemedText>
      ) : (
        <>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => {
              resetForm();
              setModalVisible(true);
            }}
          >
            <Text style={styles.buttonText}>Create New Goal</Text>
          </TouchableOpacity>

          {error && !loading && <ThemedText style={[styles.errorText, { color: errorTextColor, backgroundColor: errorBackgroundColor }]}>{error}</ThemedText>}

          <FlatList
            data={goals}
            renderItem={renderGoalItem}
            keyExtractor={item => {
                if (!item || typeof item.goalId !== 'number') {
                    console.warn('Invalid item for keyExtractor:', item);
                    return `invalid-${Date.now()}-${Math.random()}`;
                }
                return item.goalId.toString();
            }}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              !loading && !error ? (
                <ThemedText style={[styles.emptyText, {color: emptyTextColor}]}>
                  No waste goals found. Create your first goal!
                </ThemedText>
              ) : null
            }
            ListFooterComponent={
              loading ? (
                <ActivityIndicator size="large" color={isDarkMode ? "#66BB6A" : "#4CAF50"} style={styles.loadingSpinner} />
              ) : null
            }
          />

          <Modal
            visible={modalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => {
              setModalVisible(false);
              resetForm();
            }}
          >
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { backgroundColor: modalContentBgColor }]}>
                <ThemedText style={styles.modalTitle}>
                  {editingGoal ? 'Edit Waste Goal' : 'Create New Waste Goal'}
                </ThemedText>
                <ThemedText style={styles.inputLabel}>Waste Type</ThemedText>
                <View style={[styles.pickerContainer, { borderColor: inputBorderColor, backgroundColor: pickerBackgroundColor }]}>
                  <Picker selectedValue={wasteType} onValueChange={setWasteType} style={[styles.picker, {color: pickerItemColor}]} itemStyle={{ color: pickerItemColor, backgroundColor: pickerBackgroundColor }}>
                    <Picker.Item label="Plastic" value="Plastic" />
                    <Picker.Item label="Paper" value="Paper" />
                    <Picker.Item label="Glass" value="Glass" />
                    <Picker.Item label="Metal" value="Metal" />
                    <Picker.Item label="Organic" value="Organic" />
                  </Picker>
                </View>
                <ThemedText style={styles.inputLabel}>Unit</ThemedText>
                <View style={[styles.pickerContainer, { borderColor: inputBorderColor, backgroundColor: pickerBackgroundColor }]}>
                  <Picker selectedValue={unit} onValueChange={setUnit} style={[styles.picker, {color: pickerItemColor}]} itemStyle={{ color: pickerItemColor, backgroundColor: pickerBackgroundColor }}>
                    <Picker.Item label="Kilograms" value="Kilograms" />
                    <Picker.Item label="Grams" value="Grams" />
                    <Picker.Item label="Liters" value="Liters" />
                    <Picker.Item label="Units" value="Units" />
                    <Picker.Item label="Bottles" value="Bottles" />
                  </Picker>
                </View>
                <ThemedText style={styles.inputLabel}>Amount</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: inputBorderColor, color: inputTextColor, backgroundColor: pickerBackgroundColor }]}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="e.g., 5.0"
                  placeholderTextColor={placeholderTextColor}
                />
                <ThemedText style={styles.inputLabel}>Duration (days)</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: inputBorderColor, color: inputTextColor, backgroundColor: pickerBackgroundColor }]}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                  placeholder="e.g., 30"
                  placeholderTextColor={placeholderTextColor}
                />

                {goalFormError ? (
                  <ThemedText style={[styles.modalFormErrorText, { color: errorTextColor }]}>{goalFormError}</ThemedText>
                ) : null}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setModalVisible(false);
                      resetForm();
                    }}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={editingGoal ? editWasteGoal : createGoal}
                    disabled={loading}
                  >
                    <Text style={styles.buttonText}>{loading ? 'Saving...' : (editingGoal ? 'Update' : 'Save')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal
            visible={addLogModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => {
              setAddLogModalVisible(false);
              setCurrentGoalForLog(null);
              setLogEntryAmount('');
              setLogFormError('');
            }}
          >
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { backgroundColor: modalContentBgColor }]}>
                <ThemedText style={styles.modalTitle}>Add Waste Log</ThemedText>
                {currentGoalForLog && (
                  <ThemedText style={styles.modalSubtitle}>
                    For Goal: {currentGoalForLog.wasteType} ({currentGoalForLog.amount} {currentGoalForLog.unit})
                  </ThemedText>
                )}
                <ThemedText style={styles.inputLabel}>Amount ({currentGoalForLog?.unit || ''})</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: inputBorderColor, color: inputTextColor, backgroundColor: pickerBackgroundColor }]}
                  value={logEntryAmount}
                  onChangeText={setLogEntryAmount}
                  keyboardType="numeric"
                  placeholder={`e.g., 0.5 ${currentGoalForLog?.unit || 'units'}`}
                  placeholderTextColor={placeholderTextColor}
                />

                {logFormError ? (
                  <ThemedText style={[styles.modalFormErrorText, { color: errorTextColor }]}>{logFormError}</ThemedText>
                ) : null}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setAddLogModalVisible(false);
                      setCurrentGoalForLog(null);
                      setLogEntryAmount('');
                      setLogFormError('');
                    }}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleAddWasteLog}
                    disabled={loading}
                  >
                    <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Confirm Log'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal
            visible={isDeleteModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => {
              setIsDeleteModalVisible(false);
              setGoalToDelete(null);
            }}
          >
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { backgroundColor: modalContentBgColor }]}>
                <ThemedText style={styles.modalTitle}>Confirm Deletion</ThemedText>
                {goalToDelete && (
                  <ThemedText style={styles.deleteConfirmText}>
                    Are you sure you want to delete the goal: {'\n'}
                    <ThemedText type="defaultSemiBold">{goalToDelete.wasteType}</ThemedText> for <ThemedText type="defaultSemiBold">{goalToDelete.amount} {goalToDelete.unit}</ThemedText>?
                  </ThemedText>
                )}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setIsDeleteModalVisible(false);
                      setGoalToDelete(null);
                    }}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, styles.confirmDeleteButton]}
                    onPress={handleDeleteConfirm}
                    disabled={loading}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'Deleting...' : 'Delete'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, },
  headerContainer: { paddingHorizontal: 16, marginTop: 48, marginBottom: 18, },
  listContainer: { paddingHorizontal: 16, paddingBottom: 20, },
  goalItem: { borderRadius: 10, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, },
  goalType: { fontSize: 18, fontWeight: '600', color: '#2E7D32', flexShrink: 1, marginRight: 8, },
  goalDetails: { fontSize: 15, marginBottom: 8, },
  goalActions: { flexDirection: 'row', alignItems: 'center', gap: 8, },
  createButton: { backgroundColor: '#4CAF50', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 8, marginHorizontal: 80, marginBottom: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2, },
  editButton: { backgroundColor: '#1976D2', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, },
  deleteButton: { backgroundColor: '#D32F2F', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, },
  addLogButton: { backgroundColor: '#388E3C', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, },
  buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13, },
  errorText: { textAlign: 'center', marginTop: 20, marginHorizontal: 16, padding: 10, borderRadius: 6, },
  modalFormErrorText: { textAlign: 'center', marginBottom: 10, fontSize: 14, },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16, },
  loadingSpinner: { marginVertical: 30, },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.6)', },
  modalContent: { borderRadius: 12, padding: 25, width: '90%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 10, },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', },
  inputLabel: {fontSize: 16, marginBottom: 6, fontWeight: '500',},
  input: {borderWidth: 1, borderRadius: 6, padding: 12, marginBottom: 18, fontSize: 16,},
  pickerContainer: {borderWidth: 1, borderRadius: 6, marginBottom: 18, justifyContent: 'center' },
  picker: {height: 50,},
  modalButtons: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 10,},
  cancelButton: {backgroundColor: '#757575', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8,width: '48%', alignItems: 'center',},
  saveButton: {backgroundColor: '#4CAF50', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8, width: '48%', alignItems: 'center',},
  confirmDeleteButton: {backgroundColor: '#D32F2F',},
  deleteConfirmText: {fontSize: 16, textAlign: 'center', marginBottom: 20, lineHeight: 24,},
  progressBarContainer: {height: 12, backgroundColor: '#e0e0e0', borderRadius: 6, marginTop: 10, overflow: 'hidden',},
  progressBarFill: {height: '100%', borderRadius: 6,},
  progressTextsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, },
  goalProgressText: {fontSize: 14, fontWeight: '500', flex: 1,}, 
  remainingQuotaText: { textAlign: 'left', },
  modalSubtitle: {fontSize: 16, textAlign: 'center', marginBottom: 18, fontStyle: 'italic',},
});