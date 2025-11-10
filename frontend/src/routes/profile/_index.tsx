import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { UsersApi } from "@/lib/api/users";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import DeleteAccount from "@/components/profile/delete_account";
import EditProfile from "@/components/profile/edit_profile";
import PostCard from "@/components/feedpage/post-card";
import ScrollPanel from "@/components/mainpage/ScrollPanel";
import type { SavedPostItem } from "@/lib/api/schemas/users";
import type { PostItem } from "@/lib/api/schemas/posts";
import { Button } from "@/components/ui/button";

export default function ProfileIndex() {
  const { t } = useTranslation();
  const [username, setUsername] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<SavedPostItem[]>([]);
  const [myPosts, setMyPosts] = useState<PostItem[]>([]);
  const [_postsLoading, setPostsLoading] = useState(true);
  const [saveToggle, setSaveToggle] = useState(false);
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
      <div className="max-w-2xl mx-auto mt-24 space-y-6">
        {/* Profile Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
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
          </CardContent>
        </Card>
        <Button onClick={() => setSaveToggle(!saveToggle)}>{saveToggle ? t('profile.showMyPosts', 'Show My Posts') : t('profile.showSavedPosts', 'Show Saved Posts')}</Button>

        {/* Posts Placeholder Card */}
        <ScrollPanel
            title={saveToggle ? t('profile.savedPostsTitle', 'Saved Posts') : t('profile.postsTitle', 'Your Posts')}
            description={saveToggle ? t('profile.savedPostsDesc', 'Posts you have saved') : t('profile.postsDesc', 'Posts you have created')}
        >
         {saveToggle ? (_postsLoading ? <Spinner /> : (posts.length === 0 ? (
            <div className="text-muted-foreground">{t('profile.noPosts', 'No posts yet')}</div>
          ) : (
            <div className="space-y-4 grid gap-4 sm:grid-cols-2">
              {posts.map((p) => (
                <PostCard key={p.postId} post={p as PostItem} onPostUpdate={(updatedPost: PostItem) => handlePostUpdate(updatedPost as SavedPostItem)} onPostDelete={handlePostDelete} />
              ))}
            </div>
          ))) : (_postsLoading ? <Spinner /> : (myPosts.length === 0 ? (  
            <div className="text-muted-foreground">{t('profile.noPosts', 'No posts yet')}</div>
          ) : (
            <div className="space-y-4 grid gap-4 sm:grid-cols-2">
              {myPosts.map((p) => (
                <PostCard key={p.postId} post={p as PostItem} onPostUpdate={(updatedPost: PostItem) => handlePostUpdate(updatedPost as PostItem)} onPostDelete={handlePostDelete} />
              ))}
            </div>
          )))}
        </ScrollPanel>
      </div>
    </div>
  );
}


