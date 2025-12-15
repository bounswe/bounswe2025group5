// app/edit_profile.tsx
import React, { useState, useEffect, useContext, useLayoutEffect } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Image,
  ScrollView,
  Alert,
  Platform,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { Colors } from '@/constants/Colors';
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "./_layout";
import { apiRequest, clearSession, getAccessToken } from "./services/apiClient";
import { apiUrl } from "./apiConfig";

import * as FileSystem from "expo-file-system";

import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { Modal } from "react-native";

export const unstable_settings = {
  initialRouteName: "edit_profile",
};

export const options = {
  tabBarStyle: { display: "none" },
  tabBarButton: () => null,
  headerTitle: "Edit Profile",
};

type ErrorState = {
  key: string | null;
  message: string | null;
  resolved?: string | null;
};

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { username } = useContext(AuthContext);
  const colorScheme = useColorScheme();
  const { t, i18n } = useTranslation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("editProfileTitle"),
    });
  }, [navigation, i18n.language, t]);

  const isDarkMode = colorScheme === "dark";
  const theme = isDarkMode ? 'dark' : 'light';
  const screenBackgroundColor = isDarkMode ? "#151718" : "#F0F2F5";
  const inputBackgroundColor = isDarkMode ? "#1C1C1E" : "#FFFFFF";
  const inputBorderColor = isDarkMode ? "#3A3A3C" : "#ccc";
  const inputTextColor = isDarkMode ? "#E0E0E0" : "#000000";
  const placeholderTextColor = isDarkMode ? "#8E8E93" : "#A0A0A0";
  const avatarPlaceholderColor = isDarkMode ? "#5A5A5D" : "#999";
  const charCountColor = isDarkMode ? "#8E8E93" : "#666";
  const cancelButtonBgColor = isDarkMode ? "#3A3A3C" : "#ddd";
  const cancelButtonTextColor = isDarkMode ? "#E0E0E0" : "#333333";
  const iconColor = isDarkMode ? inputTextColor : "#555";
  const uploadButtonBgColor = isDarkMode ? "#0A84FF" : "#2196F3";

  const [bio, setBio] = useState("");
  const [avatarDisplayUrl, setAvatarDisplayUrl] = useState<string | null>(null);
  const [newAvatarAsset, setNewAvatarAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingBio, setSavingBio] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPasswordStrength, setNewPasswordStrength] = useState({ label: 'Very weak', color: '#D32F2F', score: 0 });

  const evaluatePasswordStrength = (value: string) => {
    const score =
      (value.length >= 8 ? 1 : 0) +
      (/[A-Z]/.test(value) ? 1 : 0) +
      (/[0-9]/.test(value) ? 1 : 0) +
      (/[^A-Za-z0-9]/.test(value) ? 1 : 0) +
      (value.length >= 12 ? 1 : 0);
    if (!value) return { label: 'Very weak', color: '#D32F2F', score: 0 };
    if (score <= 1) return { label: 'Very weak', color: '#D32F2F', score };
    if (score === 2) return { label: 'Weak', color: '#F44336', score };
    if (score === 3) return { label: 'Fair', color: '#FBC02D', score };
    if (score === 4) return { label: 'Good', color: '#66BB6A', score };
    return { label: 'Strong', color: '#2E7D32', score };
  };

  const [errState, setErrState] = useState<ErrorState>({
    key: null,
    message: null,
    resolved: null,
  });

  const resolveErrorText = (state: ErrorState) => {
    if (state.key) return t(state.key);
    if (state.message) return state.message;
    return t("errorGeneric");
  };

  const alertError = (state: ErrorState) => {
    const base = resolveErrorText(state);
    const raw = state.message && __DEV__ ? `\n\n${state.message}` : "";
    Alert.alert(t("error"), `${base}${raw}`);
  };

  useEffect(() => {
    (async () => {
      if (!username) {
        setLoadingProfile(false);
        return;
      }
      setLoadingProfile(true);
      setErrState({ key: null, message: null, resolved: null });
      try {
        const encodedUsername = encodeURIComponent(username);
        const response = await apiRequest(
          `/api/users/${encodedUsername}/profile?username=${encodedUsername}`
        );
        if (!response.ok) {
          const txt = await response.text().catch(() => "");
          throw new Error(`Server error: ${response.status} ${txt}`);
        }
        const data = await response.json();
        setBio(data?.biography ?? "");
        setAvatarDisplayUrl(data?.photoUrl ?? null);
      } catch (e) {
        console.error("Failed to load profile", e);
        const s: ErrorState =
          e instanceof Error && /Server error:\s*\d+/.test(e.message)
            ? { key: "errorProfileLoadFailed", message: e.message }
            : {
                key: "errorProfileLoadGeneric",
                message: e instanceof Error ? e.message : null,
              };
        setErrState({ ...s, resolved: resolveErrorText(s) });
        alertError(s);
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, [username]);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(t("permissionRequired"), t("allowPhotosAccessAvatar"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setNewAvatarAsset(result.assets[0]);
      setAvatarDisplayUrl(result.assets[0].uri);
    }
  };
  const handleUploadProfilePhoto = async () => {
    if (!newAvatarAsset) {
      Alert.alert(t("noNewPhoto"), t("selectPhotoFirst"));
      return;
    }
    if (!username) {
      const s = { key: "errorUserNotIdentified", message: null };
      setErrState({ ...s, resolved: resolveErrorText(s) });
      alertError(s);
      return;
    }

    setUploadingPhoto(true);
    setErrState({ key: null, message: null, resolved: null });

    try {
      const asset = newAvatarAsset;

      // iOS fix: convert ph:// to file:// so RN/fetch can read it
      const normalizeNativeUri = async (uri: string) => {
        if (Platform.OS !== "web" && uri.startsWith("ph://")) {
          const dest = `${FileSystem.cacheDirectory}upload-${Date.now()}.jpg`;
          await FileSystem.copyAsync({ from: uri, to: dest });
          return dest;
        }
        return uri;
      };

      const guessExt = (mime?: string) => mime?.split("/")[1] || "jpg";
      const type = asset.mimeType ?? "image/jpeg";
      const defaultName = `avatar-${username}.${guessExt(type)}`;

      const fd = new FormData();

      if (Platform.OS === "web") {
        // Web: turn the ImagePicker URI (blob/object URL) into a real File
        const resp = await fetch(asset.uri);
        const blob = await resp.blob();
        const webType = blob.type || type;
        const webName = asset.fileName ?? defaultName;
        const file = new File([blob], webName, { type: webType });
        fd.append("file", file);
      } else {
        // iOS/Android: append RN-style file descriptor
        const uri = await normalizeNativeUri(asset.uri);
        const name = asset.fileName ?? defaultName;
        fd.append("file", { uri, name, type } as any);
      }

      const token = await getAccessToken();
      const res = await fetch(
        apiUrl(`/api/users/${encodeURIComponent(username)}/profile/picture`),
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: fd,
        }
      );

      if (!res.ok) {
        const errorData = await res.text().catch(() => "");
        let raw = `Server error: ${res.status}`;
        try {
          const parsed = JSON.parse(errorData);
          if (parsed?.message || parsed?.error) {
            raw = `Server error: ${res.status} ${
              parsed.message || parsed.error
            }`;
          } else if (errorData) {
            raw = `Server error: ${res.status} ${errorData}`;
          }
        } catch {
          if (errorData) raw = `Server error: ${res.status} ${errorData}`;
        }
        throw new Error(raw);
      }

      const updatedProfileInfo = await res.json().catch(() => ({}));
      if (updatedProfileInfo && updatedProfileInfo.photoUrl) {
        setAvatarDisplayUrl(updatedProfileInfo.photoUrl);
      }
      setNewAvatarAsset(null);
      Alert.alert(t("success"), t("successPhotoUploaded"));
    } catch (e) {
      console.error("Photo upload error:", e);
      const s: ErrorState =
        e instanceof Error && /Server error:\s*\d+/.test(e.message)
          ? { key: "errorUploadPhotoFailed", message: e.message }
          : {
              key: "errorUploadPhotoGeneric",
              message: e instanceof Error ? e.message : null,
            };
      setErrState({ ...s, resolved: resolveErrorText(s) });
      alertError(s);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onSaveBio = async () => {
    if (!username) {
      const s = { key: "errorUserNotIdentified", message: null };
      setErrState({ ...s, resolved: resolveErrorText(s) });
      alertError(s);
      return;
    }
    setSavingBio(true);
    setErrState({ key: null, message: null, resolved: null });
    try {
      await apiRequest(`/api/users/${encodeURIComponent(username)}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, biography: bio }),
      });
      Alert.alert(t("success"), t("successBioUpdated"));
      // navigation.goBack(); // if desired, go back after saving bio
    } catch (e) {
      console.error("Bio update error:", e);
      const s: ErrorState =
        e instanceof Error && /Server error:\s*\d+/.test(e.message)
          ? { key: "errorBioUpdateFailed", message: e.message }
          : {
              key: "errorBioUpdateGeneric",
              message: e instanceof Error ? e.message : null,
            };
      setErrState({ ...s, resolved: resolveErrorText(s) });
      alertError(s);
    } finally {
      setSavingBio(false);
    }
  };

  const handleDeleteAccountButton = () => {
    setDeletePassword("");
    setDeleteModalVisible(true);
    setErrState({ key: null, message: null, resolved: null });
    setDeleteError(null);
    setIsDeletingAccount(false);
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setDeletePassword("");
    setErrState({ key: null, message: null, resolved: null });
    setDeleteError(null);
    setIsDeletingAccount(false);
  };

  const handleConfirmDelete = async () => {
    setDeleteError(null);
    if (!username) {
      setDeleteError(t("errorUserNotIdentified"));
      return;
    }
    setIsDeletingAccount(true);
    try {
      const encodedUsername = encodeURIComponent(username);
      const response = await apiRequest(`/api/users/${encodedUsername}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      if (response.ok) {
        setDeleteModalVisible(false);
        await clearSession();
        navigation.reset({ index: 0, routes: [{ name: "(tabs)" }] });
      } else if (response.status === 401) {
        setDeleteError(t("deleteAccountIncorrectPassword"));
      } else {
        setDeleteError(t("deleteAccountGenericError"));
      }
    } catch (error) {
      setDeleteError(t("deleteAccountGenericError"));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleResetPasswordButton = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setResetPasswordError(null);
    setNewPasswordStrength({ label: 'Very weak', color: '#D32F2F', score: 0 });
    setResetPasswordModalVisible(true);
  };

  const handleCancelResetPassword = () => {
    setResetPasswordModalVisible(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setResetPasswordError(null);
    setIsResettingPassword(false);
    setNewPasswordStrength({ label: 'Very weak', color: '#D32F2F', score: 0 });
  };

  const handleConfirmResetPassword = async () => {
    setResetPasswordError(null);

    if (!currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      setResetPasswordError(t("resetPasswordFieldsRequired"));
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setResetPasswordError(t("resetPasswordNewPasswordsDoNotMatch"));
      return;
    }

    if (newPasswordStrength.score <= 2) {
      setResetPasswordError(t("errorPasswordTooWeak"));
      return;
    }

    if (!username) {
      setResetPasswordError(t("errorUserNotIdentified"));
      return;
    }

    setIsResettingPassword(true);
    try {
      const response = await apiRequest(`/api/reset-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrUsername: username,
          oldPassword: currentPassword,
          newPassword: newPassword,
        }),
      });

      if (response.ok) {
        setResetPasswordModalVisible(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        Alert.alert(t("success"), t("resetPasswordSuccess"));
      } else if (response.status === 401) {
        setResetPasswordError(t("resetPasswordIncorrectPassword"));
      } else {
        setResetPasswordError(t("resetPasswordGenericError"));
      }
    } catch (error) {
      setResetPasswordError(t("resetPasswordGenericError"));
    } finally {
      setIsResettingPassword(false);
    }
  };

  const onCancel = () => navigation.goBack();

  if (loadingProfile) {
    return (
      <View
        style={[
          styles.container,
          {
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: screenBackgroundColor,
          },
        ]}
      >
        <ActivityIndicator size="large" color={isDarkMode ? "#FFF" : "#000"} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Scrollable content */}
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: screenBackgroundColor, paddingBottom: 100 },
        ]}
      >
        {(errState.key || errState.message) && (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: isDarkMode ? "#5D1F1A" : "#FFCDD2" },
            ]}
          >
            <Text
              style={[
                styles.errorBannerText,
                { color: isDarkMode ? "#FF9DA3" : "#C62828" },
              ]}
            >
              {t("error")}: {resolveErrorText(errState)}
            </Text>
          </View>
        )}

        <View style={styles.avatarContainer}>
          {avatarDisplayUrl ? (
            <Image source={{ uri: avatarDisplayUrl }} style={styles.avatar} />
          ) : (
            <Ionicons
              name="person-circle-outline"
              size={120}
              color={avatarPlaceholderColor}
            />
          )}
          <TouchableOpacity
            onPress={pickImage}
            style={styles.imagePickerButton}
            disabled={uploadingPhoto || savingBio}
          >
            <Ionicons name="camera-outline" size={24} color={iconColor} />
            <Text style={[styles.imagePickerText, { color: inputTextColor }]}>
              {avatarDisplayUrl ? t("changeAvatar") : t("selectAvatar")}
            </Text>
          </TouchableOpacity>

          {newAvatarAsset && (
            <TouchableOpacity
              style={[
                styles.uploadButton,
                { backgroundColor: uploadButtonBgColor },
                uploadingPhoto && styles.disabledButton,
              ]}
              onPress={handleUploadProfilePhoto}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.uploadButtonText}>{t("uploadPhoto")}</Text>
              )}
            </TouchableOpacity>
          )}
          <Text style={[styles.avatarNote, { color: placeholderTextColor }]}>
            {t("avatarSizeLimit")}
          </Text>
        </View>

        <TextInput
          style={[
            styles.bioInput,
            {
              borderColor: inputBorderColor,
              color: inputTextColor,
              backgroundColor: inputBackgroundColor,
            },
          ]}
          value={bio}
          onChangeText={setBio}
          placeholder={t("writeShortBio")}
          placeholderTextColor={placeholderTextColor}
          multiline
          maxLength={100}
          editable={!savingBio && !uploadingPhoto}
        />
        <Text style={[styles.charCount, { color: charCountColor }]}>
          {bio.length}/100
        </Text>

        {/* Save / Cancel Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.btn,
              styles.cancel,
              { backgroundColor: cancelButtonBgColor },
            ]}
            onPress={onCancel}
            disabled={savingBio || uploadingPhoto}
          >
            <Text style={[styles.btnText, { color: cancelButtonTextColor }]}>
              {t("cancel")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.btn,
              styles.save,
              (savingBio || uploadingPhoto) && styles.disabledButton,
            ]}
            onPress={onSaveBio}
            disabled={savingBio || uploadingPhoto}
          >
            {savingBio ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.btnText}>{t("saveBio")}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.deleteSection,
            {
              backgroundColor: isDarkMode ? "#1F1F22" : "#FFFFFF",
              borderColor: isDarkMode ? "#3A3A3C" : "#E0E0E0",
            },
          ]}
        >
          <Text
            style={[
              styles.deleteSectionTitle,
              { color: isDarkMode ? "#F5F5F7" : "#1C1C1E" },
            ]}
          >
            {t("resetPassword")}
          </Text>
          <Text
            style={[
              styles.deleteSectionSubtitle,
              { color: isDarkMode ? "#C8C8CC" : "#4B4B4F" },
            ]}
          >
            {t("resetPasswordDescription")}
          </Text>
          <TouchableOpacity
            style={[
              styles.deleteSectionButton,
              { backgroundColor: isDarkMode ? "#0A84FF" : "#2196F3" },
            ]}
            onPress={handleResetPasswordButton}
            disabled={savingBio || uploadingPhoto}
          >
            <Text style={styles.deleteSectionButtonText}>{t("resetPassword")}</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.deleteSection,
            {
              backgroundColor: isDarkMode ? "#1F1F22" : "#FFFFFF",
              borderColor: isDarkMode ? "#3A3A3C" : "#E0E0E0",
            },
          ]}
        >
          <Text
            style={[
              styles.deleteSectionTitle,
              { color: isDarkMode ? "#F5F5F7" : "#1C1C1E" },
            ]}
          >
            {t("deleteAccount")}
          </Text>
          <Text
            style={[
              styles.deleteSectionSubtitle,
              { color: isDarkMode ? "#C8C8CC" : "#4B4B4F" },
            ]}
          >
            {t("deleteAccountWarning", {
              defaultValue: "This will permanently delete your account.",
            })}
          </Text>
          <TouchableOpacity
            style={[
              styles.deleteSectionButton,
              { backgroundColor: isDarkMode ? "#C72C1C" : Colors[theme].error },
            ]}
            onPress={handleDeleteAccountButton}
            disabled={savingBio || uploadingPhoto}
          >
            <Text style={styles.deleteSectionButtonText}>{t("deleteAccount")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Delete confirmation modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.55)",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: isDarkMode ? "#1E1E1E" : "#fff",
              padding: 24,
              borderRadius: 16,
              width: "100%",
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 8,
                color: isDarkMode ? "#FFF" : "#000",
              }}
            >
              {t("deleteAccountModalTitle")}
            </Text>
            <Text
              style={{
                fontSize: 14,
                marginBottom: 16,
                color: isDarkMode ? "#D1D1D6" : "#4A4A4A",
              }}
            >
              {t("deleteAccountWarning", {
                defaultValue: "This will permanently delete your account.",
              })}
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: isDarkMode ? "#444" : "#CCC",
                backgroundColor: isDarkMode ? "#2A2A2A" : "#FFF",
                color: isDarkMode ? "#FFF" : "#000",
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
              }}
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder={t("deleteAccountPasswordPlaceholder", {
                defaultValue: "Enter your password",
              })}
              placeholderTextColor={isDarkMode ? "#AAA" : "#888"}
              secureTextEntry
            />
            {deleteError && (
              <Text style={{ color: Colors[theme].error, marginBottom: 12 }}>
                {deleteError}
              </Text>
            )}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                onPress={handleCancelDelete}
                disabled={isDeletingAccount}
              >
                <Text style={{ color: Colors[theme].tint, fontWeight: "bold" }}>
                  {t("cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmDelete}
                disabled={isDeletingAccount || !deletePassword.trim()}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: Colors[theme].error,
                  opacity:
                    isDeletingAccount || !deletePassword.trim() ? 0.6 : 1,
                  minWidth: 160,
                  alignItems: "center",
                }}
              >
                {isDeletingAccount ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>
                    {t("deleteAccountConfirmButton", {
                      defaultValue: "Yes, delete account",
                    })}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        visible={resetPasswordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelResetPassword}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.55)",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: isDarkMode ? "#1E1E1E" : "#fff",
              padding: 24,
              borderRadius: 16,
              width: "100%",
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 8,
                color: isDarkMode ? "#FFF" : "#000",
              }}
            >
              {t("resetPasswordModalTitle")}
            </Text>
            <Text
              style={{
                fontSize: 14,
                marginBottom: 16,
                color: isDarkMode ? "#D1D1D6" : "#4A4A4A",
              }}
            >
              {t("resetPasswordDescription")}
            </Text>

            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                marginBottom: 6,
                color: isDarkMode ? "#D1D1D6" : "#333",
              }}
            >
              {t("currentPassword")}
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: isDarkMode ? "#444" : "#CCC",
                backgroundColor: isDarkMode ? "#2A2A2A" : "#FFF",
                color: isDarkMode ? "#FFF" : "#000",
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
              }}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder={t("currentPasswordPlaceholder")}
              placeholderTextColor={isDarkMode ? "#AAA" : "#888"}
              secureTextEntry
            />

            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                marginBottom: 6,
                color: isDarkMode ? "#D1D1D6" : "#333",
              }}
            >
              {t("newPassword")}
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: isDarkMode ? "#444" : "#CCC",
                backgroundColor: isDarkMode ? "#2A2A2A" : "#FFF",
                color: isDarkMode ? "#FFF" : "#000",
                borderRadius: 8,
                padding: 12,
                marginBottom: 4,
              }}
              value={newPassword}
              onChangeText={(value) => {
                setNewPassword(value);
                setNewPasswordStrength(evaluatePasswordStrength(value));
              }}
              placeholder={t("newPasswordPlaceholder")}
              placeholderTextColor={isDarkMode ? "#AAA" : "#888"}
              secureTextEntry
            />
            <View style={{ marginBottom: 12, alignItems: 'center' }}>
              <View style={{ height: 4, borderRadius: 3, backgroundColor: '#E0E0E0', overflow: 'hidden', width: '50%' }}>
                <View
                  style={{
                    height: '100%',
                    borderRadius: 3,
                    backgroundColor: newPasswordStrength.color,
                    width: `${(newPasswordStrength.score / 5) * 100}%`,
                  }}
                />
              </View>
              <Text style={{ marginTop: 4, fontSize: 12, fontWeight: '600', textAlign: 'center', color: newPasswordStrength.color }}>
                {t(newPasswordStrength.label.replace(' ', '').toLowerCase(), {
                  defaultValue: newPasswordStrength.label,
                })}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                marginBottom: 6,
                color: isDarkMode ? "#D1D1D6" : "#333",
              }}
            >
              {t("confirmNewPassword")}
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: isDarkMode ? "#444" : "#CCC",
                backgroundColor: isDarkMode ? "#2A2A2A" : "#FFF",
                color: isDarkMode ? "#FFF" : "#000",
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
              }}
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              placeholder={t("confirmNewPasswordPlaceholder")}
              placeholderTextColor={isDarkMode ? "#AAA" : "#888"}
              secureTextEntry
            />

            {resetPasswordError && (
              <Text style={{ color: Colors[theme].error, marginBottom: 12 }}>
                {resetPasswordError}
              </Text>
            )}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                onPress={handleCancelResetPassword}
                disabled={isResettingPassword}
              >
                <Text style={{ color: Colors[theme].tint, fontWeight: "bold" }}>
                  {t("cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmResetPassword}
                disabled={
                  isResettingPassword ||
                  !currentPassword.trim() ||
                  !newPassword.trim() ||
                  !confirmNewPassword.trim()
                }
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: isDarkMode ? "#0A84FF" : "#2196F3",
                  opacity:
                    isResettingPassword ||
                    !currentPassword.trim() ||
                    !newPassword.trim() ||
                    !confirmNewPassword.trim()
                      ? 0.6
                      : 1,
                  minWidth: 160,
                  alignItems: "center",
                }}
              >
                {isResettingPassword ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>
                    {t("resetPasswordButton")}
                  </Text>
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
  container: {
    padding: 16,
    flexGrow: 1,
    justifyContent: "flex-start",
  },
  errorBanner: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorBannerText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ddd",
    marginBottom: 10,
  },
  avatarNote: {
    marginTop: 8,
    fontSize: 12,
    textAlign: "center",
  },
  imagePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
  },
  imagePickerText: {
    marginLeft: 8,
    fontSize: 14,
  },
  uploadButton: {
    marginTop: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: "center",
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  bioInput: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
    fontSize: 16,
  },
  charCount: {
    textAlign: "right",
    marginTop: 4,
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 24,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: "center",
    minWidth: 120,
    marginHorizontal: 8,
  },
  cancel: {},
  save: {
    backgroundColor: "#4CAF50",
  },
  btnText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  disabledButton: {
    opacity: 0.6,
  },
  deleteSection: {
    marginTop: 32,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  deleteSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  deleteSectionSubtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  deleteSectionButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteSectionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
});
