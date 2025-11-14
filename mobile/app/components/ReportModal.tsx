import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AccessibleText from '@/components/AccessibleText';
import { useTranslation } from 'react-i18next';

const REPORT_OPTIONS = [
  { value: 'spam', labelKey: 'reportReasonSpam', defaultLabel: 'Spam' },
  { value: 'hate', labelKey: 'reportReasonHate', defaultLabel: 'Hate Speech' },
  { value: 'harm', labelKey: 'reportReasonHarm', defaultLabel: 'Harm / Violence' },
  { value: 'other', labelKey: 'reportReasonOther', defaultLabel: 'Other' },
] as const;

export type ReportContext = {
  type: 'post' | 'comment';
  title?: string | null;
  username?: string | null;
  snippet?: string | null;
};

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  context?: ReportContext | null;
  surfaceColor: string;
  textColor: string;
  accentColor: string;
}

const ReportModal = ({
  visible,
  onClose,
  context,
  surfaceColor,
  textColor,
  accentColor,
}: ReportModalProps) => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const [details, setDetails] = useState('');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const borderColor = colorScheme === 'dark' ? '#3A3A3C' : '#E4E4E7';
  const subtitleColor = colorScheme === 'dark' ? '#C8C8CC' : '#535353';
  const reasonBackground = colorScheme === 'dark' ? '#1F1F22' : '#F7F7FA';
  const reasonTextColor = colorScheme === 'dark' ? '#E8E8ED' : '#1C1C1E';
  const reasonSelectedBackground = colorScheme === 'dark' ? '#2C2C2E' : '#E1E4EA';
  const reasonSelectedBorder = colorScheme === 'dark' ? '#F2F2F7' : '#5D5D63';
  const reasonSelectedTextColor = colorScheme === 'dark' ? '#FFFFFF' : '#141417';
  const reasonSelectedIconColor = colorScheme === 'dark' ? '#FFFFFF' : '#141417';
  const reasonUnselectedIconColor = colorScheme === 'dark' ? '#7A7A80' : '#A0A0A5';
  const submitTextColor = colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF';

  useEffect(() => {
    if (!visible) {
      setDetails('');
      setSelectedReason(null);
    }
  }, [visible]);

  const handleSubmit = () => {
    if (!selectedReason) return;
    Alert.alert(
      t('reportSentTitle', { defaultValue: 'Report submitted' }),
      t('reportSentMessage', {
        defaultValue: 'Thank you for letting us know. Our moderators will review it shortly.',
      }),
      [
        {
          text: t('close', { defaultValue: 'Close' }),
          onPress: onClose,
        },
      ]
    );
  };

  const titleText =
    context?.type === 'comment'
      ? t('reportCommentTitle', { defaultValue: 'Report Comment' })
      : t('reportPostTitle', { defaultValue: 'Report Post' });

  const summaryText =
    context?.type === 'comment'
      ? t('reportingCommentBy', {
          defaultValue: 'Comment by {{username}}',
          username: context?.username || t('unknownUser', { defaultValue: 'unknown user' }),
        })
      : t('reportingPost', {
          defaultValue: 'Post: {{title}}',
          title: context?.title || t('untitledPost', { defaultValue: 'Untitled post' }),
        });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          accessible
          accessibilityRole="button"
          accessibilityLabel={t('close', { defaultValue: 'Close' })}
          onPress={onClose}
          activeOpacity={1}
        />
        <View style={[styles.card, { backgroundColor: surfaceColor }]}>
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <Ionicons name="warning-outline" size={22} color={accentColor} />
              <AccessibleText backgroundColor={surfaceColor} style={[styles.title, { color: textColor }]}>
                {titleText}
              </AccessibleText>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('closeModal', { defaultValue: 'Close modal' })}
            >
              <Ionicons name="close" size={20} color={textColor} />
            </TouchableOpacity>
          </View>

          <AccessibleText
            backgroundColor={surfaceColor}
            style={[styles.summaryText, { color: subtitleColor }]}
          >
            {summaryText}
          </AccessibleText>

          {context?.snippet ? (
            <View style={[styles.snippetBox, { borderColor }]}>
              <AccessibleText
                backgroundColor={surfaceColor}
                style={[styles.snippetText, { color: textColor }]}
                numberOfLines={3}
              >
                {`"${context.snippet.trim()}"`}
              </AccessibleText>
            </View>
          ) : null}

          <AccessibleText
            backgroundColor={surfaceColor}
            style={[styles.helperLabel, { color: subtitleColor }]}
          >
            {t('reportReasonLabel', { defaultValue: 'Why are you reporting this?' })}
          </AccessibleText>

          <View style={styles.reasonList}>
            {REPORT_OPTIONS.map((option) => {
              const isSelected = selectedReason === option.value;
              const translatedLabel = t(option.labelKey, { defaultValue: option.defaultLabel });
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.reasonOption,
                    {
                      borderColor: isSelected ? reasonSelectedBorder : borderColor,
                      backgroundColor: isSelected ? reasonSelectedBackground : reasonBackground,
                    },
                  ]}
                  onPress={() => setSelectedReason(option.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={isSelected ? reasonSelectedIconColor : reasonUnselectedIconColor}
                    style={styles.reasonIcon}
                  />
                  <AccessibleText
                    backgroundColor={isSelected ? reasonSelectedBackground : reasonBackground}
                    style={[
                      styles.reasonLabel,
                      { color: isSelected ? reasonSelectedTextColor : reasonTextColor },
                    ]}
                  >
                    {translatedLabel}
                  </AccessibleText>
                </TouchableOpacity>
              );
            })}
          </View>

          <AccessibleText
            backgroundColor={surfaceColor}
            style={[styles.helperLabel, { color: subtitleColor, marginTop: 10 }]}
          >
            {t('reportDetailsLabel', {
              defaultValue: 'Add extra details (optional)',
            })}
          </AccessibleText>

          <TextInput
            style={[
              styles.detailsInput,
              {
                borderColor,
                color: textColor,
                backgroundColor: colorScheme === 'dark' ? '#1F1F22' : '#FBFBFD',
              },
            ]}
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={4}
            placeholder={t('reportDetailsPlaceholder', {
              defaultValue: 'Describe the issue or share useful context...',
            })}
            placeholderTextColor={colorScheme === 'dark' ? '#7A7A80' : '#A0A0A5'}
            accessibilityLabel={t('reportDetailsInputLabel', {
              defaultValue: 'Details about what happened',
            })}
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: selectedReason ? accentColor : '#CCCCCC',
              },
            ]}
            onPress={handleSubmit}
            disabled={!selectedReason}
            accessibilityRole="button"
            accessibilityState={{ disabled: !selectedReason }}
            accessibilityLabel={t('submitReport', { defaultValue: 'Submit report' })}
          >
            <AccessibleText
              backgroundColor={selectedReason ? accentColor : '#CCCCCC'}
              style={[
                styles.submitButtonText,
                { color: selectedReason ? submitTextColor : '#FFFFFF' },
              ]}
            >
              {t('sendReport', { defaultValue: 'Send Report' })}
            </AccessibleText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ReportModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', marginLeft: 8 },
  closeButton: { padding: 6, marginLeft: 12 },
  summaryText: { fontSize: 14, marginBottom: 10 },
  snippetBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  snippetText: { fontSize: 13, fontStyle: 'italic' },
  helperLabel: { fontSize: 13, marginBottom: 6 },
  reasonList: { marginBottom: 10 },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  reasonIcon: { marginRight: 10 },
  reasonLabel: { fontSize: 15, fontWeight: '600' },
  detailsInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitButton: {
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },
});
