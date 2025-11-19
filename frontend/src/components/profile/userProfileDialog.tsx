import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { UsersApi } from '@/lib/api/users';
import type { ProfileResponse } from '@/lib/api/schemas/profile';
import type { PostItem } from '@/lib/api/schemas/posts';
import PostCard from '@/components/feedpage/post-card';
import ScrollPanel from '@/components/mainpage/ScrollPanel';
import userAvatar from '@/assets/user.png';

interface UserProfileDialogProps {
  username: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserProfileDialog({ username, open, onOpenChange }: UserProfileDialogProps) {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [isPostsLoading, setIsPostsLoading] = useState(false);

  useEffect(() => {
    if (!open || !username) return;

    let cancelled = false;
    setIsProfileLoading(true);
    setProfileError(null);

    UsersApi.getProfile(username)
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error('Error loading user profile:', error);
        setProfileError(t('profile.error.loadFailed'));
      })
      .finally(() => {
        if (cancelled) return;
        setIsProfileLoading(false);
      });

    setIsPostsLoading(true);
    UsersApi.getPosts(username)
      .then((data) => {
        if (cancelled) return;
        setPosts(data);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error('Error loading user posts:', error);
      })
      .finally(() => {
        if (cancelled) return;
        setIsPostsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, username, t]);

  useEffect(() => {
    if (!open) {
      setProfile(null);
      setProfileError(null);
      setPosts([]);
      setIsPostsLoading(false);
    }
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
  };

  const avatarUsername = username ?? profile?.username ?? '';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {username ? t('profile.userProfileTitle', { username }) : t('profile.userProfile')}
          </DialogTitle>
        </DialogHeader>

        {isProfileLoading ? (
          <div className="flex flex-1 items-center justify-center py-8">
            <Spinner />
          </div>
        ) : profileError ? (
          <div className="flex flex-1 items-center justify-center py-8 text-destructive text-sm">
            {profileError}
          </div>
        ) : !profile ? (
          <div className="flex flex-1 items-center justify-center py-8 text-muted-foreground text-sm">
            {t('profile.notFound')}
          </div>
        ) : (
          <div className="flex flex-col gap-4 overflow-y-auto pr-1">
            <div className="flex flex-col items-center text-center gap-3">
              <Avatar className="w-16 h-16">
                <AvatarImage
                  src={userAvatar}
                  alt={avatarUsername
                    ? t('profile.photoAlt', {
                        username: avatarUsername,
                        defaultValue: `${avatarUsername}'s profile photo`,
                      })
                    : t('profile.photoAltAnon', 'Profile photo')}
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {avatarUsername.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{profile.username}</p>
                {profile.biography && (
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                    {profile.biography}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-center gap-3 mb-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="opacity-70 flex flex-col items-center px-4 py-2 text-xs sm:text-sm"
              >
                <span className="font-semibold text-base">
                  {profile.followerCount ?? 0}
                </span>
                <span className="leading-tight">
                  {t('profile.followers.button', 'Followers')}
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="opacity-70 flex flex-col items-center px-4 py-2 text-xs sm:text-sm"
              >
                <span className="font-semibold text-base">
                  {profile.followingCount ?? 0}
                </span>
                <span className="leading-tight">
                  {t('profile.following.button', 'Following')}
                </span>
              </Button>
            </div>

            <ScrollPanel
              title={t('profile.postsTitle', 'Posts')}
              description={t('profile.postsDesc', 'Posts created by this user')}
              className="bg-background border-border"
              contentClassName="max-h-[50vh]"
            >
              {isPostsLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner className="h-4 w-4" />
                </div>
              ) : posts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('profile.noPosts', 'No posts yet')}
                </p>
              ) : (
                <div className="space-y-4 grid gap-4 sm:grid-cols-2">
                  {posts.map((post) => (
                    <PostCard
                      key={post.postId}
                      post={post}
                    />
                  ))}
                </div>
              )}
            </ScrollPanel>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
