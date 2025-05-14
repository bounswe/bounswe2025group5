// app/saved_posts.tsx
import React, { useContext, useState, useCallback, useLayoutEffect, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Platform,
  useColorScheme,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AuthContext } from './_layout'; // Adjust path if necessary

const HOST = '162.35.42.102';
const API_BASE = `http://${HOST}:8080`;

// Type Definition (using relevant fields)
type PostData = {
  postId: number;
  creatorUsername: string;
  content: string;
  likeCount: number;
  commentCount: number; // Assuming this is a count based on previous context
  photoUrl: string | null;
  // savedByUser is NOT strictly needed from API, as we fetch only saved posts initially
};

// The Card Component (Provided by you, assuming styles are defined below)
function SavedPostCard({
    post,
    cardBackgroundColor,
    iconColor,
    actionIconColor,
    isSavedLocally, // Renamed prop for clarity within this screen's logic
    onUnsave,
    onSave
}: {
    post: PostData;
    cardBackgroundColor: string;
    iconColor: string;
    actionIconColor: string;
    isSavedLocally: boolean; // Reflects the *local* state for the icon/action
    onUnsave: (postId: number) => void;
    onSave: (postId: number) => void;
}) {
    const navigation = useNavigation<any>();

    const handleViewPost = () => {
        console.log("Navigate to post detail for:", post.postId);
        // navigation.navigate('post_detail', { postId: post.postId });
    };

    // Determine which action to call based on the local saved state
    const handleBookmarkPress = () => {
        if (isSavedLocally) { // If icon shows saved (filled bookmark)
            onUnsave(post.postId); // Trigger unsave action
        } else { // If icon shows not saved (outline bookmark)
            onSave(post.postId); // Trigger save action
        }
    };

    return (
        <TouchableOpacity onPress={handleViewPost} style={[styles.postContainer, { backgroundColor: cardBackgroundColor }]}>
            {post.photoUrl && (
                <Image
                    source={{ uri: post.photoUrl.startsWith('http') ? post.photoUrl : `${API_BASE}${post.photoUrl}` }}
                    style={styles.postImage}
                    onError={(e) => console.warn('Saved Post Card: Image load error', e.nativeEvent.error)}
                />
            )}
            <ThemedText style={styles.postContent} numberOfLines={post.photoUrl ? 3 : 6}>{post.content}</ThemedText>
            <ThemedText style={styles.creatorText}>By: {post.creatorUsername}</ThemedText>
            <View style={styles.postFooter}>
                <View style={styles.postStats}>
                    <Ionicons name="heart-outline" size={16} color={iconColor} />
                    <ThemedText style={[styles.footerText, { color: iconColor }]}>{post.likeCount}</ThemedText>
                    <Ionicons name="chatbubble-outline" size={16} color={iconColor} /> 
                    <ThemedText style={[styles.footerText, { color: iconColor }]}>{post.commentCount}</ThemedText> 
                </View>
                <View style={styles.postActions}>
                    <TouchableOpacity onPress={handleBookmarkPress} style={styles.actionIcon}>
                        <Ionicons
                            name={isSavedLocally ? "bookmark" : "bookmark-outline"} // Reflect local state
                            size={20}
                            color={actionIconColor}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}


// Main Screen Component
export default function SavedPostsScreen() {
    const navigation = useNavigation<any>();
    const { username } = useContext(AuthContext); // Might be undefined, null, or string
    const colorScheme = useColorScheme();

    // State Variables
    const [savedPosts, setSavedPosts] = useState<PostData[]>([]); // Posts fetched from backend
    const [locallyUnsavedIds, setLocallyUnsavedIds] = useState<Set<number>>(new Set()); // Track unsaved IDs *in this session*
    const [loading, setLoading] = useState(true); // Initial loading state
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null); // Use null for no error

    // Themeing
    const isDarkMode = colorScheme === 'dark';
    const screenBackgroundColor = isDarkMode ? '#151718' : '#F0F2F5';
    const cardBackgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
    const iconColor = isDarkMode ? '#8E8E93' : '#6C6C70';
    const actionIconColor = '#FFC107'
    const activityIndicatorColor = isDarkMode ? '#FFFFFF' : '#000000';
    const refreshControlColors = isDarkMode ? { tintColor: '#FFFFFF', titleColor: '#FFFFFF'} : { tintColor: '#000000', titleColor: '#000000'};
    const errorTextColor = isDarkMode ? '#FF9494' : '#D32F2F';
    const buttonTextColor = '#FFFFFF'; // Example for buttons
    const primaryButtonColor = '#007AFF'; // Example blue

    // Navigation Header
    useLayoutEffect(() => {
        navigation.setOptions({ headerTitle: 'Saved Posts' });
    }, [navigation]);

    // Fetch Saved Posts Function
    const fetchSavedPosts = useCallback(async () => {
        if (!username) {
            console.warn("fetchSavedPosts called but username is not available.");
            setError("Login Required: Cannot fetch saved posts.");
            setLoading(false);
            setRefreshing(false);
            setSavedPosts([]); // Clear posts if user is not logged in
            setLocallyUnsavedIds(new Set());
            return;
        }

        // Indicate loading only if not refreshing
        if (!refreshing) {
            setLoading(true);
        }
        setError(null); // Clear previous errors

        try {
            // --- API Call to GET saved posts ---
            // Remember to encode username for URL safety
            const response = await fetch(`${API_BASE}/api/posts/getSavedPosts?username=${encodeURIComponent(username)}`);

            if (!response.ok) {
                if (response.status === 404) { // Handle no saved posts gracefully
                    setSavedPosts([]);
                } else {
                    throw new Error(`Failed to fetch saved posts. Status: ${response.status}`);
                }
            } else {
                const data: PostData[] = await response.json();
                setSavedPosts(data);
            }
            // --- Sync local state with fetch results ---
            setLocallyUnsavedIds(new Set()); // Reset local unsaved status on successful fetch/refresh

        } catch (err: any) {
            console.error("Error fetching saved posts:", err);
            setError(err.message || "An unknown error occurred.");
            // Keep potentially stale 'savedPosts' data visible on error? Or clear? Current: Keep.
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [username, refreshing]); // Dependencies

    // Effect to fetch data on focus or when username changes
    useFocusEffect(
        useCallback(() => {
            console.log("SavedPostsScreen Focus: Username =", username);
            // Wait for AuthContext to provide definitive status (null or string)
            if (username === undefined) {
                console.log("SavedPostsScreen Focus: Waiting for Auth Context...");
                setLoading(true); // Show loader while waiting
                setError(null);
            } else if (username) {
                console.log("SavedPostsScreen Focus: Username present, fetching data.");
                fetchSavedPosts(); // Fetch data only when logged in
            } else { // username is null or empty string
                console.log("SavedPostsScreen Focus: Username null/empty, setting Login Required error.");
                setError("Login Required: Cannot fetch saved posts.");
                setSavedPosts([]);
                setLocallyUnsavedIds(new Set());
                setLoading(false);
            }
        }, [username, fetchSavedPosts]) // Dependencies: username, fetchSavedPosts
    );

    // Pull-to-Refresh Handler
    const handleRefresh = () => {
        if (username) {
            setRefreshing(true);
            // fetchSavedPosts will be called via useCallback dependency change
        } else {
            Alert.alert("Login Required", "Please log in to view saved posts.");
        }
    };

    // --- Handle UNsaving a Post ---
    const handleUnsavePost = async (postId: number) => {
        if (!username) { Alert.alert("Login Required"); return; }

        // 1. Optimistic UI Update (Mark as locally unsaved)
        setLocallyUnsavedIds(prevIds => {
            const newIds = new Set(prevIds);
            newIds.add(postId);
            console.log(`Optimistic UI: Marking Post ${postId} as locally unsaved.`);
            return newIds;
        });

        try {
            // 2. API Call (DELETE)
            const url = `${API_BASE}/api/posts/unsave${encodeURIComponent(username)}/${postId}`; // Ensure path structure is correct & encode username
            console.log(`API Call: DELETE ${url}`);
            const response = await fetch(url, { method: 'DELETE', /* Add Auth headers if needed */ });
            const responseBodyText = await response.text(); // Get text for potential validation/error
            console.log(`API Response: Status ${response.status}`);

            if (!response.ok) { throw new Error(`Failed to unsave post. Status: ${response.status}`); }

            // 3. Validate Success Response (Optional but Recommended)
            // Expecting { "deleted": true } based on previous info
            try {
                const result = JSON.parse(responseBodyText);
                if (!result || result.deleted !== true) {
                   throw new Error("Backend unsave confirmation format mismatch.");
                }
                console.log(`API Success: Post ${postId} unsaved.`);
            } catch(e: any) {
                 throw new Error(`Failed to parse unsave confirmation or format mismatch: ${e.message}`);
            }
            // If validation passes, do nothing - local state is already updated

        } catch (err: any) {
            // 4. Revert UI on Error
            console.error("Error during unsave:", err);
            Alert.alert("Error", err.message || "Could not unsave post.");
            setLocallyUnsavedIds(prevIds => {
                const newIds = new Set(prevIds);
                newIds.delete(postId);
                console.log(`Reverting UI: Removing Post ${postId} from locally unsaved.`);
                return newIds;
            });
        }
    };

    // --- Handle SAVING a Post (that was locally unsaved) ---
    const handleSavePost = async (postId: number) => {
         if (!username) { Alert.alert("Login Required"); return; }

         // 1. Optimistic UI Update (Mark as locally saved)
         setLocallyUnsavedIds(prevIds => {
            const newIds = new Set(prevIds);
            newIds.delete(postId);
            console.log(`Optimistic UI: Marking Post ${postId} as locally saved (removing from unsaved).`);
            return newIds;
        });

         try {
            // 2. API Call (POST)
            const url = `${API_BASE}/api/posts/save`;
            console.log(`API Call: POST ${url}`);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', /* Add Auth headers if needed */ },
                body: JSON.stringify({ username, postId }) // Verify if username is needed
            });
            const responseBodyText = await response.text();
            console.log(`API Response: Status ${response.status}`);

            if (!response.ok) { throw new Error(`Failed to save post. Status: ${response.status}`); }

            // 3. Validate Success Response (Optional but Recommended)
            // Expecting { "username": "...", "postId": ... } based on previous info
             try {
                const result = JSON.parse(responseBodyText);
                if (!result || result.username !== username || result.postId !== postId) {
                   throw new Error("Backend save confirmation format mismatch.");
                }
                console.log(`API Success: Post ${postId} saved.`);
            } catch(e: any) {
                 throw new Error(`Failed to parse save confirmation or format mismatch: ${e.message}`);
            }
            // If validation passes, do nothing - local state is already updated

         } catch (err: any) {
            // 4. Revert UI on Error
             console.error("Error during save:", err);
             Alert.alert("Error", err.message || "Could not save post.");
             setLocallyUnsavedIds(prevIds => {
                const newIds = new Set(prevIds);
                newIds.add(postId); // Add back to unsaved list
                console.log(`Reverting UI: Re-adding Post ${postId} to locally unsaved.`);
                return newIds;
            });
         }
    };

    // --- Render Logic ---

    // 1. Initial Auth Loading State
    if (username === undefined) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: screenBackgroundColor }]}>
                <ActivityIndicator size="large" color={activityIndicatorColor} />
            </View>
        );
    }

    // 2. Not Logged In State
    if (!username) {
        return (
            <ScrollView // Wrap in ScrollView for consistency and pull-to-refresh
                style={[styles.container, { backgroundColor: screenBackgroundColor }]}
                contentContainerStyle={styles.content} // Use flexGrow for centering
                refreshControl={ <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={refreshControlColors.tintColor} titleColor={refreshControlColors.titleColor}/> }
            >
                <View style={styles.centeredMessageContainer}>
                    <ThemedText style={[styles.messageText, { color: errorTextColor, marginBottom: 20 }]}>
                        Login Required: Cannot fetch saved posts.
                    </ThemedText>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: primaryButtonColor }]}
                        onPress={() => navigation.navigate('index' as never)} // Navigate to your Login screen route name
                    >
                        <ThemedText style={styles.buttonText}>Go to Login</ThemedText>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }

     // 3. Screen/Data Loading State (after login check)
    if (loading && savedPosts.length === 0) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: screenBackgroundColor }]}>
                <ActivityIndicator size="large" color={activityIndicatorColor} />
            </View>
        );
    }

    // 4. API Error State (while logged in)
    if (error) {
         return (
            <ScrollView
                style={[styles.container, { backgroundColor: screenBackgroundColor }]}
                contentContainerStyle={styles.content}
                refreshControl={ <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={refreshControlColors.tintColor} titleColor={refreshControlColors.titleColor}/> }
            >
                <View style={styles.centeredMessageContainer}>
                    <ThemedText style={[styles.messageText, { color: errorTextColor, marginBottom: 20 }]}>{error}</ThemedText>
                    <TouchableOpacity onPress={fetchSavedPosts} style={styles.retryButton}>
                        <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }

    // 5. Empty Saved Posts State
    if (!loading && savedPosts.length === 0) {
         return (
             <ScrollView
                style={[styles.container, { backgroundColor: screenBackgroundColor }]}
                contentContainerStyle={styles.content}
                refreshControl={ <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={refreshControlColors.tintColor} titleColor={refreshControlColors.titleColor}/> }
            >
                <View style={styles.centeredMessageContainer}>
                    <ThemedText style={styles.messageText}>You haven't saved any posts yet.</ThemedText>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: primaryButtonColor, marginTop: 20 }]}
                        onPress={() => navigation.navigate('(tabs)', { screen: 'explore' })} // Adjust nav path if needed
                    >
                        <ThemedText style={styles.buttonText}>Explore Posts</ThemedText>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }

    // 6. Render List of Posts
    return (
        <ScrollView
            style={[styles.container, { backgroundColor: screenBackgroundColor }]}
            contentContainerStyle={styles.listContent} // Use different style if needed for list padding
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={refreshControlColors.tintColor}
                    titleColor={refreshControlColors.titleColor}
                />
            }
        >
            {savedPosts.map(post => (
                <SavedPostCard
                    key={post.postId}
                    post={post}
                    cardBackgroundColor={cardBackgroundColor}
                    iconColor={iconColor}
                    actionIconColor={actionIconColor}
                    // Determine local saved status based on whether it's in the unsaved set
                    isSavedLocally={!locallyUnsavedIds.has(post.postId)}
                    onUnsave={handleUnsavePost}
                    onSave={handleSavePost}
                />
            ))}
        </ScrollView>
    );
}


// --- Styles ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: { // Used for centered messages
        flexGrow: 1, // Ensures it can expand to fill ScrollView for centering
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    listContent: { // Used for the list view
        padding: 16,
        paddingBottom: 24, // Add padding at the bottom
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centeredMessageContainer: {
        flex: 1, // Takes up space within the ScrollView content container
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
    messageText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 15,
    },
    postContainer: {
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(128, 128, 128, 0.2)',
    },
    postImage: {
        width: '100%',
        aspectRatio: 16 / 9,
        maxHeight: 250,
        borderRadius: 6,
        marginBottom: 12,
        resizeMode: 'cover',
        backgroundColor: '#e0e0e0' // Placeholder color
    },
    postContent: {
        fontSize: 15,
        marginBottom: 6,
        lineHeight: 22,
    },
    creatorText: {
        fontSize: 13,
        color: '#8E8E93',
        marginBottom: 10,
    },
    postFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(128, 128, 128, 0.3)',
        paddingTop: 10,
        marginTop: 10,
    },
    postStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        marginHorizontal: 8,
    },
    postActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionIcon: {
        padding: 8,
        marginLeft: 8,
        borderRadius: 15,
    },
    actionButton: { // Generic style for Explore/Login buttons
       marginTop: 20,
       paddingVertical: 12,
       paddingHorizontal: 30,
       borderRadius: 25, // More rounded
       alignItems: 'center',
       justifyContent: 'center',
       minWidth: 150,
     },
     buttonText: { // Text for actionButton
       color: '#FFFFFF',
       fontSize: 16,
       fontWeight: '600',
     },
    retryButton: { // Style for the Retry button
        marginTop: 15,
        borderColor: '#007AFF', // Use action color
        borderWidth: 1,
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderRadius: 25, // Match actionButton
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 150,
    },
    retryButtonText: { // Text style for the retry button
        color: '#007AFF', // Use action color
        fontSize: 15,
        fontWeight: '500',
    },
});