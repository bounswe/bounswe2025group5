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
  goalId: number; // From API, primary identifier
  wasteType: string;
  amount: number;
  duration: number;
  unit: string;
  progress?: number; // From API (e.g., 0.0 for 0%, 0.5 for 50%)
  createdAt: string; // From API
  creatorUsername?: string; // From API
  id?: number; // Fallback or local id if needed
  username?: string; // Typically the logged-in user setting the goal
  completed?: number; // If used by other logic
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
  // const [lastGoalId, setLastGoalId] = useState<number | null>(null); // Not currently used
  // const [hasMore, setHasMore] = useState(true); // Not currently used for pagination

  // New goal form
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<WasteGoal | null>(null);
  const [wasteType, setWasteType] = useState('Plastic');
  const [unit, setUnit] = useState('Kilograms');
  const [duration, setDuration] = useState('30');
  const [amount, setAmount] = useState('5.0');

  // Add Waste Log Modal
  const [addLogModalVisible, setAddLogModalVisible] = useState(false);
  const [currentGoalForLog, setCurrentGoalForLog] = useState<WasteGoal | null>(null);
  const [logEntryAmount, setLogEntryAmount] = useState('');
  // logEntryUnit state is removed as it's derived from currentGoalForLog.unit

  useFocusEffect(
    React.useCallback(() => {
      if (username) {
        getGoals();
      } else if (userType === 'guest') {
        setError('Please log in to view and manage waste goals');
        setGoals([]); // Clear goals if guest
      }
    }, [username, userType]) // Added userType as dependency
  );
  
  const getGoals = async () => {
    if (!username || loading) return;
    
    setLoading(true);
    setError('');
    
    try {
      const token = await AsyncStorage.getItem('token');
      const url = `${API_BASE}/goals/info?username=${username}&size=50`; // Assuming size 50 is enough for now
      
      console.log('Fetching goals from URL:', url);
      
      const response = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch waste goals:', response.status, errorText);
        throw new Error(`Failed to fetch waste goals: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Goals API response:', JSON.stringify(data));
      
      const goalsData: WasteGoal[] = Array.isArray(data) ? data : data.goals || [];
      console.log('Processed goals data:', JSON.stringify(goalsData));
      
      setGoals(goalsData);
      
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching goals');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWasteLog = async () => {
    if (!currentGoalForLog || !username || !logEntryAmount) {
      Alert.alert('Error', 'Please ensure an amount is entered and a goal is selected.');
      return;
    }

    const goalIdToLog = currentGoalForLog.goalId; // Use goalId from currentGoalForLog
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
        unit: currentGoalForLog.unit, // Use unit from the selected goal
      };

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
      
      Alert.alert('Success', 'Waste log added successfully!');
      setAddLogModalVisible(false);
      setCurrentGoalForLog(null);
      setLogEntryAmount('');
      getGoals(); // Refresh goals to update progress
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
      
      const requestBody = {
        username: username,
        unit: unit,
        wasteType: wasteType,
        duration: parseInt(duration),
        amount: parseFloat(amount)
      };
      
      const response = await fetch(`${API_BASE}/goals/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create waste goal: ${response.status} ${errorText}`);
      }
      
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
    
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      const requestBody = {
        username: username, // Or editingGoal.creatorUsername if that's intended
        unit: unit,
        wasteType: wasteType,
        duration: parseInt(duration),
        amount: parseFloat(amount)
      };
      
      const goalIdToEdit = editingGoal.goalId;
      
      const response = await fetch(`${API_BASE}/goals/edit/${goalIdToEdit}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to edit waste goal: ${response.status} ${errorText}`);
      }
      
      setModalVisible(false);
      setEditingGoal(null);
      resetForm();
      getGoals();
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
      
      const response = await fetch(`${API_BASE}/goals/delete/${goalId}`, {
        method: 'DELETE',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete waste goal: ${response.status} ${errorText}`);
      }
      
      getGoals();
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
    setEditingGoal(null);
  };

  const openAddLogModal = (goal: WasteGoal) => {
    setCurrentGoalForLog(goal);
    setLogEntryAmount('');
    setAddLogModalVisible(true);
  };

  const renderGoalItem = ({ item }: { item: WasteGoal }) => {
    // Assuming item.progress is a fraction from 0.0 to 1.0
    // If item.progress is already a percentage (0-100), remove `* 100`
    const progressFraction = item.progress !== undefined ? item.progress : 0;
    const progressPercentage = Math.max(0, Math.min(100, progressFraction * 100));

    return (
    <View style={styles.goalItem}>
      <View style={styles.goalHeader}>
        <Text style={styles.goalType}>{item.wasteType}</Text>
        <View style={styles.goalActions}>
          <TouchableOpacity 
            style={styles.addLogButton}
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
              if (item.goalId) {
                Alert.alert(
                  'Confirm Delete',
                  'Are you sure you want to delete this waste goal?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', onPress: () => deleteWasteGoal(item.goalId), style: 'destructive' }
                  ]
                );
              } else {
                Alert.alert('Error', 'Goal ID not found for deletion.');
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
      
      {/* Always display progress bar and text */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
      </View>
      <Text style={styles.goalProgressText}> 
        Progress: {progressPercentage.toFixed(2)}% 
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
              resetForm(); // Ensures editingGoal is null
              setModalVisible(true);
            }}
          >
            <Text style={styles.buttonText}>Create New Goal</Text>
          </TouchableOpacity>
          
          {error && !loading ? ( // Show error only if not loading to avoid overlap
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <FlatList
            data={goals}
            renderItem={renderGoalItem}
            keyExtractor={item => item.goalId.toString()} // Use goalId as key
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              !loading && !error ? ( // Show empty only if not loading and no error
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
                resetForm(); // Also reset form on modal close by backdrop/swipe
            }}
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
                    <Text style={styles.buttonText}>
                      {loading ? 'Saving...' : (editingGoal ? 'Update' : 'Save')}
                    </Text>
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
            onRequestClose={() => {
                setAddLogModalVisible(false);
                setCurrentGoalForLog(null);
                setLogEntryAmount('');
            }}
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
                <TextInput
                  style={styles.input}
                  value={logEntryAmount}
                  onChangeText={setLogEntryAmount}
                  keyboardType="numeric"
                  placeholder={`e.g., 0.5 ${currentGoalForLog?.unit || 'units'}`}
                />
                
                {/* Unit Picker for log entry is removed */}
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                        setAddLogModalVisible(false);
                        setCurrentGoalForLog(null);
                        setLogEntryAmount('');
                    }}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleAddWasteLog}
                    disabled={loading || !logEntryAmount} // Disable if loading or no amount
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
    backgroundColor: '#f5f5f5', // Lighter background for the whole screen
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20, // Increased margin
    textAlign: 'center',
    color: '#333', // Darker title color
  },
  listContainer: {
    paddingBottom: 20,
  },
  goalItem: {
    backgroundColor: '#ffffff', // White background for items
    borderRadius: 10, // Slightly more rounded corners
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5, // Increased shadow radius
    elevation: 3, // Increased elevation for Android
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10, // Increased margin
  },
  goalType: {
    fontSize: 18,
    fontWeight: '600', // Slightly bolder
    color: '#2E7D32', // Theme green color for type
  },
  goalDetails: {
    fontSize: 15, // Slightly smaller
    color: '#555', // Darker grey
    marginBottom: 8, // Added margin
  },
  goalActions: {
    flexDirection: 'row',
    gap: 10, // Increased gap
  },
  createButton: {
    backgroundColor: '#4CAF50', // Standard green
    paddingVertical: 14, // Increased padding
    paddingHorizontal: 12,
    borderRadius: 8, // More rounded
    marginBottom: 20, // Increased margin
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  editButton: {
    backgroundColor: '#1976D2', // Darker blue
    paddingHorizontal: 12,
    paddingVertical: 8, // Balanced padding
    borderRadius: 6,
  },
  deleteButton: {
    backgroundColor: '#D32F2F', // Darker red
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addLogButton: {
    backgroundColor: '#388E3C', // Darker Green from spec
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14, // Standardized button text size
  },
  errorText: {
    color: '#D32F2F', // Darker red for errors
    textAlign: 'center',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FFCDD2', // Light red background for error
    borderRadius: 6,
  },
  emptyText: {
    textAlign: 'center',
    color: '#757575', // Medium grey
    marginTop: 40, // Increased margin
    fontSize: 16,
  },
  loadingSpinner: {
    marginVertical: 30, // Increased margin
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Darker backdrop
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12, // More rounded
    padding: 25, // Increased padding
    width: '90%',
    maxWidth: 400, // Max width for larger screens
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22, // Larger title
    fontWeight: 'bold',
    marginBottom: 20, // Increased margin
    textAlign: 'center',
    color: '#333',
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 6, // Increased margin
    color: '#444', // Slightly lighter than black
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc', // Lighter border
    borderRadius: 6,
    padding: 12, // Increased padding
    marginBottom: 18, // Increased margin
    fontSize: 16,
    backgroundColor: '#f9f9f9', // Very light grey background for input
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 18,
    backgroundColor: '#f9f9f9',
  },
  picker: {
    height: 50, // Standard height
    // color: '#333', // Ensure text color is visible on Android
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Or 'flex-end' with gap
    marginTop: 20, // Increased margin
  },
  cancelButton: {
    backgroundColor: '#757575', // Medium grey
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50', // Standard green
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  progressBarContainer: {
    height: 12, // Slightly thicker
    backgroundColor: '#e0e0e0',
    borderRadius: 6, // Rounded to match height
    marginTop: 10, // Increased margin
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#66BB6A', // Lighter, pleasant green
    borderRadius: 6,
  },
  goalProgressText: {
    fontSize: 14,
    color: '#4CAF50', // Green to match progress
    fontWeight: '500',
    marginTop: 6, // Increased margin
    textAlign: 'right',
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666', // Medium grey
    marginBottom: 18, // Increased margin
    fontStyle: 'italic',
  },
  // goalProgress style is no longer used, goalProgressText is used instead
});