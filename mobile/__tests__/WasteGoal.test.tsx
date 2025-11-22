import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import WasteGoalScreen from '../app/(tabs)/wastegoal';
import { AuthContext } from '../app/_layout';
import { apiRequest } from '../app/services/apiClient';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mocks
jest.mock('../app/services/apiClient', () => ({
  apiRequest: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));

const en = require('../app/locales/en.json');
const tr = require('../app/locales/tr.json');

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      addListener: jest.fn(),
    }),
    useFocusEffect: (callback: () => void) => {
      const React = require('react');
      React.useEffect(callback, []);
    },
  };
});

describe('WasteGoalScreen Functionalities', () => {
  const mockUser = {
    userType: 'user' as const,
    username: 'testuser',
    setUserType: jest.fn(),
    setUsername: jest.fn(),
  };

  const mockGoals = [
    {
      goalId: 1,
      wasteType: 'PLASTIC',
      restrictionAmountGrams: 5000,
      duration: 30,
      progress: 20,
      createdAt: new Date().toISOString(),
      creatorUsername: 'testuser',
    },
    {
      goalId: 2,
      wasteType: 'PAPER',
      restrictionAmountGrams: 2000,
      duration: 15,
      progress: 50,
      createdAt: new Date().toISOString(),
      creatorUsername: 'testuser',
    }
  ];

  const mockWasteItems = [
    { id: 101, displayName: 'Plastic Bottle', weightInGrams: 50 },
    { id: 102, displayName: 'Plastic Bag', weightInGrams: 10 },
  ];

  let currentLanguage = 'en';

  beforeEach(() => {
    jest.clearAllMocks();
    currentLanguage = 'en';

    (useTranslation as jest.Mock).mockImplementation(() => ({
        t: (key: string, options?: any) => {
            const langData = currentLanguage === 'en' ? en : tr;
            let value = langData.translation[key];
            if (!value && options?.defaultValue) return options.defaultValue;
            if (!value) return key;
            
            if (options) {
                Object.keys(options).forEach(k => {
                    if (typeof options[k] === 'string' || typeof options[k] === 'number') {
                        value = value.replace(`{{${k}}}`, String(options[k]));
                    }
                });
            }
            return value;
        },
        i18n: { 
            language: currentLanguage, 
            resolvedLanguage: currentLanguage,
            changeLanguage: (lang: string) => {
                currentLanguage = lang;
                return Promise.resolve();
            }
        },
    }));

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('mock-token');

    (apiRequest as jest.Mock).mockImplementation((url, options) => {
      if (url.includes('/api/users/testuser/waste-goals') && !options) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGoals),
        });
      }
      if (url.includes('/api/users/waste-goals/1/items')) {
         return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockWasteItems),
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });
  });

  it('fetches and displays waste goals', async () => {
    const { getByText } = render(
      <AuthContext.Provider value={mockUser}>
        <WasteGoalScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining('/api/users/testuser/waste-goals'));
    });

    await waitFor(() => {
      expect(getByText('Plastic')).toBeTruthy();
      expect(getByText('Paper')).toBeTruthy();
    });
  });

  it('allows creating a new waste goal', async () => {
    (apiRequest as jest.Mock).mockImplementation((url, options) => {
        if (url.includes('/api/users/testuser/waste-goals') && !options) {
             return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGoals) });
        }
        if (url.includes('/api/users/testuser/waste-goals') && options?.method === 'POST') {
            return Promise.resolve({ ok: true, text: () => Promise.resolve('Created') });
        }
        return Promise.resolve({ ok: false });
    });

    const { getByText, getByPlaceholderText } = render(
      <AuthContext.Provider value={mockUser}>
        <WasteGoalScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => expect(getByText('Plastic')).toBeTruthy());

    fireEvent.press(getByText('Create New Goal'));

    const amountInput = getByPlaceholderText('e.g., 5.0');
    fireEvent.changeText(amountInput, '10');

    const durationInput = getByPlaceholderText('e.g., 30');
    fireEvent.changeText(durationInput, '45');

    fireEvent.press(getByText('Save'));

    await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/users/testuser/waste-goals'),
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"restrictionAmountGrams":10000'), // 10kg = 10000g
            })
        );
    });
  });

  it('allows editing a waste goal', async () => {
     (apiRequest as jest.Mock).mockImplementation((url, options) => {
        if (url.includes('/api/users/testuser/waste-goals') && !options) {
             return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGoals) });
        }
        if (url.includes('/api/users/waste-goals/1') && options?.method === 'PUT') {
            return Promise.resolve({ ok: true, text: () => Promise.resolve('Updated') });
        }
        return Promise.resolve({ ok: false });
    });

    const { getAllByText, getByPlaceholderText, getByText } = render(
      <AuthContext.Provider value={mockUser}>
        <WasteGoalScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => expect(getByText('Plastic')).toBeTruthy());

    const editButtons = getAllByText('Edit');
    fireEvent.press(editButtons[0]); // Edit the first goal (Plastic)

    const amountInput = getByPlaceholderText('e.g., 5.0');
    fireEvent.changeText(amountInput, '8'); // Change to 8kg

    fireEvent.press(getByText('Update'));

    await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/users/waste-goals/1'),
            expect.objectContaining({
                method: 'PUT',
                body: expect.stringContaining('"restrictionAmountGrams":8000'),
            })
        );
    });
  });

  it('allows deleting a waste goal', async () => {
    (apiRequest as jest.Mock).mockImplementation((url, options) => {
        if (url.includes('/api/users/testuser/waste-goals') && !options) {
             return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGoals) });
        }
        if (url.includes('/api/users/waste-goals/1') && options?.method === 'DELETE') {
            return Promise.resolve({ ok: true, text: () => Promise.resolve('Deleted') });
        }
        return Promise.resolve({ ok: false });
    });

    const { getAllByText, getByText } = render(
      <AuthContext.Provider value={mockUser}>
        <WasteGoalScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => expect(getByText('Plastic')).toBeTruthy());

    const deleteButtons = getAllByText('Delete');
    fireEvent.press(deleteButtons[0]); // Delete the first goal

    // Confirm deletion
    await waitFor(() => expect(getByText('Confirm Deletion')).toBeTruthy());
    
    const allDeleteTexts = getAllByText('Delete');
    fireEvent.press(allDeleteTexts[allDeleteTexts.length - 1]);

    await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/users/waste-goals/1'),
            expect.objectContaining({ method: 'DELETE' })
        );
    });
  });

  it('allows adding a waste log', async () => {
    (apiRequest as jest.Mock).mockImplementation((url, options) => {
        if (url.includes('/api/users/testuser/waste-goals') && !options) {
             return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGoals) });
        }
        if (url.includes('/api/users/waste-goals/1/items')) {
             return Promise.resolve({ ok: true, json: () => Promise.resolve(mockWasteItems) });
        }
        if (url.includes('/api/waste-goals/1/logs') && options?.method === 'POST') {
             return Promise.resolve({ ok: true, text: () => Promise.resolve('Log Added') });
        }
        return Promise.resolve({ ok: false });
    });

    const { getAllByText, getByText, getByPlaceholderText } = render(
      <AuthContext.Provider value={mockUser}>
        <WasteGoalScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => expect(getByText('Plastic')).toBeTruthy());

    const addLogButtons = getAllByText('Add Log');
    fireEvent.press(addLogButtons[0]); // Add log to first goal

    await waitFor(() => expect(getByText('Add Waste Log')).toBeTruthy());
    
    // Wait for items to load
    await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining('/api/users/waste-goals/1/items'));
    });

    const quantityInput = getByPlaceholderText('e.g., 2 items');
    fireEvent.changeText(quantityInput, '3');

    fireEvent.press(getByText('Confirm Log'));

    await waitFor(() => {
        const calls = (apiRequest as jest.Mock).mock.calls;
        const logCall = calls.find(call => call[0].includes('/api/waste-goals/1/logs') && call[1].method === 'POST');
        expect(logCall).toBeTruthy();
        expect(logCall[1].body).toContain('"quantity":3');
        expect(logCall[1].body).toContain('"itemId":101');
    });
  });

  it('displays correct texts in Turkish and English', async () => {
    // Switch to Turkish
    currentLanguage = 'tr';
    
    const { getByText, unmount } = render(
      <AuthContext.Provider value={mockUser}>
        <WasteGoalScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => expect(getByText('Plastik')).toBeTruthy()); // Plastic -> Plastik
    expect(getByText('Atık Azaltma Hedefleri')).toBeTruthy(); // Waste Reduction Goals
    expect(getByText('Yeni Hedef Oluştur')).toBeTruthy(); // Create New Goal

    unmount();

    // Switch to English
    currentLanguage = 'en';
    const { getByText: getByTextEn } = render(
      <AuthContext.Provider value={mockUser}>
        <WasteGoalScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => expect(getByTextEn('Plastic')).toBeTruthy());
    expect(getByTextEn('Waste Reduction Goals')).toBeTruthy();
    expect(getByTextEn('Create New Goal')).toBeTruthy();
  });
});
