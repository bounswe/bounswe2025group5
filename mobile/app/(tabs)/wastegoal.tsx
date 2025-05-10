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
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../_layout';
import { Picker } from '@react-native-picker/picker';

const API_BASE = 'http://localhost:8080/api';

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
  
  const [goals, setGoals] = useState<WasteGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // General screen error

  // Create/Edit Goal Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<WasteGoal | null>(null);
  const [wasteType, setWasteType] = useState('Plastic');
  const [unit, setUnit] = useState('Kilograms');
  const [duration, setDuration] = useState('30');
  const [amount, setAmount] = useState('5.0');
  const [formError, setFormError] = useState(''); // Error message for the modal form

  // Add Waste Log Modal
  const [addLogModalVisible, setAddLogModalVisible] = useState(false);
  const [currentGoalForLog, setCurrentGoalForLog] = useState<WasteGoal | null>(null);
  const [logEntryAmount, setLogEntryAmount] = useState('');

  // Delete Confirmation Modal
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
    setFormError(''); // Clear previous errors

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Amount must be a positive number.');
      return false;
    }

    const parsedDuration = parseInt(duration, 10);
    if (isNaN(parsedDuration) || parsedDuration < 1) {
      setFormError('Duration must be at least 1 day.');
      return false;
    }
    return true;
  };


  const handleAddWasteLog = async () => {
    if (!currentGoalForLog || !username || !logEntryAmount) {
      Alert.alert('Error', 'Please ensure an amount is entered and a goal is selected.');
      return;
    }
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
    if (!validateGoalInput()) return; // Validate input first

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
      resetForm(); // Also clears formError via setFormError('') in resetForm
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
    if (!validateGoalInput()) return; // Validate input first

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
      resetForm(); // Also clears formError
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
    } catch (err) {
      console.error('Error deleting goal:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete waste goal');
    } finally {
      setGoalToDelete(null); 
      setLoading(false);
    }
  };


  const openEditModal = (goal: WasteGoal) => {
    setFormError(''); // Clear any previous form errors
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
    setFormError(''); // Clear form error when resetting
  };

  const openAddLogModal = (goal: WasteGoal) => {
    setCurrentGoalForLog(goal);
    setLogEntryAmount('');
    setAddLogModalVisible(true);
  };

  const openDeleteConfirmationModal = (goal: WasteGoal) => {
    setGoalToDelete(goal);
    setIsDeleteModalVisible(true);
  };


  const renderGoalItem = ({ item }: { item: WasteGoal }) => {
    const progressFraction = item.progress !== undefined ? item.progress : 0;
    const progressPercentage = Math.max(0, Math.min(100, progressFraction * 100));
    const isGoalComplete = progressPercentage >= 100;

    return (
    <View style={styles.goalItem}>
      <View style={styles.goalHeader}>
        <Text style={styles.goalType}>{item.wasteType}</Text>
        <View style={styles.goalActions}>
          {!isGoalComplete && (
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
      <Text style={styles.goalDetails}>
        Goal: {item.amount} {item.unit} in {item.duration} days
      </Text>
      
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
      </View>
      <Text style={styles.goalProgressText}> 
        Progress: {progressPercentage.toFixed(2)}% 
        {isGoalComplete && <Text style={styles.completedText}> (Completed!)</Text>}
      </Text>
    </View>
  )};

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Waste Reduction Goals
      </ThemedText>
      
      {!username && userType === 'guest' ? (
        <Text style={styles.errorText}>
          Please log in to view and manage waste goals.
        </Text>
      ) : (
        <>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => { 
              resetForm(); // This now also clears formError
              setModalVisible(true); 
            }}
          >
            <Text style={styles.buttonText}>Create New Goal</Text>
          </TouchableOpacity>
          
          {error && !loading && <Text style={styles.errorText}>{error}</Text>}

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
                <Text style={styles.emptyText}>
                  No waste goals found. Create your first goal!
                </Text>
              ) : null
            }
            ListFooterComponent={
              loading ? (
                <ActivityIndicator size="large" color="#4CAF50" style={styles.loadingSpinner} />
              ) : null
            }
          />
          
          {/* Goal Create/Edit Modal */}
          <Modal
            visible={modalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => { 
              setModalVisible(false); 
              resetForm(); // Clear form and formError on close
            }}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {editingGoal ? 'Edit Waste Goal' : 'Create New Waste Goal'}
                </Text>
                <Text style={styles.inputLabel}>Waste Type</Text>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={wasteType} onValueChange={setWasteType} style={styles.picker}>
                    <Picker.Item label="Plastic" value="Plastic" />
                    <Picker.Item label="Paper" value="Paper" />
                    <Picker.Item label="Glass" value="Glass" />
                    <Picker.Item label="Metal" value="Metal" />
                    <Picker.Item label="Organic" value="Organic" />
                    <Picker.Item label="Electronic" value="Electronic" />
                  </Picker>
                </View>
                <Text style={styles.inputLabel}>Unit</Text>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={unit} onValueChange={setUnit} style={styles.picker}>
                    <Picker.Item label="Kilograms" value="Kilograms" />
                    <Picker.Item label="Pounds" value="Pounds" />
                    <Picker.Item label="Items" value="Items" />
                  </Picker>
                </View>
                <Text style={styles.inputLabel}>Amount</Text>
                <TextInput 
                  style={styles.input} 
                  value={amount} 
                  onChangeText={setAmount} 
                  keyboardType="numeric" 
                  placeholder="e.g., 5.0"
                />
                <Text style={styles.inputLabel}>Duration (days)</Text>
                <TextInput 
                  style={styles.input} 
                  value={duration} 
                  onChangeText={setDuration} 
                  keyboardType="numeric" 
                  placeholder="e.g., 30"
                />
                
                {/* Display Form Error Message */}
                {formError ? (
                  <Text style={styles.modalFormErrorText}>{formError}</Text>
                ) : null}

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={() => { 
                      setModalVisible(false); 
                      resetForm(); // Clear form and formError
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

          {/* Add Waste Log Modal */}
          <Modal
            visible={addLogModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => { setAddLogModalVisible(false); setCurrentGoalForLog(null); setLogEntryAmount(''); }}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Add Waste Log</Text>
                {currentGoalForLog && (
                  <Text style={styles.modalSubtitle}>
                    For Goal: {currentGoalForLog.wasteType} ({currentGoalForLog.amount} {currentGoalForLog.unit})
                  </Text>
                )}
                <Text style={styles.inputLabel}>Amount ({currentGoalForLog?.unit || ''})</Text>
                <TextInput style={styles.input} value={logEntryAmount} onChangeText={setLogEntryAmount} keyboardType="numeric" placeholder={`e.g., 0.5 ${currentGoalForLog?.unit || 'units'}`}/>
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => { setAddLogModalVisible(false); setCurrentGoalForLog(null); setLogEntryAmount(''); }}>
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleAddWasteLog} disabled={loading || !logEntryAmount}>
                    <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Confirm Log'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Delete Confirmation Modal */}
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
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Confirm Deletion</Text>
                {goalToDelete && (
                  <Text style={styles.deleteConfirmText}>
                    Are you sure you want to delete the goal: {'\n'}
                    <Text style={{fontWeight: 'bold'}}>{goalToDelete.wasteType}</Text> for <Text style={{fontWeight: 'bold'}}>{goalToDelete.amount} {goalToDelete.unit}</Text>?
                  </Text>
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
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  listContainer: {
    paddingBottom: 20,
  },
  goalItem: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
    flexShrink: 1, 
    marginRight: 8, 
  },
  goalDetails: {
    fontSize: 15,
    color: '#555',
    marginBottom: 8,
  },
  goalActions: {
    flexDirection: 'row',
    alignItems: 'center', 
    gap: 8, 
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  editButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 10, 
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButton: {
    backgroundColor: '#D32F2F', 
    paddingHorizontal: 10, 
    paddingVertical: 8,
    borderRadius: 6,
  },
  addLogButton: {
    backgroundColor: '#388E3C',
    paddingHorizontal: 10, 
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13, 
  },
  errorText: { // General screen error
    color: '#D32F2F',
    textAlign: 'center',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FFCDD2',
    borderRadius: 6,
  },
  modalFormErrorText: { // Specific for modal form errors
    color: '#D32F2F', // Red color for error text
    textAlign: 'center',
    marginBottom: 10, // Space before modal buttons
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: '#757575',
    marginTop: 40,
    fontSize: 16,
  },
  loadingSpinner: {
    marginVertical: 30,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 25,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 6,
    color: '#444',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
    marginBottom: 18,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 18,
  },
  picker: {
    height: 50,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10, // Reduced margin if error text is present
  },
  cancelButton: { 
    backgroundColor: '#757575', 
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  saveButton: { 
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  confirmDeleteButton: { 
    backgroundColor: '#D32F2F', 
  },
  deleteConfirmText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    marginBottom: 20,
    lineHeight: 24,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#66BB6A',
    borderRadius: 6,
  },
  goalProgressText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'right',
  },
  completedText: { 
    color: '#388E3C', 
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 18,
    fontStyle: 'italic',
  },
});