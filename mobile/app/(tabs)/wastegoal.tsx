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
import AccessibleText from '@/components/AccessibleText';
import { ThemedView } from '@/components/ThemedView';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../_layout';
import { apiRequest } from '../services/apiClient';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';


type WasteGoal = {
  goalId: number;
  wasteType: string;
  displayWasteType: string;
  amount: number;
  duration: number;
  unit: GoalUnit;
  restrictionAmountGrams: number;
  progress?: number;
  createdAt: string;
  creatorUsername?: string;
  id?: number;
  username?: string;
  completed?: number;
};

type GoalUnit = 'Kilograms' | 'Grams';

type WasteItemOption = {
  id: number;
  displayName: string;
  weightInGrams: number;
  type?: {
    id?: number;
    name?: string;
  };
};

type Navigation = {
  navigate: (screen: string, params?: any) => void;
};

const WASTE_TYPE_OPTIONS = [
  { value: 'PLASTIC', translationKey: 'plastic' },
  { value: 'PAPER', translationKey: 'paper' },
  { value: 'GLASS', translationKey: 'glass' },
  { value: 'METAL', translationKey: 'metal' },
  { value: 'ORGANIC', translationKey: 'organic' },
] as const;

const DEFAULT_WASTE_TYPE_VALUE = WASTE_TYPE_OPTIONS[0].value;
const GOAL_UNITS: GoalUnit[] = ['Kilograms', 'Grams'];
const coerceGoalUnit = (value: string | null | undefined): GoalUnit =>
  value === 'Grams' ? 'Grams' : 'Kilograms';

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

const convertGramsToDisplay = (grams: number): { amount: number; unit: GoalUnit } => {
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

const normalizeWasteTypeValue = (value: string | null | undefined): string => {
  if (!value) return DEFAULT_WASTE_TYPE_VALUE;
  const normalized = value.trim().toUpperCase();
  const match = WASTE_TYPE_OPTIONS.find((option) => option.value === normalized);
  return match ? match.value : normalized;
};

const formatWasteType = (value: string | undefined | null) => {
  if (!value) {
    return '';
  }
  return value
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : ''))
    .join(' ')
    .trim();
};

const isCustomWasteItem = (item: WasteItemOption) => {
  const normalizedName = (item.displayName || '').trim().toLowerCase();
  const normalizedTypeName = (item.type?.name || '').trim().toLowerCase();
  return normalizedName.includes('custom') || normalizedTypeName.includes('custom');
};

const getDefaultWasteItemId = (items: WasteItemOption[]): string | null => {
  const firstStandardItem = items.find((item) => !isCustomWasteItem(item));
  if (firstStandardItem) return String(firstStandardItem.id);
  return items[0] ? String(items[0].id) : null;
};

export default function WasteGoalScreen() {
  const navigation = useNavigation<Navigation>();

  const { t, i18n } = useTranslation();
  const isTurkish = (i18n.resolvedLanguage || i18n.language || '').toLowerCase().startsWith('tr');

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
  const goalTypeLabelColor = isDarkMode ? '#C8C8C8' : '#6B6B6B';

  const getWasteTypeLabel = React.useCallback(
    (value: string | null | undefined) => {
      if (!value) return t(WASTE_TYPE_OPTIONS[0].translationKey);
      const normalized = normalizeWasteTypeValue(value);
      const option = WASTE_TYPE_OPTIONS.find((opt) => opt.value === normalized);
      if (option) return t(option.translationKey);
      return formatWasteType(value);
    },
    [t]
  );

  const [goals, setGoals] = useState<WasteGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ key: string | null; message: string | null }>({ key: null, message: null });

  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<WasteGoal | null>(null);
  const [wasteType, setWasteType] = useState<string>(DEFAULT_WASTE_TYPE_VALUE);
  const [unit, setUnit] = useState<GoalUnit>('Kilograms');
  const [duration, setDuration] = useState('30');
  const [amount, setAmount] = useState('5.0');
  const [goalFormError, setGoalFormError] = useState<string | null>(null);
  const [logFormError, setLogFormError] = useState<string | null>(null);

  const [addLogModalVisible, setAddLogModalVisible] = useState(false);
  const [currentGoalForLog, setCurrentGoalForLog] = useState<WasteGoal | null>(null);
  const [logEntryQuantity, setLogEntryQuantity] = useState('');
  const [customLogAmount, setCustomLogAmount] = useState('');
  const [selectedWasteItemId, setSelectedWasteItemId] = useState<string | null>(null);
  const [wasteItemsByGoal, setWasteItemsByGoal] = useState<Record<number, WasteItemOption[]>>({});
  const [fetchingWasteItems, setFetchingWasteItems] = useState(false);

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<WasteGoal | null>(null);

  const unitLabel = (u: GoalUnit) => (u === 'Kilograms' ? t('Kilograms') : t('Grams'));

  useFocusEffect(
    React.useCallback(() => {
      if (username) {
        getGoals();
      } else {
        setGoals([]);
      }
    }, [username])
  );

  const getCustomWasteItemForGoal = (goalId?: number | null) => {
    if (!goalId) return null;
    const itemsForGoal = wasteItemsByGoal[goalId] ?? [];
    return itemsForGoal.find((item) => isCustomWasteItem(item)) ?? null;
  };

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
        const { amount, unit: displayUnit } = convertGramsToDisplay(grams);
        const unit = coerceGoalUnit(displayUnit);
        const normalizedType = normalizeWasteTypeValue(goal.wasteType);
        const displayWasteType = getWasteTypeLabel(goal.wasteType);
        return {
          goalId: goal.goalId,
          wasteType: normalizedType,
          displayWasteType,
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

  const validateLogInput = (
    selectedItem: WasteItemOption | null,
    trimmedQuantity: string,
    trimmedCustomAmount: string
  ): boolean => {
    setLogFormError(null);
    const hasCustomAmount = Boolean(trimmedCustomAmount);

    if (!selectedItem) {
      setLogFormError('errorSelectWasteItem');
      return false;
    }

    if (!trimmedQuantity && !trimmedCustomAmount) {
      setLogFormError('errorLogQuantityPositive');
      return false;
    }

    if (trimmedQuantity) {
      const parsedLogQuantity = parseInt(trimmedQuantity, 10);
      if (!Number.isInteger(parsedLogQuantity) || parsedLogQuantity <= 0) {
        setLogFormError('errorLogQuantityPositive');
        return false;
      }
    }

    if (hasCustomAmount) {
      const parsedCustomAmount = parseFloat(trimmedCustomAmount);
      if (!Number.isFinite(parsedCustomAmount) || parsedCustomAmount <= 0) {
        setLogFormError('errorLogQuantityPositive');
        return false;
      }
      const itemWeightInGrams = Number(selectedItem.weightInGrams);
      if (!Number.isFinite(itemWeightInGrams) || itemWeightInGrams <= 0) {
        setLogFormError('errorCustomAmountConversion');
        return false;
      }
    }

    return true;
  };

  const wasteItemsForCurrentGoal = currentGoalForLog?.goalId
    ? wasteItemsByGoal[currentGoalForLog.goalId] ?? []
    : [];

  const visibleWasteItemsForCurrentGoal = wasteItemsForCurrentGoal.filter(
    (item) => !isCustomWasteItem(item)
  );

  const customWasteItemForCurrentGoal = getCustomWasteItemForGoal(
    currentGoalForLog?.goalId ?? null
  );

  const pickerSelectedValue = visibleWasteItemsForCurrentGoal.find(
    (item) => String(item.id) === String(selectedWasteItemId)
  )
    ? selectedWasteItemId ?? ''
    : visibleWasteItemsForCurrentGoal[0]
    ? String(visibleWasteItemsForCurrentGoal[0].id)
    : '';

  const fetchWasteItemsForGoal = async (goalId: number) => {
    setFetchingWasteItems(true);
    try {
      const response = await apiRequest(`/api/users/waste-goals/${goalId}/items`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch waste items: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      const parsedItems: WasteItemOption[] = Array.isArray(data)
        ? data
            .map((item: any) => ({
              id: typeof item?.id === 'number' ? item.id : typeof item?.itemId === 'number' ? item.itemId : null,
              displayName: item?.displayName ?? item?.name ?? '',
              weightInGrams: typeof item?.weightInGrams === 'number' ? item.weightInGrams : Number(item?.weightInGrams) || 0,
              type: item?.type,
            }))
            .filter((item) => item.id !== null)
            .map((item) => item as WasteItemOption)
        : [];

      setWasteItemsByGoal((prev) => ({ ...prev, [goalId]: parsedItems }));
      setSelectedWasteItemId(getDefaultWasteItemId(parsedItems));
      setLogFormError(null);
    } catch (err) {
      console.error('Error fetching waste items for goal:', err);
      setWasteItemsByGoal((prev) => ({ ...prev, [goalId]: [] }));
      setLogFormError('errorWasteItemsFetch');
    } finally {
      setFetchingWasteItems(false);
    }
  };


  const handleAddWasteLog = async () => {
    if (!currentGoalForLog || !username) {
      Alert.alert(t('error'), t('errorGoalInfoMissing'));
      return;
    }

    const goalIdToLog = currentGoalForLog.goalId;
    if (!goalIdToLog) {
      Alert.alert(t('error'), t('errorInvalidGoalId'));
      return;
    }
    const trimmedQuantity = logEntryQuantity.trim();
    const trimmedCustomAmount = customLogAmount.trim();
    const hasCustomAmount = Boolean(trimmedCustomAmount);

    const itemsForGoal = wasteItemsByGoal[goalIdToLog] ?? [];
    const customItem = getCustomWasteItemForGoal(goalIdToLog);
    const selectedItemFromState =
      itemsForGoal.find((item) => String(item.id) === String(selectedWasteItemId)) ?? null;
    const effectiveSelectedItem =
      hasCustomAmount && customItem ? customItem : selectedItemFromState;

    if (
      hasCustomAmount &&
      customItem &&
      String(selectedWasteItemId) !== String(customItem.id)
    ) {
      setSelectedWasteItemId(String(customItem.id));
    }

    if (!validateLogInput(effectiveSelectedItem, trimmedQuantity, trimmedCustomAmount)) return;

    const itemId = effectiveSelectedItem ? parseInt(String(effectiveSelectedItem.id), 10) : NaN;
    if (!Number.isInteger(itemId)) {
      setLogFormError('errorSelectWasteItem');
      return;
    }

    let parsedQuantity: number;
    if (hasCustomAmount) {
      const parsedCustom = parseFloat(trimmedCustomAmount);
      if (!Number.isFinite(parsedCustom)) {
        setLogFormError('errorLogQuantityPositive');
        return;
      }
      const itemWeightInGrams = Number(effectiveSelectedItem?.weightInGrams);
      if (!Number.isFinite(itemWeightInGrams) || itemWeightInGrams <= 0) {
        setLogFormError('errorCustomAmountConversion');
        return;
      }
      parsedQuantity = Math.max(1, Math.ceil(parsedCustom / itemWeightInGrams));
    } else {
      parsedQuantity = parseInt(trimmedQuantity, 10);
    }

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setLogFormError('errorLogQuantityPositive');
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const requestBody = {
        username,
        itemId,
        quantity: parsedQuantity,
      };
      const response = await apiRequest(`/api/waste-goals/${goalIdToLog}/logs`, {
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
      setLogEntryQuantity('');
      setCustomLogAmount('');
      setSelectedWasteItemId(null);
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
      const normalizedType = normalizeWasteTypeValue(wasteType);
      if (normalizedType !== wasteType) {
        setWasteType(normalizedType);
      }

      const response = await apiRequest(`/api/users/${encodedUsername}/waste-goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: normalizedType,
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
      const normalizedType = normalizeWasteTypeValue(wasteType);
      if (normalizedType !== wasteType) {
        setWasteType(normalizedType);
      }

      const response = await apiRequest(`/api/users/waste-goals/${editingGoal.goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: normalizedType,
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
      const response = await apiRequest(`/api/users/waste-goals/${goalToDelete.goalId}`, {
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
    setUnit(coerceGoalUnit(goal.unit));
    setDuration(goal.duration.toString());
    setAmount(goal.amount.toString());
    setModalVisible(true);
  };

  const resetForm = () => {
    setWasteType(DEFAULT_WASTE_TYPE_VALUE);
    setUnit('Kilograms');
    setDuration('30');
    setAmount('5.0');
    setEditingGoal(null);
    setGoalFormError(null);
  };

  const openAddLogModal = (goal: WasteGoal) => {
    setCurrentGoalForLog(goal);
    setLogEntryQuantity('');
    setCustomLogAmount('');
    setLogFormError(null);
    setAddLogModalVisible(true);

    if (goal?.goalId) {
      const cachedItems = wasteItemsByGoal[goal.goalId];
      if (cachedItems && cachedItems.length > 0) {
        setSelectedWasteItemId(getDefaultWasteItemId(cachedItems));
      } else {
        setSelectedWasteItemId(null);
        fetchWasteItemsForGoal(goal.goalId);
      }
    } else {
      setSelectedWasteItemId(null);
    }
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
        <View style={styles.goalTypeContainer}>
          <AccessibleText backgroundColor={cardBackgroundColor} style={[styles.goalTypeLabel, { color: goalTypeLabelColor }]}>{t('wasteTypeLabel')}</AccessibleText>
          <AccessibleText backgroundColor={cardBackgroundColor} style={styles.goalType}>{item.displayWasteType}</AccessibleText>
        </View>
        <View style={styles.goalActions}>
          {progressPercentage < 100 && (
            <TouchableOpacity
              style={styles.addLogButton}
              onPress={() => openAddLogModal(item)}
              accessibilityRole="button"
              accessibilityLabel={t('addLog')}
            >
              <Text style={styles.buttonText}>{t('addLog')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.iconButton, styles.editButton]}
            onPress={() => openEditModal(item)}
            accessibilityRole="button"
            accessibilityLabel={t('edit')}
          >
            <Ionicons name="create-outline" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>{t('edit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, styles.deleteButton]}
            onPress={() => openDeleteConfirmationModal(item)}
            accessibilityRole="button"
            accessibilityLabel={t('delete')}
          >
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>{t('delete')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <AccessibleText backgroundColor={cardBackgroundColor} style={styles.goalDetails}>
        {t('targetDetails', { amount: item.amount, unit: unitLabel(item.unit), duration: item.duration })}
      </AccessibleText>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progressBarWidthPercentage}%`, backgroundColor: progressBarColor }]} />
      </View>
      <View style={styles.progressTextsContainer}>
        <AccessibleText backgroundColor={cardBackgroundColor} style={[styles.goalProgressText, styles.remainingQuotaText, { color: progressBarColor }]}>
          {t('remainingQuota')} {remainingQuota.toFixed(1)} {unitLabel(item.unit)}
        </AccessibleText>
        <AccessibleText backgroundColor={cardBackgroundColor} style={[styles.goalProgressText, { color: progressBarColor, textAlign: 'right' }]}>
          {t('wasteLoad', { progress: progressPercentage.toFixed(1) })}
        </AccessibleText>
      </View>
    </View>
  )};

  return (
    <ThemedView style={[styles.container, { backgroundColor: screenBackgroundColor }]}>
      <View style={styles.headerContainer}>

        <View style={styles.titleContainer}>
          <AccessibleText type="title" backgroundColor={screenBackgroundColor}>
            {t('wasteGoalsTitle')}
          </AccessibleText>
        </View>
      </View>

      {!username && userType === 'guest' ? (
        <AccessibleText backgroundColor={errorBackgroundColor} style={[styles.errorText, { color: errorTextColor, backgroundColor: errorBackgroundColor }]}> 
          {t('logInToManageGoals')}
        </AccessibleText>
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
            <AccessibleText backgroundColor={errorBackgroundColor} style={[styles.errorText, { color: errorTextColor, backgroundColor: errorBackgroundColor }]}> 
              {error.key ? t(error.key) : error.message}
            </AccessibleText>
          )}

          <FlatList
            data={goals}
            renderItem={renderGoalItem}
            keyExtractor={item => item.goalId.toString()}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={ !loading && !error ? (<AccessibleText backgroundColor={screenBackgroundColor} style={[styles.emptyText, {color: emptyTextColor}]}>{t('noGoalsFound')}</AccessibleText>) : null }
            ListFooterComponent={ loading ? (<ActivityIndicator size="large" color={isDarkMode ? "#66BB6A" : "#4CAF50"} style={styles.loadingSpinner} />) : null }
          />

          <Modal visible={modalVisible} transparent={true} animationType="slide" onRequestClose={() => { setModalVisible(false); resetForm(); }}>
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { backgroundColor: modalContentBgColor }]}>
                <AccessibleText backgroundColor={modalContentBgColor} style={styles.modalTitle}>{editingGoal ? t('editWasteGoal') : t('createNewGoal')}</AccessibleText>
                <AccessibleText backgroundColor={modalContentBgColor} style={styles.inputLabel}>{t('wasteType')}</AccessibleText>
                <View style={[styles.pickerContainer, { borderColor: inputBorderColor, backgroundColor: pickerBackgroundColor }]}>
                  <Picker
                    selectedValue={wasteType}
                    onValueChange={(value) => setWasteType(String(value))}
                    style={[styles.picker, { color: pickerItemColor }]}
                    itemStyle={{ color: pickerItemColor, backgroundColor: pickerBackgroundColor }}
                  >
                    {WASTE_TYPE_OPTIONS.map((option) => (
                      <Picker.Item key={option.value} label={t(option.translationKey)} value={option.value} />
                    ))}
                  </Picker>
                </View>
                <AccessibleText backgroundColor={modalContentBgColor} style={styles.inputLabel}>{t('unit')}</AccessibleText>
                <View style={[styles.pickerContainer, { borderColor: inputBorderColor, backgroundColor: pickerBackgroundColor }]}>
                  <Picker
                    selectedValue={unit}
                    onValueChange={(value) => setUnit(coerceGoalUnit(String(value)))}
                    style={[styles.picker, { color: pickerItemColor }]}
                    itemStyle={{ color: pickerItemColor, backgroundColor: pickerBackgroundColor }}
                  >
                    {GOAL_UNITS.map((goalUnit) => (
                      <Picker.Item
                        key={goalUnit}
                        label={goalUnit === 'Kilograms' ? t('Kilograms') : t('Grams')}
                        value={goalUnit}
                      />
                    ))}
                  </Picker>
                </View>
                <AccessibleText backgroundColor={modalContentBgColor} style={styles.inputLabel}>{t('amount')}</AccessibleText>
                <TextInput style={[styles.input, { borderColor: inputBorderColor, color: inputTextColor, backgroundColor: pickerBackgroundColor }]} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder={t('amountPlaceholder')} placeholderTextColor={placeholderTextColor} />
                <AccessibleText backgroundColor={modalContentBgColor} style={styles.inputLabel}>{t('durationDays')}</AccessibleText>
                <TextInput style={[styles.input, { borderColor: inputBorderColor, color: inputTextColor, backgroundColor: pickerBackgroundColor }]} value={duration} onChangeText={setDuration} keyboardType="numeric" placeholder={t('durationPlaceholder')} placeholderTextColor={placeholderTextColor} />
                {goalFormError && (<AccessibleText backgroundColor={modalContentBgColor} style={[styles.modalFormErrorText, { color: errorTextColor }]}>{t(goalFormError)}</AccessibleText>)}
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

          <Modal
            visible={addLogModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => {
              setAddLogModalVisible(false);
              setCurrentGoalForLog(null);
              setLogEntryQuantity('');
              setCustomLogAmount('');
              setSelectedWasteItemId(null);
              setLogFormError(null);
            }}
          >
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { backgroundColor: modalContentBgColor }]}>
                <AccessibleText backgroundColor={modalContentBgColor} style={styles.modalTitle}>{t('addWasteLog')}</AccessibleText>
                {currentGoalForLog && (
                  <AccessibleText backgroundColor={modalContentBgColor} style={styles.modalSubtitle}>
                    {t('forGoal', {
                      wasteType: currentGoalForLog.displayWasteType,
                      amount: currentGoalForLog.amount,
                      unit: currentGoalForLog.unit,
                    })}
                  </AccessibleText>
                )}
                <AccessibleText backgroundColor={modalContentBgColor} style={styles.inputLabel}>{t('selectWasteItem')}</AccessibleText>
                {fetchingWasteItems ? (
                  <ActivityIndicator style={styles.loadingSpinner} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                ) : visibleWasteItemsForCurrentGoal.length > 0 ? (
                  <View style={[styles.pickerContainer, { borderColor: inputBorderColor, backgroundColor: pickerBackgroundColor }]}>
                    <Picker
                      selectedValue={pickerSelectedValue}
                      onValueChange={(value) => {
                        setSelectedWasteItemId(value);
                        if (customLogAmount.trim().length > 0) {
                          setCustomLogAmount('');
                        }
                      }}
                      style={[styles.picker, { color: pickerItemColor }]}
                      itemStyle={{ color: pickerItemColor, backgroundColor: pickerBackgroundColor }}
                    >
                      {visibleWasteItemsForCurrentGoal.map((item) => {
                        const weightValue = Number(item.weightInGrams);
                        const formattedWeight = Number.isFinite(weightValue)
                          ? (Number.isInteger(weightValue) ? weightValue.toFixed(0) : weightValue.toFixed(1))
                          : null;
                        const label = formattedWeight ? `${item.displayName} (${formattedWeight} g)` : item.displayName;
                        return (
                          <Picker.Item
                            key={item.id}
                            label={label}
                            value={String(item.id)}
                          />
                        );
                      })}
                    </Picker>
                  </View>
                ) : customWasteItemForCurrentGoal ? (
                  <AccessibleText backgroundColor={modalContentBgColor} style={[styles.modalFormErrorText, { color: errorTextColor }]}>
                    {t('customLogAmountLabel')}
                  </AccessibleText>
                ) : (
                  <AccessibleText backgroundColor={modalContentBgColor} style={[styles.modalFormErrorText, { color: errorTextColor }]}>{t('noWasteItemsForGoal')}</AccessibleText>
                )}
                <AccessibleText backgroundColor={modalContentBgColor} style={styles.inputLabel}>{t('logQuantity')}</AccessibleText>
                <TextInput
                  style={[styles.input, { borderColor: inputBorderColor, color: inputTextColor, backgroundColor: pickerBackgroundColor }]}
                  value={logEntryQuantity}
                  onChangeText={(value) => {
                    setLogEntryQuantity(value);
                    if (value.trim().length > 0 && customLogAmount) {
                      setCustomLogAmount('');
                    }
                  }}
                  keyboardType="numeric"
                  placeholder={t('logQuantityPlaceholder')}
                  placeholderTextColor={placeholderTextColor}
                />
                <AccessibleText backgroundColor={modalContentBgColor} style={styles.inputLabel}>{t('customLogAmountLabel')}</AccessibleText>
                <TextInput
                  style={[styles.input, { borderColor: inputBorderColor, color: inputTextColor, backgroundColor: pickerBackgroundColor }]}
                  value={customLogAmount}
                  onChangeText={(value) => {
                    setCustomLogAmount(value);
                    const trimmedValue = value.trim();
                    if (trimmedValue.length > 0) {
                      if (logEntryQuantity) {
                        setLogEntryQuantity('');
                      }
                      if (customWasteItemForCurrentGoal) {
                        setSelectedWasteItemId(String(customWasteItemForCurrentGoal.id));
                      }
                    } else if (
                      customWasteItemForCurrentGoal &&
                      String(selectedWasteItemId) === String(customWasteItemForCurrentGoal.id)
                    ) {
                      const fallbackSource =
                        visibleWasteItemsForCurrentGoal.length > 0
                          ? visibleWasteItemsForCurrentGoal
                          : wasteItemsForCurrentGoal;
                      const fallbackId = getDefaultWasteItemId(fallbackSource);
                      setSelectedWasteItemId(fallbackId);
                    }
                  }}
                  keyboardType="numeric"
                  placeholder={t('customLogAmountPlaceholder')}
                  placeholderTextColor={placeholderTextColor}
                />
                {logFormError && (<AccessibleText backgroundColor={modalContentBgColor} style={[styles.modalFormErrorText, { color: errorTextColor }]}>{t(logFormError)}</AccessibleText>)}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setAddLogModalVisible(false);
                      setCurrentGoalForLog(null);
                      setLogEntryQuantity('');
                      setCustomLogAmount('');
                      setSelectedWasteItemId(null);
                      setLogFormError(null);
                    }}
                  >
                    <Text style={styles.buttonText}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleAddWasteLog}
                    disabled={
                      loading ||
                      fetchingWasteItems ||
                      (visibleWasteItemsForCurrentGoal.length === 0 && !customWasteItemForCurrentGoal)
                    }
                  >
                    <Text style={styles.buttonText}>{loading ? t('saving') : t('confirmLog')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal visible={isDeleteModalVisible} transparent={true} animationType="slide" onRequestClose={() => { setIsDeleteModalVisible(false); setGoalToDelete(null); }}>
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { backgroundColor: modalContentBgColor }]}>
                <AccessibleText backgroundColor={modalContentBgColor} style={styles.modalTitle}>{t('confirmDeletion')}</AccessibleText>
                {goalToDelete && (
                  <AccessibleText backgroundColor={modalContentBgColor} style={styles.deleteConfirmText}>
                    {t('deleteConfirmation', {
                      wasteType: goalToDelete.displayWasteType,
                      amount: goalToDelete.amount,
                      unit: goalToDelete.unit,
                    })}
                  </AccessibleText>
                )}
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
  goalTypeContainer: { marginRight: 12, flexShrink: 1 },
  goalTypeLabel: { fontSize: 12, fontWeight: '500', color: '#6B6B6B', marginBottom: 0, textTransform: 'none' },
  goalType: { fontSize: 18, fontWeight: '600', color: '#2E7D32', flexShrink: 1, marginRight: 8, textTransform: 'none' },
  goalDetails: { fontSize: 15, marginBottom: 8, },
  goalActions: { flexDirection: 'row', alignItems: 'center', gap: 8, },
  createButton: { backgroundColor: '#4CAF50', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 8, marginHorizontal: 80, marginBottom: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2, },
  iconButton: { padding: 8, borderRadius: 6, alignItems: 'center', justifyContent: 'center', minWidth: 36, minHeight: 36, flexDirection: 'row', gap: 4 },
  editButton: { backgroundColor: '#1976D2' },
  deleteButton: { backgroundColor: '#D32F2F' },
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
