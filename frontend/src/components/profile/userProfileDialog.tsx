import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { UsersApi } from '@/lib/api/users';
import { FollowApi } from '@/lib/api/follow';
import type { ProfileResponse } from '@/lib/api/schemas/profile';
import type { PostItem } from '@/lib/api/schemas/posts';
import PostCard from '@/components/feedpage/post-card';
import userAvatar from '@/assets/user.png';
import { BadgeShowcase } from '@/components/badges/badge-showcase';

interface UserProfileDialogProps {
  username: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUsernameClick?: (username: string) => void;
  __testOverrides?: {
    profile?: ProfileResponse | null;
    posts?: PostItem[];
    isFollowing?: boolean;
    profileError?: string | null;
  };
}

export default function UserProfileDialog({
  username,
  open,
  onOpenChange,
  onUsernameClick,
  __testOverrides,
}: UserProfileDialogProps) {
  const { t } = useTranslation();
  const hasOverrides = Boolean(__testOverrides);
  const [profile, setProfile] = useState<ProfileResponse | null>(__testOverrides?.profile ?? null);
  const [isProfileLoading, setIsProfileLoading] = useState(!hasOverrides);
  const [profileError, setProfileError] = useState<string | null>(__testOverrides?.profileError ?? null);
  const [posts, setPosts] = useState<PostItem[]>(__testOverrides?.posts ?? []);
  const [isPostsLoading, setIsPostsLoading] = useState(!hasOverrides);
  const [isFollowing, setIsFollowing] = useState(__testOverrides?.isFollowing ?? false);
  const [isFollowLoading, setIsFollowLoading] = useState(!hasOverrides);
  const [isFollowActionLoading, setIsFollowActionLoading] = useState(false);

  const currentUser =
    typeof window !== 'undefined' ? window.localStorage.getItem('username') : null;
  const isOwnProfile = currentUser === username;

  useEffect(() => {
    if (hasOverrides) return;
    if (!open || !username || !currentUser) return;

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

    if (!isOwnProfile) {
      setIsFollowLoading(true);
      FollowApi.isFollowing(currentUser, username)
        .then((following) => {
          if (cancelled) return;
          setIsFollowing(following);
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          console.error('Error checking follow status:', error);
        })
        .finally(() => {
          if (cancelled) return;
          setIsFollowLoading(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [open, username, currentUser, isOwnProfile, t, hasOverrides]);

  useEffect(() => {
    if (!open) {
      setProfile(null);
      setProfileError(null);
      setPosts([]);
      setIsPostsLoading(false);
      setIsFollowing(false);
      setIsFollowLoading(false);
    }
  }, [open]);

  const handleFollowToggle = async () => {
    if (!currentUser || !username || isFollowActionLoading) return;

    setIsFollowActionLoading(true);
    try {
      if (isFollowing) {
        await FollowApi.unfollowUser(currentUser, username);
        setIsFollowing(false);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                followerCount: Math.max(0, (prev.followerCount ?? 0) - 1),
              }
            : prev,
        );
      } else {
        await FollowApi.followUser(currentUser, username);
        setIsFollowing(true);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                followerCount: (prev.followerCount ?? 0) + 1,
              }
            : prev,
        );
      }
    } catch (error: unknown) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsFollowActionLoading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
  };

  const avatarUsername = username ?? profile?.username ?? '';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[50rem] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {username
              ? t('profile.userProfileTitle', { username })
              : t('profile.userProfile')}
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
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex items-start gap-8">
              <div className="flex-[2]" />
              <div className="flex flex-col items-center gap-3 w-[15rem]">
                <Avatar className="w-16 h-16">
                  <AvatarImage
                    src={profile.photoUrl || userAvatar}
                    alt={
                      avatarUsername
                        ? t('profile.photoAlt', {
                            username: avatarUsername,
                            defaultValue: `${avatarUsername}'s profile photo`,
                          })
                        : t('profile.photoAltAnon', 'Profile photo')
                    }
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {avatarUsername.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="font-semibold text-lg">{profile.username}</p>
                  {profile.biography && (
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                      {profile.biography}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex-[1]" />
              <div className="flex flex-col items-center gap-4 flex-[2]">
                <div className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <span className="font-semibold text-2xl text-foreground">
                      {profile.followerCount ?? 0}
                    </span>
                    <Label className="text-sm text-muted-foreground">
                      {t('profile.followers.button', 'Followers')}
                    </Label>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-semibold text-2xl text-foreground">
                      {profile.followingCount ?? 0}
                    </span>
                    <Label className="text-sm text-muted-foreground">
                      {t('profile.following.button', 'Following')}
                    </Label>
                  </div>
                </div>
                {!isOwnProfile && (
                  <Button
                    type="button"
                    variant={isFollowing ? 'destructive' : 'default'}
                    size="default"
                    onClick={handleFollowToggle}
                    disabled={isFollowLoading || isFollowActionLoading}
                    className="w-full transition-colors"
                  >
                    {isFollowActionLoading ? (
                      <Spinner className="h-4 w-4" />
                    ) : isFollowing ? (
                      t('profile.unfollow', 'Unfollow')
                    ) : (
                      t('profile.follow', 'Follow')
                    )}
                  </Button>
                )}
                <BadgeShowcase
                  username={username}
                  maxEarnedToShow={3}
                  iconClassName="min-h-[3rem] min-w-[3rem] sm:min-h-[5rem] sm:min-w-[5rem]"
                  gapClassName="gap-4"
                />
              </div>
              <div className="flex-[2]" />
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="posts" className="border rounded-md px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-semibold text-base">
                      {t('profile.postsTitle', 'Posts')}
                    </span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {t(
                        'profile.postsDesc',
                        'Posts created by this user',
                      )}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {isPostsLoading ? (
                    <div className="flex justify-center py-4">
                      <Spinner className="h-4 w-4" />
                    </div>
                  ) : posts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t('profile.noPosts', 'No posts yet')}
                    </p>
                  ) : (
                    <div className="space-y-4 grid gap-4 sm:grid-cols-2 justify-items-center max-h-[50vh] overflow-y-auto pr-2">
                      {posts.map((post) => (
                        <div key={post.postId} className="max-w-xs w-full">
                          <PostCard post={post} onUsernameClick={onUsernameClick} />
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
