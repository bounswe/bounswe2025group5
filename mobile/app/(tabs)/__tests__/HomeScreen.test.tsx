import React from 'react'
import { render, fireEvent, act } from '@testing-library/react-native'
import HomeScreen from '../index'
import { AuthContext } from '../../_layout'

// navigation mocks must be prefixed with "mock" so jest.mock factory can reference them
const mockNavigate = jest.fn()
const mockSetParams = jest.fn()

// Mock React Navigation hooks
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native')
  return {
    ...actual,
    useNavigation:  () => ({ navigate: mockNavigate, setParams: mockSetParams }),
    useRoute:       () => ({ params: {} }),
    useFocusEffect: (cb: any) => { cb() },
  }
})

// Mock async storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem:  jest.fn(() => Promise.resolve(null)),
  multiSet: jest.fn(() => Promise.resolve()),
}))

// Mock other native/expo components
jest.mock('@expo/vector-icons',              () => ({ Ionicons: () => null }))
jest.mock('@/components/HelloWave',          () => 'HelloWave')
jest.mock('@/components/ParallaxScrollView', () => 'ParallaxScrollView')
jest.mock('@/components/ThemedText',         () => 'ThemedText')

// Mock expo-router stack (to bypass createNavigatorFactory errors)
jest.mock('expo-router', () => ({ Stack: {} }))

// Silence console.warn from real network calls
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {})
})

// Provide a fake global.fetch so all useEffect network calls resolve safely
beforeEach(() => {
  ;(global as any).fetch = jest.fn((url: string) => {
    if (url.includes('/api/users/count')) {
      return Promise.resolve({
        ok:   true,
        json: () => Promise.resolve({ userCount: 0 }),
      })
    }
    if (url.includes('/api/posts/mostLikedPosts')) {
      return Promise.resolve({
        ok:   true,
        json: () => Promise.resolve([]),
      })
    }
    // fallback for any other fetch
    return Promise.resolve({
      ok:   true,
      json: () => Promise.resolve({}),
    })
  })
})

describe('HomeScreen login flow', () => {
  afterEach(() => {
    mockNavigate.mockReset()
    mockSetParams.mockReset()
  })

  it('navigates to "explore" when username and password are both "test"', async () => {
    const setUserType = jest.fn()
    const setUsername = jest.fn()

    const screen = render(
      <AuthContext.Provider value={{
        userType: null,
        username: '',
        setUserType,
        setUsername,
      }}>
        <HomeScreen />
      </AuthContext.Provider>
    )

    // open login form
    act(() => {
      fireEvent.press(screen.getByText('Log In'))
    })

    // fill credentials
    fireEvent.changeText(
      screen.getByPlaceholderText('Email or Username'),
      'test',
    )
    fireEvent.changeText(
      screen.getByPlaceholderText('Password'),
      'test',
    )

    // submit login
    await act(async () => {
      fireEvent.press(screen.getByText('Log In'))
    })

    // context setters called
    expect(setUserType).toHaveBeenCalledWith('user')
    expect(setUsername).toHaveBeenCalledWith('test')
    // navigation called
    expect(mockNavigate).toHaveBeenCalledWith('explore')
  })
})