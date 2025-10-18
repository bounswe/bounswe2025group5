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
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../_layout';
import { apiRequest } from '../services/apiClient';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';


type WasteGoal = {
  goalId: number;
  wasteType: string;
  amount: number;
  duration: number;
  unit: string;
  restrictionAmountGrams: number;
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

const convertInputToGrams = (value: number, unit: string) => {
  if (!Number.isFinite(value)) return 0;
  switch (unit) {
    case 'Kilograms':
      return value * 1000;
    case 'Grams':
      return value;
    default:
      return value;
  }
};

const convertGramsToDisplay = (grams: number) => {
  const safeGrams = Number.isFinite(grams) ? grams : 0;
  if (safeGrams >= 1000) {
    return {
      amount: parseFloat((safeGrams / 1000).toFixed(2)),
      unit: 'Kilograms',
    };
  }
  return {
    amount: parseFloat(safeGrams.toFixed(2)),
    unit: 'Grams',
  };
};

export default function WasteGoalScreen() {
  const navigation = useNavigation<Navigation>();

  const { t, i18n } = useTranslation();
  const isTurkish = (i18n.resolvedLanguage || i18n.language || '').toLowerCase().startsWith('tr');
  const toggleLanguage = (value: boolean) => i18n.changeLanguage(value ? 'tr-TR' : 'en-US');

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
  const [error, setError] = useState<{ key: string | null; message: string | null }>({ key: null, message: null });

  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<WasteGoal | null>(null);
  const [wasteType, setWasteType] = useState('Plastic');
  const [unit, setUnit] = useState('Kilograms');
  const [duration, setDuration] = useState('30');
  const [amount, setAmount] = useState('5.0');
  const [goalFormError, setGoalFormError] = useState<string | null>(null);
  const [logFormError, setLogFormError] = useState<string | null>(null);

  const [addLogModalVisible, setAddLogModalVisible] = useState(false);
  const [currentGoalForLog, setCurrentGoalForLog] = useState<WasteGoal | null>(null);
  const [logEntryAmount, setLogEntryAmount] = useState('');

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<WasteGoal | null>(null);


  useFocusEffect(
    React.useCallback(() => {
      if (username) {
        getGoals();
      } else {
        setGoals([]);
      }
    }, [username])
  );

  const getGoals = async () => {

    if (!username) return;
    setLoading(true);
    setError({ key: null, message: null });
    try {
      const encodedUsername = encodeURIComponent(username);
      const response = await apiRequest(`/api/users/${encodedUsername}/waste-goals?size=50`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch waste goals: ${response.status} ${errorText}`);
      }

      const raw = await response.json();
      const goalsData: any[] = Array.isArray(raw) ? raw : raw?.goals ?? [];

      const mapped: WasteGoal[] = goalsData.map((goal: any) => {
        const grams = goal.restrictionAmountGrams ?? 0;
        const { amount, unit } = convertGramsToDisplay(grams);
        return {
          goalId: goal.goalId,
          wasteType: goal.wasteType,
          amount,
          unit,
          duration: goal.duration,
          restrictionAmountGrams: grams,
          progress: goal.progress ?? goal.percentOfProgress ?? 0,
          createdAt: goal.createdAt,
          creatorUsername: goal.creatorUsername,
        };
      });

      setGoals(mapped);
    } catch (err) {
        console.error('Error fetching goals:', err);
        if (err instanceof Error && err.message.startsWith('Server error:')) {
          setError({ key: 'errorGoalFetchFailed', message: err.message });
        } else if (err instanceof Error) {
          setError({ key: null, message: err.message });
        } else {
          setError({ key: 'errorGoalFetchGeneric', message: null });
        }
      } finally {
        setLoading(false);
      }

  };

  const validateGoalInput = (): boolean => {
    setGoalFormError(null);
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setGoalFormError('errorAmountPositive');
      return false;
    }
    const parsedDuration = parseInt(duration, 10);
    if (isNaN(parsedDuration) || parsedDuration < 1) {
      setGoalFormError('errorDurationMin');
      return false;
    }
    return true;
  };

  const validateLogInput = (): boolean => {
    setLogFormError(null);
    const parsedLogAmount = parseFloat(logEntryAmount);
    if (isNaN(parsedLogAmount) || parsedLogAmount <= 0) {
      setLogFormError('errorLogAmountPositive');
      return false;
    }
    return true;
  };


  const handleAddWasteLog = async () => {
    if (!currentGoalForLog || !username) {
      Alert.alert(t('error'), t('errorGoalInfoMissing'));
      return;
    }
    if (!validateLogInput()) return;

    const goalIdToLog = currentGoalForLog.goalId;
    if (!goalIdToLog) {
      Alert.alert(t('error'), t('errorInvalidGoalId'));
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
      const response = await apiRequest('/api/logs/create', {
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
      Alert.alert(t('success'), t('successLogAdded'));
      setAddLogModalVisible(false);
      setCurrentGoalForLog(null);
      setLogEntryAmount('');
      setLogFormError(null);
      getGoals();
    } catch (err) {
      console.error('Error adding waste log:', err);
      Alert.alert(t('error'), err instanceof Error ? err.message : t('errorLogAddFailed'));
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async () => {
    if (!username) return;
    if (!validateGoalInput()) return;
    setLoading(true);
    try {
      const encodedUsername = encodeURIComponent(username);
      const parsedAmount = parseFloat(amount);
      const parsedDuration = parseInt(duration, 10);
      const restrictionAmountGrams = convertInputToGrams(parsedAmount, unit);

      const response = await apiRequest(`/api/users/${encodedUsername}/waste-goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: wasteType,
          duration: parsedDuration,
          restrictionAmountGrams,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create waste goal: ${response.status} ${errorText}`);
      }
      Alert.alert(t('success'), t('successGoalCreated'));
      setModalVisible(false);
      resetForm();
      getGoals();
    } catch (err) {
      console.error('Error creating goal:', err);
      setGoalFormError('errorGoalCreateFailed');
    } finally {
      setLoading(false);
    }
  };

  const editWasteGoal = async () => {
    if (!username || !editingGoal || !editingGoal.goalId) {
        Alert.alert(t('error'), t('errorGoalInfoIncomplete'));
        return;
    }
    if (!validateGoalInput()) return;
    setLoading(true);
    try {
      const parsedAmount = parseFloat(amount);
      const parsedDuration = parseInt(duration, 10);
      const restrictionAmountGrams = convertInputToGrams(parsedAmount, unit);

      const response = await apiRequest(`/api/waste-goals/${editingGoal.goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: wasteType,
          duration: parsedDuration,
          restrictionAmountGrams,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to edit waste goal: ${response.status} ${errorText}`);
      }
      Alert.alert(t('success'), t('successGoalUpdated'));
      setModalVisible(false);
      resetForm();
      getGoals();
    } catch (err) {
      console.error('Error editing goal:', err);
      setGoalFormError('errorGoalEditFailed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!goalToDelete || !goalToDelete.goalId) {
      Alert.alert(t('error'), t('errorNoGoalToDelete'));
      setIsDeleteModalVisible(false);
      setGoalToDelete(null);
      return;
    }
    setLoading(true);
    setIsDeleteModalVisible(false);
    try {
      const response = await apiRequest(`/api/waste-goals/${goalToDelete.goalId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete waste goal: ${response.status} ${errorText}`);
      }
      Alert.alert(t('success'), t('successGoalDeleted'));
      getGoals();
    } catch (err) {
      console.error('Error deleting goal:', err);
      Alert.alert(t('error'), err instanceof Error ? err.message : t('errorGoalDeleteFailed'));
    } finally {
      setGoalToDelete(null);
      setLoading(false);
    }
  };


  const openEditModal = (goal: WasteGoal) => {
    setGoalFormError(null);
    setEditingGoal(goal);
    setWasteType(goal.wasteType);
    setUnit(goal.unit || 'Grams');
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
    setGoalFormError(null);
  };

  const openAddLogModal = (goal: WasteGoal) => {
    setCurrentGoalForLog(goal);
    setLogEntryAmount('');
    setLogFormError(null);
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
            <TouchableOpacity style={styles.addLogButton} onPress={() => openAddLogModal(item)}>
              <Text style={styles.buttonText}>{t('addWasteLog')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
            <Text style={styles.buttonText}>{t('edit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={() => openDeleteConfirmationModal(item)}>
            <Text style={styles.buttonText}>{t('delete')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ThemedText style={styles.goalDetails}>
        {t('targetDetails', { amount: item.amount, unit: item.unit, duration: item.duration })}
      </ThemedText>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progressBarWidthPercentage}%`, backgroundColor: progressBarColor }]} />
      </View>
      <View style={styles.progressTextsContainer}>
        <ThemedText style={[styles.goalProgressText, styles.remainingQuotaText, { color: progressBarColor }]}>
          {t('remainingQuota')} {remainingQuota.toFixed(1)} {item.unit}
        </ThemedText>
        <ThemedText style={[styles.goalProgressText, { color: progressBarColor, textAlign: 'right' }]}>
          {t('wasteLoad', { progress: progressPercentage.toFixed(1) })}
        </ThemedText>
      </View>
    </View>
  )};

  return (
    <ThemedView style={[styles.container, { backgroundColor: screenBackgroundColor }]}>
      <View style={styles.headerContainer}>

        <View style={styles.titleContainer}>
          <ThemedText type="title">
            {t('wasteGoalsTitle')}
          </ThemedText>
        </View>

        <View style={styles.languageToggleContainer}>
          <Text style={styles.languageLabel}>EN</Text>
          <Switch
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isDarkMode ? (isTurkish ? '#f5dd4b' : '#f4f4f4') : (isTurkish ? '#f5dd4b' : '#f4f4f4')}
              ios_backgroundColor="#3e3e3e"
              onValueChange={value => { toggleLanguage(value); }}
              value={isTurkish}
          />
          <Text style={styles.languageLabel}>TR</Text>
        </View>
      </View>

      {!username && userType === 'guest' ? (
        <ThemedText style={[styles.errorText, { color: errorTextColor, backgroundColor: errorBackgroundColor }]}>
          {t('logInToManageGoals')}
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
            <Text style={styles.buttonText}>{t('createNewGoal')}</Text>
          </TouchableOpacity>

          {(error.key || error.message) && !loading && (
            <ThemedText style={[styles.errorText, { color: errorTextColor, backgroundColor: errorBackgroundColor }]}>
              {error.key ? t(error.key) : error.message}
            </ThemedText>
          )}

          <FlatList
            data={goals}
            renderItem={renderGoalItem}
            keyExtractor={item => item.goalId.toString()}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={ !loading && !error ? (<ThemedText style={[styles.emptyText, {color: emptyTextColor}]}>{t('noGoalsFound')}</ThemedText>) : null }
            ListFooterComponent={ loading ? (<ActivityIndicator size="large" color={isDarkMode ? "#66BB6A" : "#4CAF50"} style={styles.loadingSpinner} />) : null }
          />

          <Modal visible={modalVisible} transparent={true} animationType="slide" onRequestClose={() => { setModalVisible(false); resetForm(); }}>
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { backgroundColor: modalContentBgColor }]}>
                <ThemedText style={styles.modalTitle}>{editingGoal ? t('editWasteGoal') : t('createNewGoal')}</ThemedText>
                <ThemedText style={styles.inputLabel}>{t('wasteType')}</ThemedText>
                <View style={[styles.pickerContainer, { borderColor: inputBorderColor, backgroundColor: pickerBackgroundColor }]}>
                  <Picker selectedValue={wasteType} onValueChange={setWasteType} style={[styles.picker, {color: pickerItemColor}]} itemStyle={{ color: pickerItemColor, backgroundColor: pickerBackgroundColor }}>
                    <Picker.Item label={t('plastic')} value="Plastic" />
                    <Picker.Item label={t('paper')} value="Paper" />
                    <Picker.Item label={t('glass')} value="Glass" />
                    <Picker.Item label={t('metal')} value="Metal" />
                    <Picker.Item label={t('organic')} value="Organic" />
                  </Picker>
                </View>
                <ThemedText style={styles.inputLabel}>{t('unit')}</ThemedText>
                <View style={[styles.pickerContainer, { borderColor: inputBorderColor, backgroundColor: pickerBackgroundColor }]}>
                  <Picker selectedValue={unit} onValueChange={setUnit} style={[styles.picker, {color: pickerItemColor}]} itemStyle={{ color: pickerItemColor, backgroundColor: pickerBackgroundColor }}>
                    <Picker.Item label={t('kilograms')} value="Kilograms" />
                    <Picker.Item label={t('grams')} value="Grams" />
                    <Picker.Item label={t('liters')} value="Liters" />
                    <Picker.Item label={t('units')} value="Units" />
                    <Picker.Item label={t('bottles')} value="Bottles" />
                  </Picker>
                </View>
                <ThemedText style={styles.inputLabel}>{t('amount')}</ThemedText>
                <TextInput style={[styles.input, { borderColor: inputBorderColor, color: inputTextColor, backgroundColor: pickerBackgroundColor }]} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder={t('amountPlaceholder')} placeholderTextColor={placeholderTextColor} />
                <ThemedText style={styles.inputLabel}>{t('durationDays')}</ThemedText>
                <TextInput style={[styles.input, { borderColor: inputBorderColor, color: inputTextColor, backgroundColor: pickerBackgroundColor }]} value={duration} onChangeText={setDuration} keyboardType="numeric" placeholder={t('durationPlaceholder')} placeholderTextColor={placeholderTextColor} />
                {goalFormError && (<ThemedText style={[styles.modalFormErrorText, { color: errorTextColor }]}>{t(goalFormError)}</ThemedText>)}
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => { setModalVisible(false); resetForm(); }}>
                    <Text style={styles.buttonText}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={editingGoal ? editWasteGoal : createGoal} disabled={loading}>
                    <Text style={styles.buttonText}>{loading ? t('saving') : (editingGoal ? t('update') : t('save'))}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal visible={addLogModalVisible} transparent={true} animationType="slide" onRequestClose={() => { setAddLogModalVisible(false); setCurrentGoalForLog(null); setLogEntryAmount(''); setLogFormError(null); }}>
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { backgroundColor: modalContentBgColor }]}>
                <ThemedText style={styles.modalTitle}>{t('addWasteLog')}</ThemedText>
                {currentGoalForLog && (<ThemedText style={styles.modalSubtitle}>{t('forGoal', { wasteType: currentGoalForLog.wasteType, amount: currentGoalForLog.amount, unit: currentGoalForLog.unit })}</ThemedText>)}
                <ThemedText style={styles.inputLabel}>{t('logAmountUnit', { unit: currentGoalForLog?.unit || '' })}</ThemedText>
                <TextInput style={[styles.input, { borderColor: inputBorderColor, color: inputTextColor, backgroundColor: pickerBackgroundColor }]} value={logEntryAmount} onChangeText={setLogEntryAmount} keyboardType="numeric" placeholder={t('logAmountPlaceholder', { unit: currentGoalForLog?.unit || 'units' })} placeholderTextColor={placeholderTextColor} />
                {logFormError && (<ThemedText style={[styles.modalFormErrorText, { color: errorTextColor }]}>{t(logFormError)}</ThemedText>)}
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => { setAddLogModalVisible(false); setCurrentGoalForLog(null); setLogEntryAmount(''); setLogFormError(null); }}>
                    <Text style={styles.buttonText}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleAddWasteLog} disabled={loading}>
                    <Text style={styles.buttonText}>{loading ? t('saving') : t('confirmLog')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal visible={isDeleteModalVisible} transparent={true} animationType="slide" onRequestClose={() => { setIsDeleteModalVisible(false); setGoalToDelete(null); }}>
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { backgroundColor: modalContentBgColor }]}>
                <ThemedText style={styles.modalTitle}>{t('confirmDeletion')}</ThemedText>
                {goalToDelete && (<ThemedText style={styles.deleteConfirmText}>{t('deleteConfirmation', { wasteType: goalToDelete.wasteType, amount: goalToDelete.amount, unit: goalToDelete.unit })}</ThemedText>)}
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => { setIsDeleteModalVisible(false); setGoalToDelete(null); }}>
                    <Text style={styles.buttonText}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.saveButton, styles.confirmDeleteButton]} onPress={handleDeleteConfirm} disabled={loading}>
                    <Text style={styles.buttonText}>{loading ? t('deleting') : t('delete')}</Text>
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
  headerContainer: {
    paddingHorizontal: 16,
    marginTop: 48,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  languageToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  languageLabel: {
    color: '#fff',
    fontWeight: 'bold',
    marginHorizontal: 6,
    fontSize: 12,
  },
});