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
  id?: number;
  goalId?: number;
  username?: string;
  unit: string;
  wasteType: string;
  duration: number;
  amount: number;
  createdAt?: string;
  date?: string;
  percentOfProgress?: number;
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
  const [error, setError] = useState('');
  const [lastGoalId, setLastGoalId] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  // New goal form
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<WasteGoal | null>(null);
  const [wasteType, setWasteType] = useState('Plastic');
  const [unit, setUnit] = useState('Kilograms');
  const [duration, setDuration] = useState('30');
  const [amount, setAmount] = useState('5.0');
  const [addLogModalVisible, setAddLogModalVisible] = useState(false);
  const [currentGoalForLog, setCurrentGoalForLog] = useState<WasteGoal | null>(null);
  const [logEntryAmount, setLogEntryAmount] = useState('');
  const [logEntryUnit, setLogEntryUnit] = useState('Kilograms')

  // Load goals when screen focused or username changes
  useFocusEffect(
    React.useCallback(() => {
      if (username) {
        getGoals();
      } else if (userType === 'guest') {
        setError('Please log in to view and manage waste goals');
      }
    }, [username])
  );
  
  const getGoals = async () => {
    if (!username || loading) return;
    
    setLoading(true);
    setError('');
    
    try {
      const token = await AsyncStorage.getItem('token');
      const url = `${API_BASE}/goals/info?username=${username}&size=50`;
      
      console.log('Fetching goals from URL:', url);
      
      const response = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch waste goals');
      }
      
      const data = await response.json();
      console.log('Goals API response:', JSON.stringify(data));
      
      // If data is already an array, use it directly, otherwise extract goals property
      const goalsData = Array.isArray(data) ? data : data.goals || [];
      console.log('Processed goals data:', JSON.stringify(goalsData));
      
      setGoals(goalsData);
      
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWasteLog = async () => {
    if (!currentGoalForLog || !username || !logEntryAmount) {
      Alert.alert('Error', 'Please ensure amount is filled and a goal is selected.');
      return;
    }

    const goalIdToLog = currentGoalForLog.id || currentGoalForLog.goalId;
    if (!goalIdToLog) {
      Alert.alert('Error', 'Selected goal has no valid ID.');
      return;
    }

    try {
      setLoading(true); 
      const token = await AsyncStorage.getItem('token');
      
      const requestBody = {
        username: username,
        goalId: goalIdToLog,
        amount: parseFloat(logEntryAmount),
        unit: logEntryUnit,
        // date: new Date().toISOString(), // Backend usually handles the date
      };

      // IMPORTANT: Replace '/api/waste-logs/create' with your actual endpoint
      const apiEndpoint = `${API_BASE}/waste-logs/create`; 
      console.log('Sending request to add waste log:', apiEndpoint);
      console.log('Request body for waste log:', JSON.stringify(requestBody));

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Add Waste Log API Error:', response.status, errorText);
        throw new Error(`Failed to add waste log: ${response.status} ${errorText}`);
      }
      
      // const responseData = await response.json(); // If your API returns data
      // console.log('Waste log added successfully:', responseData);
      Alert.alert('Success', 'Waste log added successfully!');

      setAddLogModalVisible(false);
      setCurrentGoalForLog(null); // Clear selected goal
      setLogEntryAmount(''); // Reset form
      // Refresh goals to update progress display
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
    
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      // Create request body exactly matching the format that works in Postman
      const requestBody = {
        username: username,
        unit: unit,
        wasteType: wasteType,
        duration: parseInt(duration),
        amount: parseFloat(amount)
      };
      
      console.log('Sending request to:', `${API_BASE}/goals/create`);
      console.log('Request body:', JSON.stringify(requestBody));
      
      const response = await fetch(`${API_BASE}/goals/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        console.error('Response status:', response.status);
        const errorText = await response.text();
        console.error('Response body:', errorText);
        throw new Error(`Failed to create waste goal: ${response.status} ${errorText}`);
      }
      
      // Refresh goals list
      setModalVisible(false);
      resetForm();
      getGoals(); // Call getGoals after creating a new goal
    } catch (err) {
      console.error('Error creating goal:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create waste goal');
    } finally {
      setLoading(false);
    }
  };

  const editWasteGoal = async () => {
    if (!username || !editingGoal) return;
    
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      // Create request body exactly matching the format that works in Postman
      const requestBody = {
        username: username,
        unit: unit,
        wasteType: wasteType,
        duration: parseInt(duration),
        amount: parseFloat(amount)
      };
      
      const goalId = editingGoal.id || editingGoal.goalId;
      if (!goalId) {
        throw new Error('Goal ID not found');
      }
      
      console.log('Sending request to:', `${API_BASE}/goals/edit/${goalId}`);
      console.log('Request body:', JSON.stringify(requestBody));
      
      const response = await fetch(`${API_BASE}/goals/edit/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        console.error('Response status:', response.status);
        const errorText = await response.text();
        console.error('Response body:', errorText);
        throw new Error(`Failed to edit waste goal: ${response.status} ${errorText}`);
      }
      
      // Refresh goals list
      setModalVisible(false);
      setEditingGoal(null);
      resetForm();
      getGoals(); // Call getGoals after editing
    } catch (err) {
      console.error('Error editing goal:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to edit waste goal');
    } finally {
      setLoading(false);
    }
  };

  const deleteWasteGoal = async (goalId: number) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      console.log(`Deleting goal with ID: ${goalId}`);
      
      const response = await fetch(`${API_BASE}/goals/delete/${goalId}`, {
        method: 'DELETE',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      
      if (!response.ok) {
        console.error('Response status:', response.status);
        const errorText = await response.text();
        console.error('Response body:', errorText);
        throw new Error(`Failed to delete waste goal: ${response.status} ${errorText}`);
      }
      
      // Update local state
      getGoals(); // Refresh the goals list after deletion
    } catch (err) {
      console.error('Error deleting goal:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete waste goal');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (goal: WasteGoal) => {
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
  };

  const openAddLogModal = (goal: WasteGoal) => {
    setCurrentGoalForLog(goal);
    setLogEntryAmount(''); // Reset amount for new log entry
    // Pre-fill unit from goal, but user can change it as per requirement
    setLogEntryUnit(goal.unit || 'Kilograms'); 
    setAddLogModalVisible(true);
  };

  const renderGoalItem = ({ item }: { item: WasteGoal }) => {
    console.log('Rendering goal item:', item);
        const progressPercentage = item.percentOfProgress !== undefined 
      ? Math.max(0, Math.min(100, item.percentOfProgress)) 
      : 0;

    return (
    <View style={styles.goalItem}>
      <View style={styles.goalHeader}>
        <Text style={styles.goalType}>{item.wasteType}</Text>
        <View style={styles.goalActions}>
          <TouchableOpacity 
            style={styles.addLogButton} // New style for this button
            onPress={() => openAddLogModal(item)}
          >
            <Text style={styles.buttonText}>Add Log</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={() => openEditModal(item)}
          >
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={() => {
              const goalId = item.id || item.goalId;
              if (goalId) {
                Alert.alert(
                  'Confirm Delete',
                  'Are you sure you want to delete this waste goal?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', onPress: () => deleteWasteGoal(goalId), style: 'destructive' }
                  ]
                );
              } else {
                Alert.alert('Error', 'Goal ID not found');
              }
            }}
          >
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.goalDetails}>
        Goal: {item.amount} {item.unit} in {item.duration} days
      </Text>
      {item.percentOfProgress !== undefined && (
        <>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
          </View>
          <Text style={styles.goalProgressText}> 
            Progress: {progressPercentage.toFixed(2)}% 
          </Text>
        </>
      )}


    </View>
  )};

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Waste Reduction Goals
      </ThemedText>
      
      {!username && userType === 'guest' ? (
        <Text style={styles.errorText}>
          Please log in to view and manage waste goals
        </Text>
      ) : (
        <>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => {
              resetForm();
              setEditingGoal(null);
              setModalVisible(true);
            }}
          >
            <Text style={styles.buttonText}>Create New Goal</Text>
          </TouchableOpacity>
          
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <FlatList
              data={goals}
              renderItem={renderGoalItem}
              keyExtractor={item => (item.id || item.goalId || '').toString()}
              contentContainerStyle={styles.listContainer}
              onEndReachedThreshold={0.2}
              ListEmptyComponent={
                !loading ? (
                  <Text style={styles.emptyText}>
                    No waste goals found. Create your first goal!
                  </Text>
                ) : null
              }
              ListFooterComponent={
                loading ? (
                  <ActivityIndicator size="large" color="#0000ff" style={styles.loadingSpinner} />
                ) : null
              }
            />
          )}
          
          {/* Goal Create/Edit Modal */}
          <Modal
            visible={modalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {editingGoal ? 'Edit Waste Goal' : 'Create New Waste Goal'}
                </Text>
                
                <Text style={styles.inputLabel}>Waste Type</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={wasteType}
                    onValueChange={(value) => setWasteType(value)}
                    style={styles.picker}
                  >
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
                  <Picker
                    selectedValue={unit}
                    onValueChange={(value) => setUnit(value)}
                    style={styles.picker}
                  >
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
                  placeholder="Amount"
                />
                
                <Text style={styles.inputLabel}>Duration (days)</Text>
                <TextInput
                  style={styles.input}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                  placeholder="Duration in days"
                />
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={editingGoal ? editWasteGoal : createGoal}
                    disabled={loading}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'Saving...' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
          <Modal
            visible={addLogModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setAddLogModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Add Waste Log</Text>
                {currentGoalForLog && (
                  <Text style={styles.modalSubtitle}>
                    For Goal: {currentGoalForLog.wasteType} ({currentGoalForLog.amount} {currentGoalForLog.unit})
                  </Text>
                )}
                
                <Text style={styles.inputLabel}>Amount</Text>
                <TextInput
                  style={styles.input}
                  value={logEntryAmount}
                  onChangeText={setLogEntryAmount}
                  keyboardType="numeric"
                  placeholder="e.g., 0.5"
                />
                
                <Text style={styles.inputLabel}>Unit for this Log</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={logEntryUnit}
                    onValueChange={(value) => setLogEntryUnit(value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Kilograms" value="Kilograms" />
                    <Picker.Item label="Pounds" value="Pounds" />
                    <Picker.Item label="Items" value="Items" />
                    {/* Add other units relevant to your logs */}
                  </Picker>
                </View>
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setAddLogModalVisible(false)}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.saveButton} // Can reuse saveButton style or create specific
                    onPress={handleAddWasteLog}
                    disabled={loading}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'Saving...' : 'Confirm Log'}
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
    marginBottom: 16,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  goalItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  goalDetails: {
    fontSize: 16,
    color: '#666',
  },
  goalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#F44336',
    textAlign: 'center',
    marginTop: 20,
    padding: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 30,
  },
  loadingSpinner: {
    marginVertical: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginBottom: 16,
  },
  picker: {
    height: 50,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: '#9e9e9e',
    padding: 12,
    borderRadius: 6,
    width: '48%',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 6,
    width: '48%',
    alignItems: 'center',
  },
  addLogButton: {
    backgroundColor: '#388E3C', // Darker Green
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginTop: 8,
    overflow: 'hidden', // Ensures the fill stays within bounds
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50', // Green for progress
    borderRadius: 5,
  },
  goalProgressText: { // Renamed from goalProgress for clarity
    fontSize: 14,
    color: '#333', // Darker color for better readability
    marginTop: 4,
    textAlign: 'right', // Align progress text to the right
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    marginBottom: 16,
  },
  goalProgress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
}); 