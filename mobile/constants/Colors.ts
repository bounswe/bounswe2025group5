/**
 * Global Color System for WasteLess App
 * 
 * This file contains all colors used across the app in both light and dark themes.
 * Usage: Import Colors and use Colors[colorScheme].colorName
 * 
 * Color Categories:
 * - Base: Primary app colors (background, text, tint)
 * - UI: Interface elements (cards, borders, inputs)
 * - Interactive: Buttons, links, toggles
 * - Status: Success, error, warning states
 * - Semantic: Waste-related, progress indicators
 */

// Base theme colors
const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    // === BASE COLORS ===
    text: '#11181C',
    textSecondary: '#666666',
    textSubtle: '#757575',
    background: '#fff',
    screenBackground: '#F0F2F5',
    tint: tintColorLight,
    
    // === UI ELEMENTS ===
    cardBackground: '#FFFFFF',
    modalBackground: '#FFFFFF',
    borderColor: '#EEEEEE',
    dividerColor: '#E0E0E0',
    shadowColor: '#000000',
    
    // === ICONS & TABS ===
    icon: '#687076',
    iconSecondary: '#6C6C70',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    
    // === INPUT ELEMENTS ===
    inputBackground: '#FFFFFF',
    inputBorder: '#ccc',
    inputText: '#000000',
    inputPlaceholder: '#aaa',
    searchBarBackground: '#FFFFFF',
    
    // === INTERACTIVE ELEMENTS ===
    buttonPrimary: '#2196F3',
    buttonSecondary: '#007AFF',
    buttonDanger: '#E53935',
    buttonWarning: '#FF9800',
    buttonSuccess: '#4CAF50',
    buttonCancel: '#757575',
    
    // === STATUS COLORS ===
    error: '#D32F2F',
    errorBackground: '#FFCDD2',
    success: '#2E7D32',
    successBackground: '#C8E6C9',
    warning: '#F57C00',
    warningBackground: '#FFE0B2',
    info: '#1976D2',
    infoBackground: '#E3F2FD',
    
    // === PROGRESS & WASTE COLORS ===
    progressExcellent: '#2E7D32',    // 0-14.3%
    progressGood: '#66BB6A',         // 14.3-28.6%
    progressFair: '#9CCC65',         // 28.6-42.9%
    progressCaution: '#FFC107',      // 42.9-57.1%
    progressConcern: '#FFA726',      // 57.1-71.4%
    progressBad: '#FF7043',          // 71.4-85.7%
    progressCritical: '#E53935',     // 85.7%+
    
    // === SPECIAL FEATURES ===
    likeColor: '#E91E63',
    saveColor: '#FFC107',
    commentBackground: '#F5F5F5',
    activityIndicator: '#000000',
    refreshControl: '#000000',
    
    // === SWITCH/TOGGLE COLORS ===
    switchThumb: '#2196F3',
    switchTrackActive: '#81b0ff',
    switchTrackInactive: '#e0e0e0',
  },
  dark: {
    // === BASE COLORS ===
    text: '#ECEDEE',
    textSecondary: '#A0A0A0',
    textSubtle: '#8E8E93',
    background: '#151718',
    screenBackground: '#151718',
    tint: tintColorDark,
    
    // === UI ELEMENTS ===
    cardBackground: '#1C1C1E',
    modalBackground: '#1C1C1E',
    borderColor: '#3A3A3C',
    dividerColor: '#545458',
    shadowColor: '#000000',
    
    // === ICONS & TABS ===
    icon: '#9BA1A6',
    iconSecondary: '#8E8E93',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    
    // === INPUT ELEMENTS ===
    inputBackground: '#2C2C2E',
    inputBorder: '#545458',
    inputText: '#E5E5E7',
    inputPlaceholder: '#8E8E93',
    searchBarBackground: '#1C1C1E',
    
    // === INTERACTIVE ELEMENTS ===
    buttonPrimary: '#0A84FF',
    buttonSecondary: '#007AFF',
    buttonDanger: '#FF453A',
    buttonWarning: '#FF9F0A',
    buttonSuccess: '#30D158',
    buttonCancel: '#8E8E93',
    
    // === STATUS COLORS ===
    error: '#FF9494',
    errorBackground: '#5D1F1A',
    success: '#66BB6A',
    successBackground: '#1B4332',
    warning: '#FFB74D',
    warningBackground: '#3E2723',
    info: '#64B5F6',
    infoBackground: '#0D1421',
    
    // === PROGRESS & WASTE COLORS ===
    progressExcellent: '#66BB6A',    // 0-14.3%
    progressGood: '#81C784',         // 14.3-28.6%
    progressFair: '#AED581',         // 28.6-42.9%
    progressCaution: '#FFD54F',      // 42.9-57.1%
    progressConcern: '#FFB74D',      // 57.1-71.4%
    progressBad: '#FF8A65',          // 71.4-85.7%
    progressCritical: '#FF5722',     // 85.7%+
    
    // === SPECIAL FEATURES ===
    likeColor: '#FF69B4',
    saveColor: '#FFD700',
    commentBackground: '#2C2C2E',
    activityIndicator: '#FFFFFF',
    refreshControl: '#FFFFFF',
    
    // === SWITCH/TOGGLE COLORS ===
    switchThumb: '#81b0ff',
    switchTrackActive: '#5c85d6',
    switchTrackInactive: '#3e3e3e',
  },
};
