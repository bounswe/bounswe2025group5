import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { UsersApi } from "@/lib/api/users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import GlassCard from "@/components/ui/glass-card";
import { Spinner } from "@/components/ui/spinner";
import DeleteAccount from "@/components/profile/delete_account";
import EditProfile from "@/components/profile/edit_profile";
import PostCard from "@/components/feedpage/post-card";
import type { SavedPostItem } from "@/lib/api/schemas/users";
import type { PostItem } from "@/lib/api/schemas/posts";
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FollowApi } from '@/lib/api/follow';
import type { FollowUserItem } from '@/lib/api/schemas/follow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import userAvatar from '@/assets/user.png';
import UserProfileDialog from '@/components/profile/userProfileDialog';

export default function ProfileIndex() {
  const { t } = useTranslation();
  const [username, setUsername] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<SavedPostItem[]>([]);
  const [myPosts, setMyPosts] = useState<PostItem[]>([]);
  const [_postsLoading, setPostsLoading] = useState(true);
  const [saveToggle, setSaveToggle] = useState(false);

  // Followers/Following popover state
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [followers, setFollowers] = useState<FollowUserItem[]>([]);
  const [followings, setFollowings] = useState<FollowUserItem[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);

  // User profile dialog state
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  // Pull username from token payload stored in localStorage via API client refresh
  const storedUsername = useMemo(() => {
    try {
      const raw = localStorage.getItem("username");
      if (raw) return raw;
      const token = localStorage.getItem('authToken');
      if (!token) return null;
      const [, payload] = token.split('.');
      if (!payload) return null;
      const json = JSON.parse(atob(payload));
      // backend sets claim "username" in token
      return typeof json.username === 'string' ? json.username : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!storedUsername) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    setUsername(storedUsername);
    (async () => {
      try {
        const p = await UsersApi.getProfile(storedUsername);
        setBio(p.biography ?? "");
        setPhotoUrl(p.photoUrl ?? null);
        setFollowerCount(p.followerCount ?? 0);
        setFollowingCount(p.followingCount ?? 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [storedUsername]);

  const loadMyPosts = async () => {
    try {
      setPostsLoading(true);
    const p = await UsersApi.getPosts(storedUsername);
    setMyPosts(p as PostItem[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load posts");
    } finally {
      setPostsLoading(false);
    }
  };
  const loadSavedPosts = async () => {
    try {
      setPostsLoading(true);
    const p = await UsersApi.getSavedPosts(storedUsername);
    setPosts(p as SavedPostItem[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load saved posts");
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (saveToggle) {
      loadSavedPosts();
    } else {
      loadMyPosts();
    }
  }, [saveToggle]);
  const handlePostUpdate = (updatedPost: SavedPostItem | PostItem) => {
    if (saveToggle) {setPosts((prev: SavedPostItem[]) =>
      prev.map(post =>
        post.postId === updatedPost.postId ? updatedPost as SavedPostItem : post
      )
    );} else {setMyPosts((prev: PostItem[]) =>
      prev.map(post =>
        post.postId === updatedPost.postId ? updatedPost as PostItem : post
      )
    );}
  };

  const handlePostDelete = (postId: number) => {
    if (saveToggle) {
      setPosts(prev => prev.filter(post => post.postId !== postId));
    } else {
      setMyPosts(prev => prev.filter(post => post.postId !== postId));
    }
  };

  const loadFollowers = async () => {
    if (!storedUsername || followersLoading) return;
    setFollowersLoading(true);
    try {
      const data = await FollowApi.getFollowers(storedUsername);
      setFollowers(data);
    } catch (e) {
      console.error('Error loading followers:', e);
    } finally {
      setFollowersLoading(false);
    }
  };

  const loadFollowings = async () => {
    if (!storedUsername || followingLoading) return;
    setFollowingLoading(true);
    try {
      const data = await FollowApi.getFollowings(storedUsername);
      setFollowings(data);
    } catch (e) {
      console.error('Error loading followings:', e);
    } finally {
      setFollowingLoading(false);
    }
  };

  const handleFollowersOpen = (open: boolean) => {
    setFollowersOpen(open);
    if (open && followers.length === 0) {
      loadFollowers();
    }
  };

  const handleFollowingOpen = (open: boolean) => {
    setFollowingOpen(open);
    if (open && followings.length === 0) {
      loadFollowings();
    }
  };

  const handleUsernameClick = (clickedUsername: string) => {
    setSelectedUsername(clickedUsername);
    setIsProfileDialogOpen(true);
    setFollowersOpen(false);
    setFollowingOpen(false);
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-foreground">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto mt-24 space-y-6">
        {/* Profile Info Card */}
        <Card className="w-full">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="flex-[2]"></div>
            <div className="flex flex-col items-center text-center gap-4 flex-[2]">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-muted border border-border">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={username ? t('profile.photoAlt', { username, defaultValue: `${username}'s profile photo` }) : t('profile.photoAltAnon', 'Profile photo')}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-muted-foreground">{t('profile.noPhoto', 'No photo')}</div>
                )}
              </div>
              <div>
                <div className="text-xl font-semibold">{username}</div>
                <div className="text-muted-foreground mt-1">{bio || t('profile.noBio', 'No bio yet')}</div>
              </div>
              <div className="flex gap-3">
                <EditProfile
                  username={username}
                  initialBio={bio}
                  initialPhotoUrl={photoUrl}
                  onBioSaved={(newBio) => setBio(newBio)}
                  onPhotoSaved={(newUrl) => setPhotoUrl(newUrl)}
                />
                <DeleteAccount />
              </div>
            </div>
            <div className="flex-[1]"></div>
            <div className="flex flex-col items-center gap-4 flex-[2]">
              <div className="flex gap-6">
                <Popover open={followersOpen} onOpenChange={handleFollowersOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex flex-col items-center hover:opacity-80 transition-opacity cursor-pointer"
                    >
                      <span className="font-semibold text-2xl text-foreground">
                        {followerCount ?? 0}
                      </span>
                      <Label className="text-sm text-muted-foreground pointer-events-none">
                        {t('profile.followers.button', 'Followers')}
                      </Label>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <div className="p-4 border-b border-border">
                      <h3 className="font-semibold text-lg">{t('profile.followers.button', 'Followers')}</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {followers.length === 0 && !followersLoading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          {t('profile.followers.empty', 'No followers yet')}
                        </div>
                      ) : (
                        <div className="p-2">
                          {followers.map((user) => (
                            <div
                              key={user.username}
                              className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => handleUsernameClick(user.username)}
                            >
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={user.photoUrl || userAvatar} alt={user.username} />
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {user.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{user.username}</span>
                            </div>
                          ))}
                          {followersLoading && (
                            <div className="flex justify-center p-4">
                              <Spinner className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                <Popover open={followingOpen} onOpenChange={handleFollowingOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex flex-col items-center hover:opacity-80 transition-opacity cursor-pointer"
                    >
                      <span className="font-semibold text-2xl text-foreground">
                        {followingCount ?? 0}
                      </span>
                      <Label className="text-sm text-muted-foreground pointer-events-none">
                        {t('profile.following.button', 'Following')}
                      </Label>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <div className="p-4 border-b border-border">
                      <h3 className="font-semibold text-lg">{t('profile.following.button', 'Following')}</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {followings.length === 0 && !followingLoading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          {t('profile.following.empty', 'Not following anyone yet')}
                        </div>
                      ) : (
                        <div className="p-2">
                          {followings.map((user) => (
                            <div
                              key={user.username}
                              className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => handleUsernameClick(user.username)}
                            >
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={user.photoUrl || userAvatar} alt={user.username} />
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {user.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{user.username}</span>
                            </div>
                          ))}
                          {followingLoading && (
                            <div className="flex justify-center p-4">
                              <Spinner className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex-[2]"></div>
          </CardContent>
        </Card>

        {/* Posts Placeholder Card */}
        <GlassCard>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle>{saveToggle ? t('profile.savedPostsTitle', 'Saved Posts') : t('profile.postsTitle', 'Your Posts')}</CardTitle>
                {(saveToggle ? t('profile.savedPostsDesc', 'Posts you have saved') : t('profile.postsDesc', 'Posts you have created')) && (
                  <CardDescription>{saveToggle ? t('profile.savedPostsDesc', 'Posts you have saved') : t('profile.postsDesc', 'Posts you have created')}</CardDescription>
                )}
              </div>
              <div className="ml-4">
                <Button variant="tertiary" onClick={() => setSaveToggle(!saveToggle)}>
                  {saveToggle ? t('profile.showMyPosts', 'Show My Posts') : t('profile.showSavedPosts', 'Show Saved Posts')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-y-auto">
         {saveToggle ? (_postsLoading ? <div className="flex justify-center items-center min-h-[200px]"><Spinner /></div> : (posts.length === 0 ? (
            <div className="text-muted-foreground">{t('profile.noPosts', 'No posts yet')}</div>
          ) : (
            <div className="space-y-4 grid gap-4 sm:grid-cols-2">
              {posts.map((p) => (
                <PostCard key={p.postId} post={p as PostItem} onPostUpdate={(updatedPost: PostItem) => handlePostUpdate(updatedPost as SavedPostItem)} onPostDelete={handlePostDelete} onUsernameClick={handleUsernameClick} />
              ))}
            </div>
          ))) : (_postsLoading ? <div className="flex justify-center items-center min-h-[200px]"><Spinner /></div> : (myPosts.length === 0 ? (  
            <div className="text-muted-foreground">{t('profile.noPosts', 'No posts yet')}</div>
          ) : (
            <div className="space-y-4 grid gap-4 sm:grid-cols-2">
              {myPosts.map((p) => (
                <PostCard key={p.postId} post={p as PostItem} onPostUpdate={(updatedPost: PostItem) => handlePostUpdate(updatedPost as PostItem)} onPostDelete={handlePostDelete} onUsernameClick={handleUsernameClick} />
              ))}
            </div>
          )))}
            </div>
          </CardContent>
        </GlassCard>
      </div>

      <UserProfileDialog
        username={selectedUsername}
        open={isProfileDialogOpen}
        onOpenChange={setIsProfileDialogOpen}
        onUsernameClick={handleUsernameClick}
      />
    </div>
  );
}
