import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  useColorScheme,
  Text,
} from "react-native";
import AccessibleText from "@/components/AccessibleText";
import { useTranslation } from "react-i18next";
import { submitFeedback } from "@/app/services/apiClient";

// Backend constraint: content_type IN ('Suggestion', 'Compliment', 'Complaint')
type FeedbackType = "Suggestion" | "Compliment" | "Complaint";

const FEEDBACK_OPTIONS: { value: FeedbackType; labelKey: string; fallback: string }[] =
  [
    { value: "Suggestion", labelKey: "feedbackTypeSuggestion", fallback: "Suggestion" },
    { value: "Compliment", labelKey: "feedbackTypeCompliment", fallback: "Compliment" },
    { value: "Complaint", labelKey: "feedbackTypeComplaint", fallback: "Complaint" },
  ];

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  username: string | null;
  surfaceColor: string;
  textColor: string;
}

export function FeedbackModal({
  visible,
  onClose,
  username,
  surfaceColor,
  textColor,
}: FeedbackModalProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const borderColor = colorScheme === "dark" ? "#3A3A3C" : "#E4E4E7";
  const pillBg = colorScheme === "dark" ? "#1F1F22" : "#F5F6F8";
  const pillSelectedBg = colorScheme === "dark" ? "#2C2C2E" : "#E1E4EA";
  const pillSelectedBorder = colorScheme === "dark" ? "#F2F2F7" : "#5D5D63";
  const pillText = colorScheme === "dark" ? "#ECECEC" : "#1C1C1E";
  const pillSelectedText = colorScheme === "dark" ? "#FFFFFF" : "#141417";

  const [details, setDetails] = useState("");
  const [selectedType, setSelectedType] = useState<FeedbackType>("Suggestion");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setDetails("");
      setSelectedType("Suggestion");
      setSubmitting(false);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!username) {
      Alert.alert(
        t("error", { defaultValue: "Error" }),
        t("feedbackLoginRequired", {
          defaultValue: "Please log in to send feedback.",
        })
      );
      return;
    }
    if (!details.trim()) {
      Alert.alert(
        t("error", { defaultValue: "Error" }),
        t("feedbackDetailsRequired", {
          defaultValue: "Please enter a short description.",
        })
      );
      return;
    }
    setSubmitting(true);
    try {
      await submitFeedback({
        feedbackerUsername: username,
        contentType: selectedType,
        content: details.trim(),
      });
      Alert.alert(
        t("feedbackSentTitle", { defaultValue: "Feedback sent" }),
        t("feedbackSentMessage", {
          defaultValue: "Thanks for sharing your feedback with us.",
        }),
        [{ text: t("close", { defaultValue: "Close" }), onPress: onClose }]
      );
    } catch (e) {
      Alert.alert(
        t("error", { defaultValue: "Error" }),
        t("feedbackSubmitFailed", {
          defaultValue: "Could not send feedback. Please try again later.",
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.headerRow}>
            <AccessibleText
              backgroundColor={surfaceColor}
              style={[styles.title, { color: textColor }]}
            >
              {t("sendFeedback")}
            </AccessibleText>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={{ color: textColor, fontSize: 16 }}>×</Text>
            </TouchableOpacity>
          </View>

          <AccessibleText
            backgroundColor={surfaceColor}
            style={[styles.label, { color: textColor }]}
          >
            {t("feedbackTypeLabel", { defaultValue: "Type" })}
          </AccessibleText>
          <View style={styles.pillRow}>
            {FEEDBACK_OPTIONS.map((opt) => {
              const selected = selectedType === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: selected ? pillSelectedBg : pillBg,
                      borderColor: selected ? pillSelectedBorder : borderColor,
                    },
                  ]}
                  onPress={() => setSelectedType(opt.value)}
                >
                  <Text style={{ color: selected ? pillSelectedText : pillText, fontWeight: "600" }}>
                    {t(opt.labelKey, { defaultValue: opt.fallback })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <AccessibleText
            backgroundColor={surfaceColor}
            style={[styles.label, { color: textColor }]}
          >
            {t("feedbackDetailsLabel", { defaultValue: "Your message" })}
          </AccessibleText>
          <TextInput
            style={[
              styles.input,
              {
                borderColor,
                color: textColor,
                backgroundColor: colorScheme === "dark" ? "#1F1F22" : "#FFFFFF",
              },
            ]}
            multiline
            numberOfLines={4}
            value={details}
            onChangeText={setDetails}
            placeholder={t("feedbackPlaceholder", {
              defaultValue: "Tell us what you like or what we should improve.",
            })}
            placeholderTextColor={colorScheme === "dark" ? "#8E8E93" : "#A0A0A0"}
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: colorScheme === "dark" ? "#0A84FF" : "#2196F3",
                opacity: submitting ? 0.8 : 1,
              },
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>
                {t("feedbackSubmit", { defaultValue: "Send feedback" })}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 18, fontWeight: "700" },
  label: { fontSize: 14, fontWeight: "600" },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    minHeight: 90,
    textAlignVertical: "top",
    fontSize: 14,
  },
  submitButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});

export default FeedbackModal;
