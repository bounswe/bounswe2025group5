import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useTranslation } from 'react-i18next';
import PostCard from '@/components/feedpage/post-card';
import CreatePostButton from '@/components/feedpage/create-post-button';
import SearchCard from '@/components/feedpage/search-card';
import { PostsApi } from '@/lib/api/posts';
import { SearchApi } from '@/lib/api/search';
import type { PostItem } from '@/lib/api/schemas/posts';
import { RefreshCw, TrendingUp } from 'lucide-react';
import GlassCard from '@/components/ui/glass-card';
import Masonry from 'react-masonry-css';
import UserProfileDialog from '@/components/profile/userProfileDialog';

const POSTS_PER_PAGE = 10;

export default function FeedPage() {
  const { t, i18n } = useTranslation();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [lastPostId, setLastPostId] = useState<number | undefined>();
  const [feedType, setFeedType] = useState<'latest' | 'popular'>('latest');
  const [error, setError] = useState<string | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Search state
  const [searchResults, setSearchResults] = useState<PostItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Get current username from localStorage
  const currentUsername = typeof window !== 'undefined' ? localStorage.getItem('username') : null;

  // Load initial posts
  useEffect(() => {
    loadInitialPosts();
  }, [feedType]);

  const loadInitialPosts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { size: POSTS_PER_PAGE, ...(currentUsername && { username: currentUsername }) };
      const newPosts = feedType === 'latest' 
        ? await PostsApi.list(params)
        : await PostsApi.listMostLiked(params);

      setPosts(newPosts);
      setLastPostId(newPosts.length > 0 ? newPosts[newPosts.length - 1].postId : undefined);
      setHasMorePosts(newPosts.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error loading posts:', error);
      setError(t('feed.error.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (!hasMorePosts || isLoadingMore || !lastPostId) return;

    setIsLoadingMore(true);
    try {
      const params = { size: POSTS_PER_PAGE, ...(currentUsername && { username: currentUsername }) };
      const newPosts = feedType === 'latest'
        ? await PostsApi.list({ ...params, lastPostId })
        : await PostsApi.listMostLiked(params);

      if (newPosts.length > 0) {
        setPosts(prev => [...prev, ...newPosts]);
        setLastPostId(newPosts[newPosts.length - 1].postId);
        setHasMorePosts(newPosts.length === POSTS_PER_PAGE);
      } else {
        setHasMorePosts(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
      setError(t('feed.error.loadMoreFailed'));
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    loadInitialPosts();
  };

  const handlePostUpdate = (updatedPost: PostItem) => {
    setPosts(prev =>
      prev.map(post =>
        post.postId === updatedPost.postId ? updatedPost : post
      )
    );
  };

  const handlePostDelete = (postId: number) => {
    setPosts(prev => prev.filter(post => post.postId !== postId));
    setSearchResults(prev => prev.filter(post => post.postId !== postId));
  };

  const handleUsernameClick = (username: string) => {
    setSelectedUsername(username);
    setIsProfileOpen(true);
  };

  // Search handlers
  const handleSearch = async (query: string) => {
    setIsSearchActive(true);
    setIsSearching(true);
    setSearchError(null);
    
    try {
      const results = await SearchApi.searchPostsSemantic({
        query,
        username: currentUsername || undefined,
        lang: i18n.language || 'en'
      });
      
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching posts:', error);
      setSearchError(t('search.error'));
      setIsSearchActive(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchResults([]);
    setSearchError(null);
    setIsSearchActive(false);
    setRenderKey(prev => prev + 1);
  };

  const handlePostCreated = (newPost: PostItem) => {
    setPosts(prev => [newPost, ...prev]);
  };

  return (
    <div className="min-h-screen pt-32 pb-8 px-4">
      <div className="max-w-6xl mx-auto flex justify-center">
        <GlassCard 
          className={`w-full transition-all duration-500 relative ${
            isSearchActive 
              ? 'ring-4 ring-secondary/60 shadow-[0_0_30px_rgba(14,157,207,0.5)] animate-pulse-glow' 
              : ''
          }`}
        >
          {/* Gradient Overlay for Search */}
          {isSearchActive && (
            <div 
              className="absolute inset-0 pointer-events-none rounded-[inherit] z-0 animate-in fade-in duration-700"
              style={{
                background: `
                  linear-gradient(to bottom, rgba(14, 157, 207, 0.1) 0%, transparent 15%, transparent 85%, rgba(14, 157, 207, 0.1) 100%),
                  linear-gradient(to right, rgba(14, 157, 207, 0.1) 0%, transparent 20%, transparent 80%, rgba(14, 157, 207, 0.1) 100%)
                `
              }}
            />
          )}
          
          {/* Content with higher z-index */}
          <div className="relative z-10">
          {/* Header */}
          <div className="mb-1">
            <div className="flex items-center justify-between mb-6 relative">
              <h1 className="text-3xl font-bold text-emerald-900">{t('feed.title')}</h1>

              <div className="absolute left-1/2 -translate-x-1/2">
                <CreatePostButton 
                  onPostCreated={handlePostCreated}
                />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 ml-auto"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {t('feed.refresh')}
              </Button>
            </div>
            
            {/* Feed Type Selector */}
            <div className="flex gap-2">
              <Button
                variant={feedType === 'latest' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedType('latest')}
                disabled={isLoading}
              >
                {t('feed.latest')}
              </Button>
              <Button
                variant={feedType === 'popular' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedType('popular')}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                {t('feed.popular')}
              </Button>
            </div>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-center py-4 mb-4">
              <Spinner className="h-6 w-6" />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Search Card */}
          <div className="mb-2 pt-4">
            <SearchCard
              onSearch={handleSearch}
              onClear={handleClearSearch}
              isLoading={isSearching}
              isActive={isSearchActive}
            />
          </div>

          {/* Search Error */}
          {searchError && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
              <p className="text-red-700 text-sm">{searchError}</p>
            </div>
          )}

          {/* Posts Feed */}
          {isTransitioning ? (
            /* Transitioning state - brief blank moment */
            <div className="min-h-[400px]"></div>
          ) : isSearchActive ? (
            /* Search Results */
            searchResults.length > 0 ? (
              <div className="pt-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Masonry
                  breakpointCols={{ default: 2, 1024: 1 }}
                  className="flex -ml-6 w-auto"
                  columnClassName="pl-6 bg-clip-padding"
                >
                  {searchResults.map((post, index) => (
                    <div 
                      key={post.postId} 
                      className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
                      style={{ animationDelay: `${index * 1000}ms` }}
                    >
                      <PostCard
                        post={post}
                        onPostUpdate={handlePostUpdate}
                        onPostDelete={handlePostDelete}
                        onUsernameClick={handleUsernameClick}
                      />
                    </div>
                  ))}
                </Masonry>
              </div>
            ) : (
              /* No Search Results */
              <div className="text-center py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-8 max-w-md mx-auto border border-white/20">
                  <h3 className="text-lg font-semibold text-emerald-900 mb-2">
                    {t('search.noResults')}
                  </h3>
                  <Button
                    onClick={handleClearSearch}
                    variant="outline"
                  >
                    {t('search.clear')}
                  </Button>
                </div>
              </div>
            )
          ) : (
            /* Regular Posts Feed */
            posts.length > 0 ? (
              <div key={`normal-posts-${renderKey}`} className="space-y-8">
                {/* Posts Masonry */}
                <Masonry
                  breakpointCols={{ default: 2, 1024: 1 }}
                  className="flex -ml-6 w-auto"
                  columnClassName="pl-6 bg-clip-padding"
                >
                  {posts.map((post, index) => (
                    <div 
                      key={post.postId} 
                      className="mb-6 opacity-0 translate-y-4 animate-fade-in"
                      style={{ 
                        animationDelay: `${index * 100}ms`,
                        animationFillMode: 'forwards'
                      }}
                    >
                      <PostCard
                        post={post}
                        onPostUpdate={handlePostUpdate}
                        onPostDelete={handlePostDelete}
                        onUsernameClick={handleUsernameClick}
                      />
                    </div>
                  ))}
                </Masonry>

                {/* Load More Button */}
                {hasMorePosts && (
                  <div className="flex justify-center pt-6">
                    <Button
                      onClick={loadMorePosts}
                      disabled={isLoadingMore}
                      variant="outline"
                      size="lg"
                      className="min-w-[200px]"
                    >
                      {isLoadingMore ? (
                        <>
                          <Spinner className="h-4 w-4 mr-2" />
                          {t('feed.loadingMore')}
                        </>
                      ) : (
                        t('feed.loadMore')
                      )}
                    </Button>
                  </div>
                )}

                {/* End of Feed Message */}
                {!hasMorePosts && posts.length > 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      {t('feed.endOfFeed')}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-8 max-w-md mx-auto border border-white/20">
                  <h3 className="text-lg font-semibold text-emerald-900 mb-2">
                    {t('feed.empty.title')}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {t('feed.empty.description')}
                  </p>
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t('feed.tryAgain')}
                  </Button>
                </div>
              </div>
            )
          )}
          </div>
        </GlassCard>
      </div>
      {selectedUsername && (
        <UserProfileDialog
          username={selectedUsername}
          open={isProfileOpen}
          onOpenChange={(open) => {
            setIsProfileOpen(open);
            if (!open) {
              setSelectedUsername(null);
            }
          }}
          onUsernameClick={handleUsernameClick}
        />
      )}
    </div>
  );
}