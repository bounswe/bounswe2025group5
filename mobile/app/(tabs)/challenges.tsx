import React, { useState, useEffect, useContext } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Platform,
  useColorScheme,
  TextInput,
  Text,
} from "react-native";

import { useAppColors } from "@/hooks/useAppColors";
import { useSwitchColors } from "@/utils/colorUtils";
import AccessibleText from '@/components/AccessibleText';
import { AuthContext } from "../_layout";
import { apiRequest } from "../services/apiClient";
import { useTranslation } from "react-i18next";

const ADMIN_TYPE_PLACEHOLDER = "admin";

type Challenge = {
  challengeId: number;
  name: string;
  description: string;
  amount: number;
  currentAmount: number;
  startDate: string;
  endDate: string;
  status: string;
  type: string;
  userInChallenge: boolean;
};

type LeaderboardEntry = {
  userId: number;
  username: string;
  logAmount: number;
};

type ChallengeLogInfo = {
  amount: number;
  timestamp: string;
};

type ErrorState = {
  key: string | null;
  message: string | null;
};

export default function ChallengesScreen() {
  const { t, i18n } = useTranslation();
  const { userType, username } = useContext(AuthContext);
  const isAdmin = String(userType) === ADMIN_TYPE_PLACEHOLDER;

  // Use new global color system
  const colors = useAppColors();
  const switchColors = useSwitchColors();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);

  const isTurkish = (i18n.resolvedLanguage || i18n.language || "")
    .toLowerCase()
    .startsWith("tr");
  const toggleLanguage = (value: boolean) => {
    i18n.changeLanguage(value ? "tr-TR" : "en-US");
  };

  const [error, setError] = useState<ErrorState>({ key: null, message: null });
  const [showAttendedOnly, setShowAttendedOnly] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [expanded, setExpanded] = useState<number[]>([]);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(false);

  const [lbError, setLbError] = useState<ErrorState>({
    key: null,
    message: null,
  });
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);

  // Create Challenge Modal states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [challengeName, setChallengeName] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [challengeAmount, setChallengeAmount] = useState("");
  const [challengeWasteType, setChallengeWasteType] = useState("Plastic");
  const [challengeDuration, setChallengeDuration] = useState("30");
  const [createError, setCreateError] = useState("");

  // Log Waste Modal states
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [currentChallengeId, setCurrentChallengeId] = useState<number | null>(
    null
  );
  const [logAmount, setLogAmount] = useState("");
  const [logError, setLogError] = useState("");
  const [logLoading, setLogLoading] = useState(false);

  // Show Logs Modal states
  const [logsModalVisible, setLogsModalVisible] = useState(false);
  const [challengeLogs, setChallengeLogs] = useState<ChallengeLogInfo[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError({ key: null, message: null });

    try {
      // Use username endpoint to get user-specific challenges
      const res = await apiRequest(`/api/challenges/${username}`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Server error: ${res.status}`);
      }
      const data: Challenge[] = await res.json();
      console.log("Fetched challenges:", data);
      setChallenges(data);
    } catch (err) {
      console.error(err);
      setError({
        key: "errorFailedToLoadChallenges",
        message: err instanceof Error ? err.message : t("unknownError"),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAttendLeave = async (challengeId: number, attend: boolean) => {
    setChallenges((prev) =>
      prev.map((ch) =>
        ch.challengeId === challengeId ? { ...ch, userInChallenge: attend } : ch
      )
    );
    try {
      if (!username) {
        throw new Error(t("usernameRequiredForAttendance"));
      }
      if (attend) {
        const res = await apiRequest(
          `/api/challenges/${challengeId}/attendees`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }),
          }
        );
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || `Server error: ${res.status}`);
        }
      } else {
        const res = await apiRequest(
          `/api/challenges/${challengeId}/attendees/${encodeURIComponent(
            username
          )}`,
          {
            method: "DELETE",
          }
        );
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || `Server error: ${res.status}`);
        }
      }
    } catch (err) {
      console.error(err);
      setError({
        key: "errorActionFailed",
        message: err instanceof Error ? err.message : t("unknownError"),
      });
      setChallenges((prev) =>
        prev.map((ch) =>
          ch.challengeId === challengeId
            ? { ...ch, userInChallenge: !attend }
            : ch
        )
      );
    }
  };

  const handleViewLeaderboard = async (challengeId: number) => {
    setLbLoading(true);
    setLbError({ key: null, message: null });
    try {
      const res = await apiRequest(
        `/api/challenges/${challengeId}/leaderboard`
      );
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Server error: ${res.status}`);
      }
      const data: LeaderboardEntry[] = await res.json();
      data.sort((a, b) => b.logAmount - a.logAmount);
      setLeaderboard(data);
      setLeaderboardVisible(true);
    } catch (err) {
      console.error(err);
      setLbError({
        key: "errorFailedToLoadLeaderboard",
        message: err instanceof Error ? err.message : t("unknownError"),
      });
    } finally {
      setLbLoading(false);
    }
  };

  const handleCreateChallenge = async () => {
    // Validate inputs
    if (!challengeName.trim()) {
      setCreateError(t("challengeNameRequired"));
      return;
    }
    if (!challengeDescription.trim()) {
      setCreateError(t("challengeDescRequired"));
      return;
    }
    if (
      !challengeAmount.trim() ||
      isNaN(parseFloat(challengeAmount)) ||
      parseFloat(challengeAmount) <= 0
    ) {
      setCreateError(t("validTargetAmountRequired"));
      return;
    }
    if (
      !challengeDuration.trim() ||
      isNaN(parseInt(challengeDuration)) ||
      parseInt(challengeDuration) <= 0
    ) {
      setCreateError(t("validDurationRequired"));
      return;
    }

    setLoading(true);
    setCreateError("");

    try {
      // Calculate start and end dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + parseInt(challengeDuration));

      const challengeData = {
        name: challengeName.trim(),
        description: challengeDescription.trim(),
        amount: parseFloat(challengeAmount),
        startDate: startDate.toISOString().split("T")[0], // Format: YYYY-MM-DD
        endDate: endDate.toISOString().split("T")[0], // Format: YYYY-MM-DD
        type: challengeWasteType.trim(),
      };

      const res = await apiRequest("/api/challenges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(challengeData),
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(
          `Failed to create challenge: ${res.status} ${errorData}`
        );
      }

      // Success - close modal and refresh challenges
      setCreateModalVisible(false);

      // Reset form
      setChallengeName("");
      setChallengeDescription("");
      setChallengeAmount("");
      setChallengeWasteType("Plastic");
      setChallengeDuration("30");

      // Refresh challenges list
      await fetchData();
    } catch (err) {
      console.error("Error creating challenge:", err);
      setCreateError(
        err instanceof Error ? err.message : t("failedToCreateChallenge")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogWaste = async () => {
    if (!currentChallengeId || !username) {
      setLogError(t("challengeOrUserMissing"));
      return;
    }

    if (
      !logAmount.trim() ||
      isNaN(parseFloat(logAmount)) ||
      parseFloat(logAmount) <= 0
    ) {
      setLogError(t("validAmountRequired"));
      return;
    }

    setLogLoading(true);
    setLogError("");

    try {
      const logData = {
        username: username,
        amount: parseFloat(logAmount),
      };

      const res = await apiRequest(
        `/api/challenges/${currentChallengeId}/log`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(logData),
        }
      );

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(`Failed to log waste: ${res.status} ${errorData}`);
      }

      // Success - close modal and refresh challenges
      setLogModalVisible(false);
      setLogAmount("");
      setCurrentChallengeId(null);

      // Refresh challenges list to update progress
      await fetchData();
    } catch (err) {
      console.error("Error logging waste:", err);
      setLogError(err instanceof Error ? err.message : t("failedToLogWaste"));
    } finally {
      setLogLoading(false);
    }
  };

  const handleShowLogs = async (challengeId: number) => {
    if (!username) {
      setLogsError(t("usernameRequiredForLogs"));
      return;
    }

    setLogsLoading(true);
    setLogsError("");

    try {
      const res = await apiRequest(
        `/api/challenges/${challengeId}/logs/${username}`
      );
      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(`Failed to fetch logs: ${res.status} ${errorData}`);
      }

      const data = await res.json();
      // Assuming the response structure contains logs array
      const logs = data.logs as ChallengeLogInfo[];
      setChallengeLogs(logs);
      setLogsModalVisible(true);
    } catch (err) {
      console.error("Error fetching logs:", err);
      setLogsError(err instanceof Error ? err.message : t("failedToFetchLogs"));
    } finally {
      setLogsLoading(false);
    }
  };

  const openLogModal = (challengeId: number) => {
    setCurrentChallengeId(challengeId);
    setLogAmount("");
    setLogError("");
    setLogModalVisible(true);
  };

  const toggleExpand = (id: number) => {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filtered = challenges.filter((ch) => {
    if (showActiveOnly && ch.status !== "Active") return false;
    if (showAttendedOnly && !ch.userInChallenge) return false;
    return true;
  });

  if (loading && challenges.length === 0) {
    return (
      <View
        style={[styles.center, { backgroundColor: colors.screenBackground }]}
      >
        <ActivityIndicator
          testID="full-screen-loading"
          size="large"
          color={colors.activityIndicator}
        />
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.screenBackground }]}
    >
      {/* Header to match Explore and WasteGoal */}
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <AccessibleText type="title">{t("challengesTitle")}</AccessibleText>
        </View>
        <View style={styles.languageToggleContainer}>
          <Text style={styles.languageLabel}>EN</Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isTurkish ? "#f5dd4b" : "#f4f4f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleLanguage}
            value={isTurkish}
          />
          <Text style={styles.languageLabel}>TR</Text>
        </View>
      </View>

      {/* Create Challenge Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => {
          setCreateModalVisible(true);
          setCreateError("");
        }}
      >
        <Text style={styles.buttonText}>{t("createChallenge")}</Text>
      </TouchableOpacity>

      {loading && (
        <ActivityIndicator
          style={styles.inlineSpinner}
          size="small"
          color={colors.activityIndicator}
        />
      )}

      {/* Render error using the key */}
      {(error.key || error.message) && !loading && (
        <AccessibleText
          type="default"
          style={[styles.error, { color: colors.error }]}
        >
          {error.key ? t(error.key) : error.message}
        </AccessibleText>
      )}

      <View style={styles.filterRow}>
        <View style={styles.switchRow}>
          <Switch
            testID="attended-only-switch"
            value={showAttendedOnly}
            onValueChange={setShowAttendedOnly}
            thumbColor={switchColors.thumbColor}
            trackColor={switchColors.trackColor}
          />
          <AccessibleText type="default" style={styles.switchLabel}>
            {t("attendedOnly")}
          </AccessibleText>
        </View>
        <View style={styles.switchRow}>
          <Switch
            testID="active-only-switch"
            value={showActiveOnly}
            onValueChange={setShowActiveOnly}
            thumbColor={switchColors.thumbColor}
            trackColor={switchColors.trackColor}
          />
          <AccessibleText type="default" style={styles.switchLabel}>
            {t("activeOnly")}
          </AccessibleText>
        </View>
      </View>

      <FlatList
        testID="challenges-list"
        data={filtered}
        keyExtractor={(item) => String(item.challengeId)}
        contentContainerStyle={styles.listContentContainer}
        renderItem={({ item }) => (
          <View
            style={[styles.card, { backgroundColor: colors.cardBackground }]}
          >
            <TouchableOpacity onPress={() => toggleExpand(item.challengeId)}>
              <View style={styles.cardHeader}>
                <AccessibleText type="subtitle" style={styles.cardTitle}>
                  {item.name}
                </AccessibleText>
                <AccessibleText
                  type="default"
                  style={[styles.cardDate, { color: colors.textSecondary }]}
                >
                  {item.startDate} – {item.endDate}
                </AccessibleText>
              </View>
            </TouchableOpacity>

            {expanded.includes(item.challengeId) && (
              <View
                style={[
                  styles.cardBody,
                  { borderTopColor: colors.borderColor },
                ]}
              >
                <AccessibleText type="default" style={styles.cardDescription}>
                  {item.description}
                </AccessibleText>
                <AccessibleText type="default" style={styles.cardInfo}>
                  {t("challengeAmountAndType", {
                    amount: item.amount,
                    wasteType: item.type,
                  })}
                </AccessibleText>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <AccessibleText
                      type="default"
                      style={[
                        styles.progressText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {t("progressText")}: {item.currentAmount?.toFixed(1) || 0}{" "}
                      / {item.amount} kg
                    </AccessibleText>
                    <AccessibleText
                      type="default"
                      style={[
                        styles.progressPercentage,
                        {
                          color: (() => {
                            const percentage =
                              ((item.currentAmount || 0) / item.amount) * 100;
                            if (percentage >= 100)
                              return colors.progressExcellent;
                            if (percentage >= 80) return colors.progressGood;
                            return colors.textSecondary;
                          })(),
                        },
                      ]}
                    >
                      {(
                        ((item.currentAmount || 0) / item.amount) *
                        100
                      ).toFixed(1)}
                      %{(item.currentAmount || 0) / item.amount >= 1 && " ✅"}
                    </AccessibleText>
                  </View>
                  <View
                    style={[
                      styles.progressBar,
                      { backgroundColor: colors.borderColor },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: (() => {
                            const percentage =
                              ((item.currentAmount || 0) / item.amount) * 100;
                            if (percentage >= 80)
                              return colors.progressExcellent;
                            if (percentage >= 60) return colors.progressGood;
                            if (percentage >= 40) return colors.progressFair;
                            if (percentage >= 20) return colors.progressCaution;
                            return colors.progressBad;
                          })(),
                          width: `${Math.min(
                            ((item.currentAmount || 0) / item.amount) * 100,
                            100
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                </View>

                {!isAdmin && item.status === "Active" && (
                  <View style={styles.buttonContainer}>
                    {/* Log Waste and Show Logs Buttons - Side by side above if user is attendee */}
                    {item.userInChallenge && (
                      <View style={styles.logButtonsRow}>
                        <TouchableOpacity
                          style={[
                            styles.logButton,
                            { backgroundColor: colors.buttonPrimary },
                          ]}
                          onPress={() => openLogModal(item.challengeId)}
                        >
                          <AccessibleText
                            type="defaultSemiBold"
                            style={[styles.buttonText, { color: "#FFFFFF" }]}
                          >
                            {t("addLog")}
                          </AccessibleText>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.logButton,
                            { backgroundColor: colors.buttonSecondary },
                          ]}
                          onPress={() => handleShowLogs(item.challengeId)}
                          disabled={logsLoading}
                        >
                          <AccessibleText
                            type="defaultSemiBold"
                            style={[styles.buttonText, { color: "#FFFFFF" }]}
                          >
                            {logsLoading ? t("loading") : t("showLogs")}
                          </AccessibleText>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Bottom Row - Attend/Leave and Leaderboard side by side */}
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        testID={`attend-leave-button-${item.challengeId}`}
                        style={[
                          styles.sideButton,
                          item.userInChallenge
                            ? { backgroundColor: colors.buttonWarning }
                            : { backgroundColor: colors.buttonSecondary },
                        ]}
                        onPress={() =>
                          handleAttendLeave(
                            item.challengeId,
                            !item.userInChallenge
                          )
                        }
                      >
                        <AccessibleText
                          type="defaultSemiBold"
                          style={[styles.buttonText, { color: "#FFFFFF" }]}
                        >
                          {item.userInChallenge
                            ? t("leaveChallenge")
                            : t("attendChallenge")}
                        </AccessibleText>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.sideButton,
                          { backgroundColor: colors.buttonSecondary },
                        ]}
                        testID={`view-leaderboard-button-${item.challengeId}`}
                        onPress={() => handleViewLeaderboard(item.challengeId)}
                      >
                        <AccessibleText
                          type="defaultSemiBold"
                          style={[styles.buttonText, { color: "#FFFFFF" }]}
                        >
                          {t("viewLeaderboard")}
                        </AccessibleText>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {isAdmin && (
                  <TouchableOpacity
                    style={styles.dangerButton}
                    onPress={() => {
                      /* TODO: end challenge */
                    }}
                  >
                    <AccessibleText
                      type="defaultSemiBold"
                      style={styles.buttonText}
                    >
                      {t("endChallenge")}
                    </AccessibleText>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          !loading && !error.key ? (
            <View style={styles.emptyListContainer}>
              <AccessibleText>{t("noChallengesMatchFilters")}</AccessibleText>
            </View>
          ) : null
        }
      />

      <Modal
        visible={leaderboardVisible}
        testID="leaderboard-modal"
        animationType="slide"
        transparent
      >
        <View style={styles.lbOverlay}>
          <View
            style={[
              styles.lbContainer,
              { backgroundColor: colors.modalBackground },
            ]}
          >
            <AccessibleText type="title" style={styles.lbTitle}>
              {t("leaderboardTitle")}
            </AccessibleText>
            {lbLoading ? (
              <View style={styles.center}>
                <ActivityIndicator
                  testID="inline-loading"
                  size="large"
                  color={colors.activityIndicator}
                />
              </View>
            ) : lbError.key || lbError.message ? (
              <AccessibleText
                type="default"
                style={[styles.error, { color: colors.error }]}
              >
                {lbError.key ? t(lbError.key) : lbError.message}
              </AccessibleText>
            ) : (
              <>
                <View
                  style={[
                    styles.lbHeaderRow,
                    { borderBottomColor: colors.borderColor },
                  ]}
                >
                  <AccessibleText
                    type="defaultSemiBold"
                    style={styles.lbHeaderCell}
                  >
                    {t("username")}
                  </AccessibleText>
                  <AccessibleText
                    type="defaultSemiBold"
                    style={styles.lbHeaderCell}
                  >
                    {t("remaining")}
                  </AccessibleText>
                </View>
                <FlatList
                  data={leaderboard}
                  keyExtractor={(item) => String(item.userId)}
                  renderItem={({ item, index }) => (
                    <View
                      style={[
                        styles.lbRow,
                        { borderBottomColor: colors.borderColor },
                      ]}
                    >
                      <AccessibleText type="defaultSemiBold" style={styles.lbCell}>
                        {index + 1}. {item.username}
                      </AccessibleText>
                      <AccessibleText type="default" style={styles.lbCell}>
                        {item.logAmount} kg
                      </AccessibleText>
                    </View>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyListContainer}>
                      <AccessibleText>{t("leaderboardEmpty")}</AccessibleText>
                    </View>
                  }
                />
              </>
            )}
            <TouchableOpacity
              style={styles.lbCloseButton}
              testID="leaderboard-close-button"
              onPress={() => setLeaderboardVisible(false)}
            >
              <AccessibleText type="defaultSemiBold">{t("close")}</AccessibleText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Challenge Modal */}
      <Modal
        visible={createModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setCreateModalVisible(false);
          setCreateError("");
        }}
      >
        <View style={styles.lbOverlay}>
          <View
            style={[
              styles.lbContainer,
              { backgroundColor: colors.modalBackground },
            ]}
          >
            <AccessibleText type="title" style={styles.lbTitle}>
              {t("createNewChallengeModal")}
            </AccessibleText>

            <AccessibleText style={styles.inputLabel}>
              {t("challengeNameLabel")}
            </AccessibleText>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.borderColor,
                  color: colors.text,
                  backgroundColor: colors.inputBackground,
                },
              ]}
              value={challengeName}
              onChangeText={setChallengeName}
              placeholder={t("challengeNamePlaceholder")}
              placeholderTextColor={colors.textSubtle}
            />

            <AccessibleText style={styles.inputLabel}>
              {t("descriptionLabel")}
            </AccessibleText>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  borderColor: colors.borderColor,
                  color: colors.text,
                  backgroundColor: colors.inputBackground,
                },
              ]}
              value={challengeDescription}
              onChangeText={setChallengeDescription}
              placeholder={t("challengeDescriptionPlaceholder")}
              placeholderTextColor={colors.textSubtle}
              multiline
              numberOfLines={3}
            />

            <AccessibleText style={styles.inputLabel}>
              {t("wasteTypeLabel")}
            </AccessibleText>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.borderColor,
                  color: colors.text,
                  backgroundColor: colors.inputBackground,
                },
              ]}
              value={challengeWasteType}
              onChangeText={setChallengeWasteType}
              placeholder={t("wasteTypePlaceholder")}
              placeholderTextColor={colors.textSubtle}
            />

            <AccessibleText style={styles.inputLabel}>
              {t("targetAmountLabel")}
            </AccessibleText>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.borderColor,
                  color: colors.text,
                  backgroundColor: colors.inputBackground,
                },
              ]}
              value={challengeAmount}
              onChangeText={setChallengeAmount}
              placeholder={t("targetAmountPlaceholder")}
              placeholderTextColor={colors.textSubtle}
              keyboardType="numeric"
            />

            <AccessibleText style={styles.inputLabel}>
              {t("durationLabel")}
            </AccessibleText>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.borderColor,
                  color: colors.text,
                  backgroundColor: colors.inputBackground,
                },
              ]}
              value={challengeDuration}
              onChangeText={setChallengeDuration}
              placeholder={t("durationDaysPlaceholder")}
              placeholderTextColor={colors.textSubtle}
              keyboardType="numeric"
            />

            {createError ? (
              <AccessibleText style={[styles.error, { color: colors.error }]}>
                {createError}
              </AccessibleText>
            ) : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setCreateModalVisible(false);
                  setCreateError("");
                  // Reset form
                  setChallengeName("");
                  setChallengeDescription("");
                  setChallengeAmount("");
                  setChallengeWasteType("Plastic");
                  setChallengeDuration("30");
                }}
              >
                <Text style={styles.buttonText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCreateButton]}
                onPress={handleCreateChallenge}
                disabled={
                  !challengeName.trim() ||
                  !challengeDescription.trim() ||
                  loading
                }
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>
                    {t("createChallengeButton")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Log Waste Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={logModalVisible}
        onRequestClose={() => setLogModalVisible(false)}
      >
        <View style={styles.lbOverlay}>
          <View
            style={[
              styles.lbContainer,
              { backgroundColor: colors.modalBackground },
            ]}
          >
            <AccessibleText
              type="title"
              style={[styles.lbTitle, { color: colors.text }]}
            >
              {t("logWaste")}
            </AccessibleText>

            {logError && (
              <AccessibleText style={[styles.error, { color: "#FF6B6B" }]}>
                {logError}
              </AccessibleText>
            )}

            <AccessibleText style={styles.inputLabel}>
              {t("amountKgLabel")}
            </AccessibleText>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.borderColor,
                  color: colors.text,
                  backgroundColor: colors.inputBackground,
                },
              ]}
              value={logAmount}
              onChangeText={setLogAmount}
              placeholder={t("enterAmountPlaceholder")}
              placeholderTextColor={colors.textSubtle}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setLogModalVisible(false)}
                disabled={logLoading}
              >
                <Text style={styles.buttonText}>{t("cancel")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalCreateButton]}
                onPress={handleLogWaste}
                disabled={logLoading}
              >
                {logLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>{t("logWaste")}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Show Logs Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={logsModalVisible}
        onRequestClose={() => setLogsModalVisible(false)}
      >
        <View style={styles.lbOverlay}>
          <View
            style={[
              styles.lbContainer,
              { backgroundColor: colors.modalBackground },
            ]}
          >
            <AccessibleText
              type="title"
              style={[styles.lbTitle, { color: colors.text }]}
            >
              {t("challengeLogs")}
            </AccessibleText>

            {logsError && (
              <AccessibleText style={[styles.error, { color: "#FF6B6B" }]}>
                {logsError}
              </AccessibleText>
            )}

            {logsLoading ? (
              <ActivityIndicator
                size="large"
                color={colors.activityIndicator}
              />
            ) : (
              <FlatList
                data={challengeLogs}
                keyExtractor={(item, index) => index.toString()}
                showsVerticalScrollIndicator={true}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.logItem,
                      { borderBottomColor: colors.borderColor },
                    ]}
                  >
                    <View style={styles.logHeader}>
                      <AccessibleText
                        style={[styles.logAmount, { color: colors.text }]}
                      >
                        {item.amount} kg
                      </AccessibleText>
                      <AccessibleText
                        style={[
                          styles.logDate,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {new Date(item.timestamp).toLocaleDateString(
                          i18n.language === "tr" ? "tr-TR" : "en-US"
                        )}{" "}
                        {new Date(item.timestamp).toLocaleTimeString(
                          i18n.language === "tr" ? "tr-TR" : "en-US"
                        )}
                      </AccessibleText>
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyListContainer}>
                    <AccessibleText style={{ color: colors.textSecondary }}>
                      {t("noLogsFound")}
                    </AccessibleText>
                  </View>
                }
              />
            )}

            <TouchableOpacity
              style={[
                styles.lbCloseButton,
                { backgroundColor: colors.buttonSecondary },
              ]}
              onPress={() => setLogsModalVisible(false)}
            >
              <AccessibleText style={[styles.buttonText, { color: "#FFFFFF" }]}>
                {t("close")}
              </AccessibleText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    paddingHorizontal: 16,
    marginTop: 48,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleContainer: {
    flex: 1,
  },
  languageToggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(128,128,128,0.2)",
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  languageLabel: {
    color: "#888",
    fontWeight: "bold",
    marginHorizontal: 6,
    fontSize: 12,
  },
  listContentContainer: { paddingHorizontal: 16, paddingBottom: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  inlineSpinner: { alignSelf: "center", marginVertical: 8 },
  error: { textAlign: "center", marginBottom: 12, marginHorizontal: 16 },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  switchRow: { flexDirection: "row", alignItems: "center" },
  switchLabel: { marginLeft: 8, fontSize: 14 },
  card: {
    borderRadius: 8,
    padding: 16,
    marginVertical: 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cardHeader: { marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: "600" },
  cardDate: { fontSize: 12 },
  cardBody: { borderTopWidth: 1, paddingTop: 12 },
  cardDescription: { fontSize: 14, marginBottom: 8 },
  cardInfo: { fontSize: 14, marginBottom: 12 },
  dangerButton: {
    backgroundColor: "#E53935",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 8,
  },
  secondaryButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 8,
  },
  warningButton: {
    backgroundColor: "#FF9800",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 8,
  },
  buttonText: { fontSize: 14, color: "#FFF", fontWeight: "500" },
  createButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 80,
    marginBottom: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  lbOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  lbContainer: {
    padding: 16,
    borderRadius: 12,
    maxHeight: "60%",
    width: "90%",
    maxWidth: 400,
  },
  lbTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  lbHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  lbHeaderCell: {
    fontSize: 14,
    flex: 1,
    textAlign: "center",
    fontWeight: "600",
  },
  lbCell: {
    fontSize: 14,
    flex: 1,
    textAlign: "center",
  },
  lbRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  lbCloseButton: { marginTop: 16, paddingVertical: 10, alignItems: "center" },
  emptyListContainer: { alignItems: "center", marginTop: 20, padding: 16 },
  // Create Challenge Modal styles
  inputLabel: {
    fontSize: 16,
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginBottom: 18,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 10,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButton: {
    backgroundColor: "#757575",
  },
  modalCreateButton: {
    backgroundColor: "#4CAF50",
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  logButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  progressContainer: {
    marginTop: 12,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "500",
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  buttonContainer: {
    marginTop: 12,
  },
  sideButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logButtonsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  logItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  logDate: {
    fontSize: 12,
    fontStyle: "italic",
  },
});
