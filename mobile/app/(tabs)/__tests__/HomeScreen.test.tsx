import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react-native";
import HomeScreen from "../index";
import { AuthContext } from "../../_layout";
import { apiRequest } from "../../services/apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- Mocks ---

// Mock AuthContext from _layout to avoid executing _layout.tsx which has complex dependencies
jest.mock("../../_layout", () => {
  const React = require("react");
  return {
    __esModule: true,
    AuthContext: React.createContext({
      userType: null,
      setUserType: jest.fn(),
      username: "",
      setUsername: jest.fn(),
    }),
  };
});

// Mock Navigation
const mockNavigate = jest.fn();
const mockSetParams = jest.fn();

jest.mock("@react-navigation/native", () => {
  const actualNav = jest.requireActual("@react-navigation/native");
  const React = require("react");
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      setParams: mockSetParams,
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: (callback: any) => {
      React.useEffect(callback, []);
    },
  };
});

// Mock API Client
jest.mock("../../services/apiClient", () => ({
  apiRequest: jest.fn(),
  login: jest.fn(),
  register: jest.fn(),
}));

// Mock Async Storage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  multiSet: jest.fn(),
}));

// Mock i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (key === "usersAreReducingWastes")
        return `${options?.count} users are reducing wastes`;
      if (key === "trendingCardSubtitle") return "Community member";
      return key;
    },
    i18n: {
      changeLanguage: jest.fn(),
      language: "en",
      resolvedLanguage: "en",
    },
  }),
  initReactI18next: {
    type: "3rdParty",
    init: jest.fn(),
  },
}));

// Mock Components
jest.mock("@/components/ParallaxScrollView", () => {
  const { View } = require("react-native");
  return ({ children }: any) => (
    <View testID="parallax-scroll-view">{children}</View>
  );
});

jest.mock("@/components/ThemedText", () => {
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, ...props }: any) => (
      <Text {...props}>{children}</Text>
    ),
  };
});

jest.mock("@/components/AccessibleText", () => {
  const { Text } = require("react-native");
  return ({ children, ...props }: any) => <Text {...props}>{children}</Text>;
});

jest.mock("../../components/CheckBox", () => {
  const { TouchableOpacity, Text } = require("react-native");
  const CheckBox = ({ checked, onPress }: any) => (
    <TouchableOpacity onPress={onPress} testID="checkbox">
      <Text>{checked ? "[X]" : "[ ]"}</Text>
    </TouchableOpacity>
  );
  return CheckBox;
});

jest.mock("@expo/vector-icons", () => {
  const { View } = require("react-native");
  return {
    Ionicons: (props: any) => <View {...props} testID="ionicons" />,
  };
});

// --- Test Setup ---

const mockSetUserType = jest.fn();
const mockSetUsername = jest.fn();

const renderWithAuth = (
  userType: "user" | "guest" | null = null,
  username = ""
) => {
  return render(
    <AuthContext.Provider
      value={{
        userType,
        setUserType: mockSetUserType,
        username,
        setUsername: mockSetUsername,
      }}
    >
      <HomeScreen />
    </AuthContext.Provider>
  );
};

describe("HomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default API mocks
    (apiRequest as jest.Mock).mockImplementation((url) => {
      if (url.includes("/users/count")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ userCount: 1234 }),
        });
      }
      if (url.includes("/posts/mostLiked")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                postId: 1,
                content: "Trending Post 1",
                likes: 100,
                comments: 10,
                creatorUsername: "trendUser1",
                photoUrl: null,
              },
              {
                postId: 2,
                content: "Trending Post 2",
                likes: 200,
                comments: 20,
                creatorUsername: "trendUser2",
                photoUrl: "http://example.com/photo.jpg",
              },
            ]),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it("renders initial elements correctly", async () => {
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText(/1234 users are reducing wastes/)).toBeTruthy();
      expect(screen.getByText("trendingPosts")).toBeTruthy();
      expect(screen.getByText("logIn")).toBeTruthy();
      expect(screen.getByText("register")).toBeTruthy();
      expect(screen.getByText("continueAsGuest")).toBeTruthy();
    });
  });

  it("fetches and displays trending posts", async () => {
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText("trendUser1")).toBeTruthy();
      expect(screen.getByText("Trending Post 1")).toBeTruthy();
      expect(screen.getByText("trendUser2")).toBeTruthy();
      expect(screen.getByText("Trending Post 2")).toBeTruthy();
    });
  });

  it("navigates to explore when 'Continue as Guest' is pressed", async () => {
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText("continueAsGuest")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("continueAsGuest"));

    expect(mockSetUserType).toHaveBeenCalledWith("guest");
    expect(mockSetUsername).toHaveBeenCalledWith("");
    expect(mockNavigate).toHaveBeenCalledWith("explore");
  });

  it("shows auth fields when 'Log In' is pressed", async () => {
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText("logIn")).toBeTruthy();
    });

    // There are two "logIn" texts initially (one in button, maybe another one?).
    // Actually in the initial view there is one button with "logIn".
    // But wait, the code has:
    // <Text ...>{t("logIn")}</Text> inside TouchableOpacity.

    // Let's use getAllByText just in case, or be specific.
    // The initial view has "logIn" button.

    fireEvent.press(screen.getByText("logIn"));

    await waitFor(() => {
      expect(screen.getByText("loginHere")).toBeTruthy();
      expect(screen.getByPlaceholderText("emailOrUsername")).toBeTruthy();
      expect(screen.getByPlaceholderText("password")).toBeTruthy();
    });
  });

  it("shows auth fields when 'Register' is pressed", async () => {
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText("register")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("register"));

    await waitFor(() => {
      expect(screen.getByText("createAccount")).toBeTruthy();
      expect(screen.getByPlaceholderText("username")).toBeTruthy();
      expect(screen.getByPlaceholderText("email")).toBeTruthy();
      expect(screen.getByPlaceholderText("password")).toBeTruthy();
      expect(screen.getByPlaceholderText("confirmPassword")).toBeTruthy();
      expect(screen.getByText("kvkkAcknowledge")).toBeTruthy();
    });
  });

  it("switches between Login and Register modes", async () => {
    renderWithAuth();

    // Start with Login
    fireEvent.press(screen.getByText("logIn"));
    await waitFor(() => expect(screen.getByText("loginHere")).toBeTruthy());

    // Switch to Register
    // Inside auth fields, there is a "register" button to switch mode
    // Note: The text "register" appears in the initial view AND in the auth view (to switch).
    // Since we are in auth view now, we should find the button that switches to register.
    // It has text t("register").

    const registerButtons = screen.getAllByText("register");
    // The last one should be the one in the auth form if multiple exist, or just press it.
    fireEvent.press(registerButtons[registerButtons.length - 1]);

    await waitFor(() => expect(screen.getByText("createAccount")).toBeTruthy());

    // Switch back to Login
    fireEvent.press(screen.getByText("backToLogIn"));
    await waitFor(() => expect(screen.getByText("loginHere")).toBeTruthy());
  });

  it("auto-logins if token exists in storage", async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
      if (key === "token") return Promise.resolve("fake-token");
      if (key === "username") return Promise.resolve("storedUser");
      return Promise.resolve(null);
    });

    renderWithAuth();

    await waitFor(() => {
      expect(mockSetUserType).toHaveBeenCalledWith("user");
      expect(mockSetUsername).toHaveBeenCalledWith("storedUser");
      expect(mockNavigate).toHaveBeenCalledWith("explore");
    });
  });
});
