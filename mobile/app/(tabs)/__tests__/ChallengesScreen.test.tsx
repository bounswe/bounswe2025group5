import * as React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import ChallengesScreen from "../challenges";
import { AuthContext, AuthContextType } from "../../_layout";
import { apiRequest } from "../../services/apiClient";

// Mock dependencies
jest.mock("@/components/ThemedText", () => {
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, ...props }: any) => (
      <Text {...props}>{children}</Text>
    ),
  };
});

jest.mock("@/hooks/useAppColors", () => ({
  useAppColors: () => ({
    screenBackground: "#FFFFFF",
    cardBackground: "#F5F5F5",
    text: "#000000",
    textSecondary: "#666666",
    textSubtle: "#999999",
    borderColor: "#DDDDDD",
    buttonPrimary: "#4CAF50",
    buttonSecondary: "#2196F3",
    buttonWarning: "#FF9800",
    buttonDanger: "#E53935",
    error: "#FF6B6B",
    activityIndicator: "#2196F3",
    modalBackground: "#FFFFFF",
    inputBackground: "#FAFAFA",
    progressExcellent: "#4CAF50",
    progressGood: "#8BC34A",
    progressFair: "#FFC107",
    progressCaution: "#FF9800",
    progressBad: "#FF5722",
  }),
}));

jest.mock("@/utils/colorUtils", () => ({
  useSwitchColors: () => ({
    thumbColor: "#FFFFFF",
    trackColor: { false: "#767577", true: "#81b0ff" },
  }),
}));

jest.mock("../../services/apiClient", () => ({
  apiRequest: jest.fn(),
}));

// Mock i18next properly
const mockChangeLanguage = jest.fn();
const mockT = jest.fn((key: string) => key);

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: {
      language: "en",
      resolvedLanguage: "en",
      changeLanguage: mockChangeLanguage,
      use: jest.fn().mockReturnThis(),
      init: jest.fn(),
    },
  }),
  initReactI18next: {
    type: "3rdParty",
    init: jest.fn(),
  },
}));

// Mock expo-router to prevent crashes when the component uses navigation or Stack.Screen
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    setParams: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Stack: {
    Screen: () => null, // Renders nothing so it doesn't interfere with tests
  },
}));

// Mock vector icons since native assets can't be loaded in Jest
jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
  MaterialIcons: "MaterialIcons",
  FontAwesome: "FontAwesome",
  Feather: "Feather",
}));

// Mock Safe Area Context if your screen uses it directly or via headers
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: any) => children,
}));

// Mock data
const mockChallenges = [
  {
    challengeId: 1,
    name: "Plastic Free Week",
    description: "Reduce plastic waste for one week",
    amount: 100,
    currentAmount: 75,
    startDate: "2024-01-01",
    endDate: "2024-01-07",
    status: "Active",
    type: "Plastic",
    userInChallenge: true,
  },
  {
    challengeId: 2,
    name: "Paper Recycling Challenge",
    description: "Recycle paper products",
    amount: 50,
    currentAmount: 25,
    startDate: "2024-01-01",
    endDate: "2024-01-31",
    status: "Active",
    type: "Paper",
    userInChallenge: false,
  },
  {
    challengeId: 3,
    name: "Organic Composting",
    description: "Compost organic waste",
    amount: 200,
    currentAmount: 200,
    startDate: "2023-12-01",
    endDate: "2023-12-31",
    status: "Completed",
    type: "Organic",
    userInChallenge: true,
  },
];

const mockLeaderboard = [
  { username: "user1", logAmount: 50 },
  { username: "user2", logAmount: 30 },
  { username: "user3", logAmount: 20 },
];

const mockChallengeLogs = {
  logs: [
    { quantity: 10, item: "Bottle", timestamp: "2024-01-01T10:00:00Z" },
    { quantity: 15, item: "Cup", timestamp: "2024-01-02T10:00:00Z" },
    { quantity: 20, item: "Bag", timestamp: "2024-01-03T10:00:00Z" },
  ],
};

const mockWasteItemsForChallenge = [
  { id: 1, displayName: "Bottle", weightInGrams: 5 },
  { id: 2, displayName: "Cup", weightInGrams: 2 },
  { id: 3, displayName: "Bag", weightInGrams: 1 },
];

const createMockAuthContext = (
  userType: "user" | "guest" | null = "user",
  username = "testuser"
): AuthContextType => ({
  userType,
  username,
  setUserType: jest.fn(),
  setUsername: jest.fn(),
});

const renderWithAuth = (authContext = createMockAuthContext()) => {
  return render(
    <AuthContext.Provider value={authContext}>
      <ChallengesScreen />
    </AuthContext.Provider>
  );
};

describe("ChallengesScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockT.mockImplementation((key: string) => key);
    (apiRequest as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockChallenges),
    });
  });

  describe("Initial Rendering", () => {
    it("should render the screen with title and filters", async () => {
      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText("challengesTitle")).toBeTruthy();
        expect(screen.getByTestId("attended-only-switch")).toBeTruthy();
        expect(screen.getByTestId("active-only-switch")).toBeTruthy();
      });
    });

    it("should show loading indicator while fetching challenges", () => {
      (apiRequest as jest.Mock).mockImplementationOnce(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithAuth();

      expect(screen.getByTestId("full-screen-loading")).toBeTruthy();
    });

    it("should display challenges after successful fetch", async () => {
      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText("Plastic Free Week")).toBeTruthy();
        expect(screen.getByText("Paper Recycling Challenge")).toBeTruthy();
        expect(screen.getByText("Organic Composting")).toBeTruthy();
      });
    });

    it("should display error message on fetch failure", async () => {
      (apiRequest as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue("Server error"),
      });

      renderWithAuth();

      await waitFor(() => {
        expect(screen.queryByText("Plastic Free Week")).toBeNull();
      });
    });
  });

  describe("Filtering", () => {
    it("should filter to show only attended challenges", async () => {
      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText("Plastic Free Week")).toBeTruthy();
        expect(screen.getByText("Paper Recycling Challenge")).toBeTruthy();
      });

      const attendedSwitch = screen.getByTestId("attended-only-switch");
      fireEvent(attendedSwitch, "valueChange", true);

      await waitFor(() => {
        expect(screen.getByText("Plastic Free Week")).toBeTruthy();
        expect(screen.queryByText("Paper Recycling Challenge")).toBeNull();
        expect(screen.getByText("Organic Composting")).toBeTruthy();
      });
    });

    it("should filter to show only active challenges", async () => {
      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText("Organic Composting")).toBeTruthy();
      });

      const activeSwitch = screen.getByTestId("active-only-switch");
      fireEvent(activeSwitch, "valueChange", true);

      await waitFor(() => {
        expect(screen.getByText("Plastic Free Week")).toBeTruthy();
        expect(screen.getByText("Paper Recycling Challenge")).toBeTruthy();
        expect(screen.queryByText("Organic Composting")).toBeNull();
      });
    });

    it("should apply both filters simultaneously", async () => {
      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText("Plastic Free Week")).toBeTruthy();
      });

      const attendedSwitch = screen.getByTestId("attended-only-switch");
      const activeSwitch = screen.getByTestId("active-only-switch");

      fireEvent(attendedSwitch, "valueChange", true);
      fireEvent(activeSwitch, "valueChange", true);

      await waitFor(() => {
        expect(screen.getByText("Plastic Free Week")).toBeTruthy();
        expect(screen.queryByText("Paper Recycling Challenge")).toBeNull();
        expect(screen.queryByText("Organic Composting")).toBeNull();
      });
    });
  });

  describe("Challenge Expansion", () => {
    it("should expand challenge when card is tapped", async () => {
      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText("Plastic Free Week")).toBeTruthy();
      });

      const challengeCard = screen.getByText("Plastic Free Week");
      fireEvent.press(challengeCard);

      await waitFor(() => {
        expect(
          screen.getByText("Reduce plastic waste for one week")
        ).toBeTruthy();
        expect(screen.getByText(/^progressText/)).toBeTruthy();
      });
    });

    it("should display challenge type in progress text", async () => {
      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText("Plastic Free Week")).toBeTruthy();
      });

      const challengeCard = screen.getByText("Plastic Free Week");
      fireEvent.press(challengeCard);

      await waitFor(() => {
        // Should show "75 / 100 Plastic" instead of "75 / 100 kg"
        const progressTexts = screen.getAllByText(/progressText/);
        expect(progressTexts.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Attend/Leave Challenge", () => {
    it("should call API to attend a challenge", async () => {
      (apiRequest as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockChallenges),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({}),
        });

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText("Paper Recycling Challenge")).toBeTruthy();
      });

      // Expand the challenge
      const challengeCard = screen.getByText("Paper Recycling Challenge");
      fireEvent.press(challengeCard);

      await waitFor(() => {
        expect(screen.getByText("attendChallenge")).toBeTruthy();
      });

      const attendButton = screen.getByTestId("attend-leave-button-2");
      fireEvent.press(attendButton);

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith(
          "/api/challenges/2/attendees",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ username: "testuser" }),
          })
        );
      });
    });

    it("should call API to leave a challenge", async () => {
      (apiRequest as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockChallenges),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({}),
        });

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText("Plastic Free Week")).toBeTruthy();
      });

      const challengeCard = screen.getByText("Plastic Free Week");
      fireEvent.press(challengeCard);

      await waitFor(() => {
        expect(screen.getByText("leaveChallenge")).toBeTruthy();
      });

      const leaveButton = screen.getByTestId("attend-leave-button-1");
      fireEvent.press(leaveButton);

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith(
          "/api/challenges/1/attendees/testuser",
          expect.objectContaining({
            method: "DELETE",
          })
        );
      });
    });
  });

  describe("Leaderboard", () => {
    it("should fetch and display leaderboard when button is clicked", async () => {
      (apiRequest as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockChallenges),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockLeaderboard),
        });

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText("Plastic Free Week")).toBeTruthy();
      });

      const challengeCard = screen.getByText("Plastic Free Week");
      fireEvent.press(challengeCard);

      await waitFor(() => {
        const viewLeaderboardButton = screen.getByTestId(
          "view-leaderboard-button-1"
        );
        expect(viewLeaderboardButton).toBeTruthy();
      });

      const viewLeaderboardButton = screen.getByTestId(
        "view-leaderboard-button-1"
      );
      fireEvent.press(viewLeaderboardButton);

      await waitFor(() => {
        expect(screen.getByText("leaderboardTitle")).toBeTruthy();
        expect(screen.getByText("1. user1")).toBeTruthy();
        expect(screen.getByText("2. user2")).toBeTruthy();
        expect(screen.getByText("3. user3")).toBeTruthy();
      });
    });

    it("should display leaderboard with challenge type units", async () => {
      (apiRequest as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockChallenges),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockLeaderboard),
        });

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText("Plastic Free Week")).toBeTruthy();
      });

      const challengeCard = screen.getByText("Plastic Free Week");
      fireEvent.press(challengeCard);

      const viewLeaderboardButton = screen.getByTestId(
        "view-leaderboard-button-1"
      );
      fireEvent.press(viewLeaderboardButton);

      await waitFor(() => {
        // Should show amounts with "Plastic" unit instead of "kg"
        expect(screen.getByText("points")).toBeTruthy();
      });
    });

    it("should close leaderboard modal when close button is clicked", async () => {
      (apiRequest as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockChallenges),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockLeaderboard),
        });

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText("Plastic Free Week")).toBeTruthy();
      });

      const challengeCard = screen.getByText("Plastic Free Week");
      fireEvent.press(challengeCard);

      const viewLeaderboardButton = screen.getByTestId(
        "view-leaderboard-button-1"
      );
      fireEvent.press(viewLeaderboardButton);

      await waitFor(() => {
        expect(screen.getByText("leaderboardTitle")).toBeTruthy();
      });

      const closeButton = screen.getByTestId("leaderboard-close-button");
      fireEvent.press(closeButton);

      await waitFor(() => {
        expect(screen.queryByText("leaderboardTitle")).toBeNull();
      });
    });
  });

  describe("Log Waste", () => {
    it("should open log modal when add log button is clicked", async () => {
      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText("Plastic Free Week")).toBeTruthy();
      });

      const challengeCard = screen.getByText("Plastic Free Week");
      fireEvent.press(challengeCard);

      await waitFor(() => {
        expect(screen.getByText("addLog")).toBeTruthy();
      });

      const addLogButton = screen.getByText("addLog");
      fireEvent.press(addLogButton);

      await waitFor(() => {
        expect(screen.getAllByText("logWaste")).toBeTruthy();
        expect(screen.getByText("amount")).toBeTruthy();
      });
    });

    it("should submit log waste successfully", async () => {
      (apiRequest as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockChallenges),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockWasteItemsForChallenge),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockChallenges),
        });

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText("Plastic Free Week")).toBeTruthy();
      });

      const challengeCard = screen.getByText("Plastic Free Week");
      fireEvent.press(challengeCard);

      const addLogButton = screen.getByText("addLog");
      fireEvent.press(addLogButton);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("enterAmountPlaceholder")
        ).toBeTruthy();
      });

      const picker = screen.getByTestId("waste-item-picker");
      fireEvent(picker, "valueChange", "1");

      const input = screen.getByPlaceholderText("enterAmountPlaceholder");
      fireEvent.changeText(input, "10");

      const submitButtons = screen.getAllByText("logWaste");
      const submitButton = submitButtons[submitButtons.length - 1];
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith(
          "/api/challenges/1/log",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ username: "testuser", itemId: 1, quantity: 10 }),
          })
        );
      });
    });
  });

  describe("Show Logs", () => {
    it("should fetch and display user logs", async () => {
      (apiRequest as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockChallenges),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockChallengeLogs),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockWasteItemsForChallenge),
        });

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText("Plastic Free Week")).toBeTruthy();
      });

      const challengeCard = screen.getByText("Plastic Free Week");
      fireEvent.press(challengeCard);

      await waitFor(() => {
        expect(screen.getByText("showLogs")).toBeTruthy();
      });

      const showLogsButton = screen.getByText("showLogs");
      fireEvent.press(showLogsButton);

      await waitFor(() => {
        expect(screen.getByText("challengeLogs")).toBeTruthy();
        expect(screen.getByText("Bottle")).toBeTruthy();
        expect(screen.getByText("10")).toBeTruthy();
        // Points = quantity * weightInGrams -> 10 * 5 = 50
        expect(screen.getByText("50")).toBeTruthy();
      });
    });
  });

  describe("Create Challenge (Admin)", () => {
    it("should show create challenge button for admin users", async () => {
      renderWithAuth(createMockAuthContext("user", "admin"));

      await waitFor(() => {
        expect(screen.getByText("createChallenge")).toBeTruthy();
      });
    });

    it("should open create challenge modal when button is clicked", async () => {
      renderWithAuth(createMockAuthContext("user", "admin"));

      await waitFor(() => {
        expect(screen.getByText("createChallenge")).toBeTruthy();
      });

      const createButton = screen.getByText("createChallenge");
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(screen.getByText("createNewChallengeModal")).toBeTruthy();
        expect(
          screen.getByPlaceholderText("challengeNamePlaceholder")
        ).toBeTruthy();
      });
    });

    it("should create a new challenge successfully", async () => {
      (apiRequest as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockChallenges),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockChallenges),
        });

      renderWithAuth(createMockAuthContext("user", "admin"));

      await waitFor(() => {
        expect(screen.getByText("createChallenge")).toBeTruthy();
      });

      const createButton = screen.getByText("createChallenge");
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("challengeNamePlaceholder")
        ).toBeTruthy();
      });

      const nameInput = screen.getByPlaceholderText("challengeNamePlaceholder");
      const descInput = screen.getByPlaceholderText(
        "challengeDescriptionPlaceholder"
      );
      const amountInput = screen.getByPlaceholderText(
        "targetAmountPlaceholder"
      );
      const durationInput = screen.getByPlaceholderText(
        "durationDaysPlaceholder"
      );

      fireEvent.changeText(nameInput, "New Challenge");
      fireEvent.changeText(descInput, "Test description");
      fireEvent.changeText(amountInput, "100");
      fireEvent.changeText(durationInput, "30");

      const createChallengeButton = screen.getByText("createChallengeButton");
      fireEvent.press(createChallengeButton);

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith(
          "/api/challenges",
          expect.objectContaining({
            method: "POST",
            body: expect.stringContaining("New Challenge"),
          })
        );
      });
    });
  });
});
