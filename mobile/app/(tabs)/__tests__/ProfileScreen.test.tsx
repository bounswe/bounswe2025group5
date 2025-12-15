import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react-native";
import ProfileScreen from "../profile";
import { AuthContext } from "../../_layout";
import { apiRequest, clearSession } from "../../services/apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- Mocks ---

// Mock Navigation
const mockNavigate = jest.fn();
const mockReset = jest.fn();
const mockSetParams = jest.fn();

jest.mock("@react-navigation/native", () => {
  const actualNav = jest.requireActual("@react-navigation/native");
  const React = require("react");
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      reset: mockReset,
      setParams: mockSetParams,
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: (callback: any) => {
      // Execute the callback immediately for testing purposes
      React.useEffect(callback, []);
    },
  };
});

// Mock API Client
jest.mock("../../services/apiClient", () => ({
  apiRequest: jest.fn(),
  clearSession: jest.fn(),
}));

// Mock Async Storage
jest.mock("@react-native-async-storage/async-storage", () => ({
  multiRemove: jest.fn(),
}));

// Mock i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (key === "helloUser") return `Hello, ${options?.username}`;
      if (key === "totalImpact") return `Total Impact: ${options?.amount}`;
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

jest.mock("@/components/AccessibleText", () => {
  const { Text } = require("react-native");
  return ({ children, ...props }: any) => <Text {...props}>{children}</Text>;
});

jest.mock("react-native-chart-kit", () => ({
  BarChart: () => {
    const { View } = require("react-native");
    return <View testID="bar-chart" />;
  },
}));

jest.mock("react-native-svg", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  const MockSvgComponent = ({ children, ...props }: any) => (
    <View {...props}>{children}</View>
  );
  const MockText = ({ children, ...props }: any) => (
    <Text {...props}>{children}</Text>
  );
  return {
    __esModule: true,
    default: MockSvgComponent,
    Svg: MockSvgComponent,
    Line: MockSvgComponent,
    Rect: MockSvgComponent,
    Text: MockText,
    TSpan: MockText,
  };
});

jest.mock("@expo/vector-icons/Ionicons", () => {
  const { Text } = require("react-native");
  return ({ name, ...props }: any) => <Text {...props}>{name}</Text>;
});

jest.mock("../../components/PostItem", () => {
  const { View, Text } = require("react-native");
  return ({ post }: any) => (
    <View testID={`post-item-${post.id}`}>
      <Text>{post.title}</Text>
      <Text>{post.content}</Text>
    </View>
  );
});

// --- Test Setup ---

const mockSetUserType = jest.fn();
const mockSetUsername = jest.fn();

const renderWithAuth = (
  userType: "user" | "guest" | null = "user",
  username = "testuser"
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
      <ProfileScreen />
    </AuthContext.Provider>
  );
};

describe("ProfileScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default successful profile fetch
    (apiRequest as jest.Mock).mockImplementation((url) => {
      if (url.includes("/profile")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              biography: "Test Bio",
              photoUrl: "http://example.com/avatar.png",
            }),
        });
      }
      if (url.includes("/posts")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it("shows loading indicator initially", async () => {
    // Delay the response to check loading state
    (apiRequest as jest.Mock).mockImplementation(() => new Promise(() => {}));

    renderWithAuth();
    expect(screen.getByTestId("profile-loading-indicator")).toBeTruthy();
  });

  it("renders user profile data correctly", async () => {
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText("Hello, testuser")).toBeTruthy();
      expect(screen.getByText("Test Bio")).toBeTruthy();
      expect(screen.getByTestId("profile-avatar-image")).toBeTruthy();
    });
  });

  it("handles profile fetch error", async () => {
    (apiRequest as jest.Mock).mockImplementation((url) => {
      if (url.includes("/profile")) {
        return Promise.resolve({
          ok: false,
          status: 500,
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText("errorCouldNotFetchProfile")).toBeTruthy();
    });
  });

  it("redirects guest users to index", async () => {
    renderWithAuth("guest", "");

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [
          { name: "index", params: { error: "You need to sign up first!" } },
        ],
      });
    });
  });

  it("handles logout correctly", async () => {
    renderWithAuth();
    await waitFor(() =>
      expect(screen.getByTestId("settings-button")).toBeTruthy()
    );

    fireEvent.press(screen.getByTestId("settings-button"));
    await waitFor(() => {
      expect(screen.getByTestId("logout-button")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("logout-button"));

    await waitFor(() => {
      expect(clearSession).toHaveBeenCalled();
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        "password",
        "email",
      ]);
      expect(mockSetUserType).toHaveBeenCalledWith(null);
      expect(mockSetUsername).toHaveBeenCalledWith("");
      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: "index" }],
      });
    });
  });

  it("navigates to edit profile screen", async () => {
    renderWithAuth();
    await waitFor(() =>
      expect(screen.getByTestId("settings-button")).toBeTruthy()
    );

    fireEvent.press(screen.getByTestId("settings-button"));

    await waitFor(() =>
      expect(screen.getByTestId("edit-profile-button")).toBeTruthy()
    );

    fireEvent.press(screen.getByTestId("edit-profile-button"));
    expect(mockNavigate).toHaveBeenCalledWith("edit_profile");
  });

  it("opens feedback modal", async () => {
    renderWithAuth();
    await waitFor(() =>
      expect(screen.getByTestId("settings-button")).toBeTruthy()
    );

    fireEvent.press(screen.getByTestId("settings-button"));

    await waitFor(() =>
      expect(screen.getByTestId("feedback-button")).toBeTruthy()
    );

    fireEvent.press(screen.getByTestId("feedback-button"));

    await waitFor(() => {
      expect(screen.getByTestId("feedback-modal")).toBeTruthy();
    });
  });

  it("navigates to create post screen", async () => {
    renderWithAuth();
    await waitFor(() =>
      expect(screen.getByTestId("create-post-button")).toBeTruthy()
    );

    fireEvent.press(screen.getByTestId("create-post-button"));
    expect(mockNavigate).toHaveBeenCalledWith("create_post");
  });

  it("navigates to manage posts screen", async () => {
    renderWithAuth();
    await waitFor(() =>
      expect(screen.getByTestId("my-posts-button")).toBeTruthy()
    );

    fireEvent.press(screen.getByTestId("my-posts-button"));
    expect(mockNavigate).toHaveBeenCalledWith("posts");
  });

  it("opens impact modal and fetches data", async () => {
    (apiRequest as jest.Mock).mockImplementation((url) => {
      if (url.includes("/monthly")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { year: 2024, month: 1, totalWeight: 5000 },
              { year: 2024, month: 2, totalWeight: 7500 },
            ]),
        });
      }
      if (url.includes("/profile")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              biography: "Test Bio",
              photoUrl: "http://example.com/avatar.png",
            }),
        });
      }
      if (url.includes("/posts")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      if (url.includes("/badges")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithAuth();
    await waitFor(() =>
      expect(screen.getByTestId("show-impact-button")).toBeTruthy()
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("show-impact-button"));
    });

    await waitFor(() => {
      expect(screen.getByText("impactTitle")).toBeTruthy();
      // 5000 + 7500 = 12500g = 12.5kg
      expect(screen.getByText("Total Impact: 12.5")).toBeTruthy();
      expect(screen.getByTestId("bar-chart")).toBeTruthy();
    });
  });

  it("renders posts correctly", async () => {
    const mockPosts = [
      {
        postId: 1,
        creatorUsername: "testuser",
        content: "Post 1",
        likes: 0,
        comments: 0,
      },
      {
        postId: 2,
        creatorUsername: "testuser",
        content: "Post 2",
        likes: 5,
        comments: 2,
      },
    ];

    (apiRequest as jest.Mock).mockImplementation((url) => {
      if (url.includes("/posts")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPosts),
        });
      }
      if (url.includes("/profile")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              biography: "Test Bio",
              photoUrl: "http://example.com/avatar.png",
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId("post-item-1")).toBeTruthy();
      expect(screen.getByTestId("post-item-2")).toBeTruthy();
      expect(screen.getByText("Post 1")).toBeTruthy();
      expect(screen.getByText("Post 2")).toBeTruthy();
    });
  });

  it("displays badges when available", async () => {
    (apiRequest as jest.Mock).mockImplementation((url) => {
      if (url.includes("/badges")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { badgeName: "First Post" },
              { badgeName: "Eco Warrior" },
              { badgeName: "Recycler" },
            ]),
        });
      }
      if (url.includes("/profile")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              biography: "Test Bio",
              photoUrl: "http://example.com/avatar.png",
            }),
        });
      }
      if (url.includes("/posts")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText("badges")).toBeTruthy();
      expect(screen.getByLabelText("firstPost")).toBeTruthy();
      expect(screen.getByLabelText("ecoWarrior")).toBeTruthy();
      expect(screen.getByLabelText("recycler")).toBeTruthy();
    });
  });

  it("shows loading state for badges", async () => {
    (apiRequest as jest.Mock).mockImplementation((url) => {
      if (url.includes("/badges")) {
        return new Promise(() => {}); // Never resolves to keep loading state
      }
      if (url.includes("/profile")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              biography: "Test Bio",
              photoUrl: "http://example.com/avatar.png",
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText("loadingBadges")).toBeTruthy();
    });
  });

  it("shows no badges message when user has no badges", async () => {
    (apiRequest as jest.Mock).mockImplementation((url) => {
      if (url.includes("/badges")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      if (url.includes("/profile")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              biography: "Test Bio",
              photoUrl: "http://example.com/avatar.png",
            }),
        });
      }
      if (url.includes("/posts")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.queryByText("badges")).not.toBeTruthy();
    });
  });

  it("handles badge fetch error gracefully", async () => {
    (apiRequest as jest.Mock).mockImplementation((url) => {
      if (url.includes("/badges")) {
        return Promise.resolve({
          ok: false,
          status: 500,
        });
      }
      if (url.includes("/profile")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              biography: "Test Bio",
              photoUrl: "http://example.com/avatar.png",
            }),
        });
      }
      if (url.includes("/posts")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithAuth();

    await waitFor(() => {
      // When badges fail to load, the no badges message should be shown
      expect(screen.queryByText("badges")).not.toBeTruthy();
    });
  });

  it("fetches followers list when followers button is pressed", async () => {
    (apiRequest as jest.Mock).mockImplementation((url) => {
      if (url.includes("/profile")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              biography: "Test Bio",
              photoUrl: "http://example.com/avatar.png",
              followersCount: 5,
              followingCount: 3,
            }),
        });
      }
      if (url.includes("/followers")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { username: "follower1", photoUrl: null },
              {
                username: "follower2",
                photoUrl: "http://example.com/photo.png",
              },
            ]),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText("followers")).toBeTruthy();
    });

    const followersButton = screen.getAllByText("followers")[0];
    fireEvent.press(followersButton.parent!);

    await waitFor(() => {
      expect(screen.getByText("follower1")).toBeTruthy();
      expect(screen.getByText("follower2")).toBeTruthy();
    });
  });

  it("shows error when followers fetch fails", async () => {
    (apiRequest as jest.Mock).mockImplementation((url) => {
      if (url.includes("/profile")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              biography: "Test Bio",
              photoUrl: "http://example.com/avatar.png",
              followersCount: 5,
            }),
        });
      }
      if (url.includes("/followers")) {
        return Promise.resolve({
          ok: false,
          status: 500,
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText("followers")).toBeTruthy();
    });

    const followersButton = screen.getAllByText("followers")[0];
    fireEvent.press(followersButton.parent!);

    await waitFor(() => {
      expect(screen.getByText("followersLoadError")).toBeTruthy();
    });
  });

  it("fetches following list when following button is pressed", async () => {
    (apiRequest as jest.Mock).mockImplementation((url) => {
      if (url.includes("/profile")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              biography: "Test Bio",
              photoUrl: "http://example.com/avatar.png",
              followersCount: 5,
              followingCount: 3,
            }),
        });
      }
      if (url.includes("/followings")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { username: "following1", photoUrl: null },
              {
                username: "following2",
                photoUrl: "http://example.com/photo.png",
              },
            ]),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText("following")).toBeTruthy();
    });

    const followingButton = screen.getAllByText("following")[0];
    fireEvent.press(followingButton.parent!);

    await waitFor(() => {
      expect(screen.getByText("following1")).toBeTruthy();
      expect(screen.getByText("following2")).toBeTruthy();
    });
  });

  it("shows error when following fetch fails", async () => {
    (apiRequest as jest.Mock).mockImplementation((url) => {
      if (url.includes("/profile")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              biography: "Test Bio",
              photoUrl: "http://example.com/avatar.png",
              followingCount: 3,
            }),
        });
      }
      if (url.includes("/followings")) {
        return Promise.resolve({
          ok: false,
          status: 500,
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText("following")).toBeTruthy();
    });

    const followingButton = screen.getAllByText("following")[0];
    fireEvent.press(followingButton.parent!);

    await waitFor(() => {
      expect(screen.getByText("followingLoadError")).toBeTruthy();
    });
  });

  it("shows no followers message when followers list is empty", async () => {
    (apiRequest as jest.Mock).mockImplementation((url) => {
      if (url.includes("/profile")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              biography: "Test Bio",
              photoUrl: "http://example.com/avatar.png",
              followersCount: 0,
            }),
        });
      }
      if (url.includes("/followers")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText("followers")).toBeTruthy();
    });

    const followersButton = screen.getAllByText("followers")[0];
    fireEvent.press(followersButton.parent!);

    await waitFor(() => {
      expect(screen.getByText("noFollowers")).toBeTruthy();
    });
  });

  it("shows not following anyone message when following list is empty", async () => {
    (apiRequest as jest.Mock).mockImplementation((url) => {
      if (url.includes("/profile")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              biography: "Test Bio",
              photoUrl: "http://example.com/avatar.png",
              followingCount: 0,
            }),
        });
      }
      if (url.includes("/followings")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText("following")).toBeTruthy();
    });

    const followingButton = screen.getAllByText("following")[0];
    fireEvent.press(followingButton.parent!);

    await waitFor(() => {
      expect(screen.getByText("notFollowingAnyone")).toBeTruthy();
    });
  });
});
