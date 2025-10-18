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
import { ThemedText } from "@/components/ThemedText";
import { AuthContext } from "../_layout";
import { apiRequest } from "../services/apiClient";

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
  remainingAmount: number;
};

export default function ChallengesScreen() {
  const { userType, username } = useContext(AuthContext);
  const isAdmin = String(userType) === ADMIN_TYPE_PLACEHOLDER;

  // Use new global color system
  const colors = useAppColors();
  const switchColors = useSwitchColors();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAttendedOnly, setShowAttendedOnly] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [expanded, setExpanded] = useState<number[]>([]);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(false);
  const [lbError, setLbError] = useState("");
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

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // Use username endpoint to get user-specific challenges
      const res = await apiRequest(`/api/challenges/${username}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data: Challenge[] = await res.json();
      console.log("Fetched challenges:", data);
      setChallenges(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load challenges");
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
        ch.challengeId === challengeId
          ? { ...ch, isUserInChallenge: attend }
          : ch
      )
    );
    try {
      if (!username) {
        throw new Error("Username is required to manage challenge attendance");
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
        if (!res.ok) throw new Error(`Status ${res.status}`);
      } else {
        const res = await apiRequest(
          `/api/challenges/${challengeId}/attendees/${encodeURIComponent(
            username
          )}`,
          {
            method: "DELETE",
          }
        );
        if (!res.ok) throw new Error(`Status ${res.status}`);
      }
    } catch (err) {
      console.error(err);
      setError("Action failed");
      setChallenges((prev) =>
        prev.map((ch) =>
          ch.challengeId === challengeId ? { ...ch, attendee: !attend } : ch
        )
      );
    }
  };

  const handleViewLeaderboard = async (challengeId: number) => {
    setLbLoading(true);
    setLbError("");
    try {
      const res = await apiRequest(
        `/api/challenges/${challengeId}/leaderboard`
      );
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data: LeaderboardEntry[] = await res.json();
      data.sort((a, b) => b.remainingAmount - a.remainingAmount);
      setLeaderboard(data);
      setLeaderboardVisible(true);
    } catch (err) {
      console.error(err);
      setLbError("Failed to load leaderboard");
    } finally {
      setLbLoading(false);
    }
  };

  const handleCreateChallenge = async () => {
    // Validate inputs
    if (!challengeName.trim()) {
      setCreateError("Challenge name is required");
      return;
    }
    if (!challengeDescription.trim()) {
      setCreateError("Challenge description is required");
      return;
    }
    if (
      !challengeAmount.trim() ||
      isNaN(parseFloat(challengeAmount)) ||
      parseFloat(challengeAmount) <= 0
    ) {
      setCreateError("Valid target amount is required");
      return;
    }
    if (
      !challengeDuration.trim() ||
      isNaN(parseInt(challengeDuration)) ||
      parseInt(challengeDuration) <= 0
    ) {
      setCreateError("Valid duration is required");
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
        err instanceof Error ? err.message : "Failed to create challenge"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogWaste = async () => {
    if (!currentChallengeId || !username) {
      setLogError("Challenge or user information is missing");
      return;
    }

    if (
      !logAmount.trim() ||
      isNaN(parseFloat(logAmount)) ||
      parseFloat(logAmount) <= 0
    ) {
      setLogError("Valid amount is required");
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
      setLogError(err instanceof Error ? err.message : "Failed to log waste");
    } finally {
      setLogLoading(false);
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
    // Full screen loading
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
        <ThemedText type="title">Challenges</ThemedText>
      </View>

      {/* Create Challenge Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => {
          setCreateModalVisible(true);
          setCreateError("");
        }}
      >
        <Text style={styles.buttonText}>Create New Challenge</Text>
      </TouchableOpacity>

      {loading && (
        <ActivityIndicator
          style={styles.inlineSpinner}
          size="small"
          color={colors.activityIndicator}
        />
      )}
      {error && (
        <ThemedText
          type="default"
          style={[styles.error, { color: colors.error }]}
        >
          {error}
        </ThemedText>
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
          <ThemedText type="default" style={styles.switchLabel}>
            Attended only
          </ThemedText>
        </View>
        <View style={styles.switchRow}>
          <Switch
            testID="active-only-switch"
            value={showActiveOnly}
            onValueChange={setShowActiveOnly}
            thumbColor={switchColors.thumbColor}
            trackColor={switchColors.trackColor}
          />
          <ThemedText type="default" style={styles.switchLabel}>
            Active only
          </ThemedText>
        </View>
      </View>

      <FlatList
        testID="challenges-list"
        data={filtered}
        keyExtractor={(item) => String(item.challengeId)}
        contentContainerStyle={styles.listContentContainer} // Adjusted for new padding structure
        renderItem={({ item }) => (
          <View
            style={[styles.card, { backgroundColor: colors.cardBackground }]}
          >
            <TouchableOpacity onPress={() => toggleExpand(item.challengeId)}>
              <View style={styles.cardHeader}>
                <ThemedText type="subtitle" style={styles.cardTitle}>
                  {item.name}
                </ThemedText>
                <ThemedText
                  type="default"
                  style={[styles.cardDate, { color: colors.textSecondary }]}
                >
                  {item.startDate} – {item.endDate}
                </ThemedText>
              </View>
            </TouchableOpacity>

            {expanded.includes(item.challengeId) && (
              <View
                style={[
                  styles.cardBody,
                  { borderTopColor: colors.borderColor },
                ]}
              >
                <ThemedText type="default" style={styles.cardDescription}>
                  {item.description}
                </ThemedText>
                <ThemedText type="default" style={styles.cardInfo}>
                  Amount: {item.amount} kg | Type: {item.type}
                </ThemedText>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <ThemedText
                      type="default"
                      style={[
                        styles.progressText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Progress: {item.currentAmount?.toFixed(1) || 0} /{" "}
                      {item.amount} kg
                    </ThemedText>
                    <ThemedText
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
                    </ThemedText>
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
                    {/* Log Waste Button - Full width above if user is attendee */}
                    {item.userInChallenge && (
                      <TouchableOpacity
                        style={[
                          styles.logButton,
                          { backgroundColor: colors.buttonPrimary },
                        ]}
                        onPress={() => openLogModal(item.challengeId)}
                      >
                        <ThemedText
                          type="defaultSemiBold"
                          style={[styles.buttonText, { color: "#FFFFFF" }]}
                        >
                          Log Waste
                        </ThemedText>
                      </TouchableOpacity>
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
                        <ThemedText
                          type="defaultSemiBold"
                          style={[styles.buttonText, { color: "#FFFFFF" }]}
                        >
                          {item.userInChallenge
                            ? "Leave Challenge"
                            : "Attend Challenge"}
                        </ThemedText>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.sideButton,
                          { backgroundColor: colors.buttonSecondary },
                        ]}
                        testID={`view-leaderboard-button-${item.challengeId}`}
                        onPress={() => handleViewLeaderboard(item.challengeId)}
                      >
                        <ThemedText
                          type="defaultSemiBold"
                          style={[styles.buttonText, { color: "#FFFFFF" }]}
                        >
                          View Leaderboard
                        </ThemedText>
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
                    <ThemedText
                      type="defaultSemiBold"
                      style={styles.buttonText}
                    >
                      End Challenge
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyListContainer}>
              <ThemedText>No challenges match your filters.</ThemedText>
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
            <ThemedText type="title" style={styles.lbTitle}>
              Leaderboard
            </ThemedText>
            {lbLoading ? (
              <View style={styles.center}>
                <ActivityIndicator
                  testID="inline-loading"
                  size="large"
                  color={colors.activityIndicator}
                />
              </View>
            ) : lbError ? (
              <ThemedText
                type="default"
                style={[styles.error, { color: colors.error }]}
              >
                {lbError}
              </ThemedText>
            ) : (
              <>
                <View
                  style={[
                    styles.lbHeaderRow,
                    { borderBottomColor: colors.borderColor },
                  ]}
                >
                  <ThemedText
                    type="defaultSemiBold"
                    style={styles.lbHeaderCell}
                  >
                    Username
                  </ThemedText>
                  <ThemedText
                    type="defaultSemiBold"
                    style={styles.lbHeaderCell}
                  >
                    Remaining
                  </ThemedText>
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
                      <ThemedText type="defaultSemiBold">
                        {index + 1}. {item.username}
                      </ThemedText>
                      <ThemedText type="default">
                        {item.remainingAmount}
                      </ThemedText>
                    </View>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyListContainer}>
                      <ThemedText>Leaderboard is empty.</ThemedText>
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
              <ThemedText type="defaultSemiBold">Close</ThemedText>
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
            <ThemedText type="title" style={styles.lbTitle}>
              Create New Challenge
            </ThemedText>

            <ThemedText style={styles.inputLabel}>Challenge Name</ThemedText>
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
              placeholder="e.g., Plastic Free Week"
              placeholderTextColor={colors.textSubtle}
            />

            <ThemedText style={styles.inputLabel}>Description</ThemedText>
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
              placeholder="Describe the challenge goals and rules"
              placeholderTextColor={colors.textSubtle}
              multiline
              numberOfLines={3}
            />

            <ThemedText style={styles.inputLabel}>Waste Type</ThemedText>
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
              placeholder="e.g., Plastic, Paper, Glass"
              placeholderTextColor={colors.textSubtle}
            />

            <ThemedText style={styles.inputLabel}>
              Target Amount (kg)
            </ThemedText>
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
              placeholder="e.g., 5.0"
              placeholderTextColor={colors.textSubtle}
              keyboardType="numeric"
            />

            <ThemedText style={styles.inputLabel}>Duration (days)</ThemedText>
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
              placeholder="e.g., 30"
              placeholderTextColor={colors.textSubtle}
              keyboardType="numeric"
            />

            {createError ? (
              <ThemedText style={[styles.error, { color: colors.error }]}>
                {createError}
              </ThemedText>
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
                <Text style={styles.buttonText}>Cancel</Text>
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
                  <Text style={styles.buttonText}>Create Challenge</Text>
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
            <ThemedText
              type="title"
              style={[styles.lbTitle, { color: colors.text }]}
            >
              Log Waste
            </ThemedText>

            {logError && (
              <ThemedText style={[styles.error, { color: "#FF6B6B" }]}>
                {logError}
              </ThemedText>
            )}

            <ThemedText style={styles.inputLabel}>Amount (kg)</ThemedText>
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
              placeholder="Enter waste amount in kg"
              placeholderTextColor={colors.textSubtle}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setLogModalVisible(false)}
                disabled={logLoading}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalCreateButton]}
                onPress={handleLogWaste}
                disabled={logLoading}
              >
                {logLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>Log Waste</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { paddingHorizontal: 16, marginTop: 48, marginBottom: 18 },
  listContentContainer: { paddingHorizontal: 16, paddingBottom: 100 },
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
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  lbContainer: {
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: "60%",
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
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
});
