import { useState, useCallback } from 'react';
import { LikesApi } from '@/lib/api/likes';
import { PostsApi } from '@/lib/api/posts';

interface UsePostActionsOptions {
  postId: number;
  initialLiked?: boolean;
  initialSaved?: boolean;
  initialLikeCount?: number;
  onUpdate?: () => void;
}

export function usePostActions({
  postId,
  initialLiked = false,
  initialSaved = false,
  initialLikeCount = 0,
  onUpdate,
}: UsePostActionsOptions) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = typeof window !== 'undefined' ? localStorage.getItem('username') : null;

  // Optimistic like toggle with revert on failure
  const toggleLike = useCallback(async () => {
    if (!currentUser || isLoading) return;

    // Store previous state for potential revert
    const prevLiked = isLiked;
    const prevCount = likeCount;
    
    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? Math.max(0, prev - 1) : prev + 1);
    setIsLoading(true);

    try {
      if (isLiked) {
        await LikesApi.remove({ username: currentUser, postId });
      } else {
        await LikesApi.add({ username: currentUser, postId });
      }
      onUpdate?.();
    } catch (error) {
      // Revert on failure
      console.error('Error toggling like:', error);
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, isLoading, isLiked, likeCount, postId, onUpdate]);

  // Optimistic save toggle with revert on failure
  const toggleSave = useCallback(async () => {
    if (!currentUser || isLoading) return;

    // Store previous state for potential revert
    const prevSaved = isSaved;
    
    // Optimistic update
    setIsSaved(!isSaved);
    setIsLoading(true);

    try {
      if (isSaved) {
        await PostsApi.deleteSaved(postId, currentUser);
      } else {
        await PostsApi.save(postId, { username: currentUser });
      }
      onUpdate?.();
    } catch (error) {
      // Revert on failure
      console.error('Error toggling save:', error);
      setIsSaved(prevSaved);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, isLoading, isSaved, postId, onUpdate]);

  return {
    isLiked,
    isSaved,
    likeCount,
    isLoading,
    toggleLike,
    toggleSave,
  };
}