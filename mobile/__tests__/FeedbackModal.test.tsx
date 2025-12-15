import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import FeedbackModal from "../components/FeedbackModal";
import { submitFeedback } from "../app/services/apiClient";
import { useTranslation } from "react-i18next";

jest.mock("../app/services/apiClient", () => ({
  submitFeedback: jest.fn(),
}));

const en = require("../app/locales/en.json");
const tr = require("../app/locales/tr.json");

jest.mock("react-i18next", () => ({
  useTranslation: jest.fn(),
  initReactI18next: {
    type: "3rdParty",
    init: jest.fn(),
  },
}));

// Make Modal render its children in tests
jest.mock("react-native/Libraries/Modal/Modal", () => {
  const React = require("react");
  const { View } = require("react-native");
  return ({ children, visible, ...rest }: any) =>
    visible ? (
      <View {...rest} testID="mock-modal">
        {children}
      </View>
    ) : null;
});

describe("FeedbackModal", () => {
  let alertSpy: jest.SpyInstance;
  let currentLanguage = "en";

  const renderModal = (override?: Partial<React.ComponentProps<typeof FeedbackModal>>) => {
    return render(
      <FeedbackModal
        visible
        onClose={jest.fn()}
        username="tester"
        surfaceColor="#fff"
        textColor="#000"
        {...override}
      />
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    currentLanguage = "en";

    (useTranslation as jest.Mock).mockImplementation(() => ({
      t: (key: string, options?: any) => {
        const langData = currentLanguage === "en" ? en.translation : tr.translation;
        let value = langData?.[key];
        if (!value && options?.defaultValue) return options.defaultValue;
        if (!value) return key;

        if (options) {
          Object.keys(options).forEach((k) => {
            if (typeof options[k] === "string" || typeof options[k] === "number") {
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
        },
      },
    }));

    alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy?.mockRestore();
  });

  it("asks the user to log in before submitting feedback", () => {
    const onClose = jest.fn();
    const { getByText } = renderModal({ username: null, onClose });

    fireEvent.press(getByText(en.translation.feedbackSubmit));

    expect(submitFeedback).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      expect.stringMatching(/Error/i),
      expect.stringContaining("log in")
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("requires a message before attempting submission", () => {
    const { getByText } = renderModal();

    fireEvent.press(getByText(en.translation.feedbackSubmit));

    expect(submitFeedback).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      expect.stringMatching(/Error/i),
      expect.stringContaining("short description")
    );
  });

  it("submits feedback with the chosen type and resets after closing", async () => {
    (submitFeedback as jest.Mock).mockResolvedValueOnce(undefined);
    const onClose = jest.fn();
    const { getByText, getByPlaceholderText, rerender } = renderModal({ onClose });

    fireEvent.press(getByText("Complaint"));

    const input = getByPlaceholderText(en.translation.feedbackPlaceholder);
    fireEvent.changeText(input, "  Love the new profile page  ");

    fireEvent.press(getByText(en.translation.feedbackSubmit));

    await waitFor(() =>
      expect(submitFeedback).toHaveBeenCalledWith({
        feedbackerUsername: "tester",
        contentType: "Complaint",
        content: "Love the new profile page",
      })
    );

    expect(Alert.alert).toHaveBeenCalledWith(
      expect.stringMatching(/Feedback sent/i),
      expect.any(String),
      expect.arrayContaining([expect.objectContaining({ onPress: expect.any(Function) })])
    );

    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    await act(async () => {
      buttons?.[0]?.onPress?.();
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    await act(async () => {
      rerender(
        <FeedbackModal
          visible={false}
          onClose={onClose}
          username="tester"
          surfaceColor="#fff"
          textColor="#000"
        />
      );
    });

    await act(async () => {
      rerender(
        <FeedbackModal
          visible
          onClose={onClose}
          username="tester"
          surfaceColor="#fff"
          textColor="#000"
        />
      );
    });

    const resetInput = getByPlaceholderText(en.translation.feedbackPlaceholder);
    expect(resetInput.props.value).toBe("");
  });
});
