import { useState, useEffect } from 'react';
import VideoFeed from '@/components/VideoFeed';
import Navigation from '@/components/Navigation';
import UploadModal from '@/components/UploadModal';
import SearchPage from '@/components/SearchPage';
import ProfilePage from '@/components/ProfilePage';
import AuthModal from '@/components/AuthModal';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { api, Video, ProfileVideo } from '@/lib/api';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [myVideos, setMyVideos] = useState<ProfileVideo[]>([]);
  const [likedVideos, setLikedVideos] = useState<ProfileVideo[]>([]);
  const [favoriteVideos, setFavoriteVideos] = useState<ProfileVideo[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const { toast } = useToast();

  const requireLogin = () => {
    if (!user) {
      setIsAuthOpen(true);
      return false;
    }
    return true;
  };

  const loadVideos = async () => {
    try {
      setLoadingFeed(true);
      const { videos } = await api.getVideos();
      setVideos(videos);
    } catch (err) {
      toast({
        description: err instanceof Error ? err.message : 'Failed to load videos',
        variant: 'destructive',
      });
    } finally {
      setLoadingFeed(false);
    }
  };

  const loadProfile = async () => {
    if (!user) {
      setMyVideos([]);
      setLikedVideos([]);
      setFavoriteVideos([]);
      return;
    }
    try {
      const data = await api.getProfile(user.id);
      setMyVideos(data.myVideos);
      setLikedVideos(data.likedVideos);
      setFavoriteVideos(data.favoriteVideos);
      await refreshUser();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!authLoading) loadVideos();
  }, [authLoading, user?.id]);

  useEffect(() => {
    if (activeTab === 'profile' && user) loadProfile();
  }, [activeTab, user?.id]);

  const handleLike = async (videoId: string) => {
    if (!requireLogin()) return;
    try {
      const { liked, likes } = await api.likeVideo(videoId);
      setVideos((prev) =>
        prev.map((v) => (v.id === videoId ? { ...v, liked, likes } : v))
      );
    } catch (err) {
      toast({
        description: err instanceof Error ? err.message : 'Like failed',
        variant: 'destructive',
      });
    }
  };

  const handleComment = (_videoId: string) => {};

  const handleAddComment = (_videoId: string, _comment: string) => {
    setVideos((prev) =>
      prev.map((v) =>
        v.id === _videoId ? { ...v, comments: v.comments + 1 } : v
      )
    );
  };

  const handleDeleteComment = (videoId: string, removed: number) => {
    setVideos((prev) =>
      prev.map((v) =>
        v.id === videoId
          ? { ...v, comments: Math.max(0, v.comments - removed) }
          : v
      )
    );
  };

  const handleShare = async (videoId: string) => {
    try {
      const { shares } = await api.shareVideo(videoId);
      setVideos((prev) =>
        prev.map((v) => (v.id === videoId ? { ...v, shares } : v))
      );
    } catch {
      // ignore
    }

    if (navigator.share) {
      navigator.share({
        title: 'Check out this video!',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ description: 'Link copied!', duration: 2000 });
    }
  };

  const handleUpload = async (file: File, description: string) => {
    if (!requireLogin()) return;
    try {
      const { video } = await api.uploadVideo(file, description);
      setVideos((prev) => [video, ...prev]);
      toast({ description: 'Video uploaded!', duration: 3000 });
      await loadProfile();
    } catch (err) {
      toast({
        description: err instanceof Error ? err.message : 'Upload failed',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const handleFollow = async (userId: string) => {
    if (!requireLogin()) return;
    try {
      await api.followUser(userId);
      toast({ description: 'Updated follow!', duration: 2000 });
    } catch (err) {
      toast({
        description: err instanceof Error ? err.message : 'Follow failed',
        variant: 'destructive',
      });
    }
  };

  const handleVideoClick = (_videoId: string) => {
    setActiveTab('home');
  };

  const handleUploadClick = () => {
    if (!requireLogin()) return;
    setIsUploadOpen(true);
  };

  const handleTabChange = (tab: string) => {
    if ((tab === 'profile' || tab === 'notifications') && !user) {
      setIsAuthOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        if (loadingFeed) {
          return (
            <div className="flex items-center justify-center h-full bg-background text-foreground">
              <p className="text-muted-foreground">Loading feed...</p>
            </div>
          );
        }
        if (videos.length === 0) {
          return (
            <div className="flex items-center justify-center h-full bg-background text-foreground pb-20">
              <div className="text-center px-6">
                <h2 className="text-2xl font-bold mb-2">No videos yet</h2>
                <p className="text-muted-foreground mb-4">
                  Create an account and upload the first video!
                </p>
                {!user && (
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="text-primary font-medium underline"
                  >
                    Sign up / Log in
                  </button>
                )}
              </div>
            </div>
          );
        }
        return (
          <VideoFeed
            videos={videos}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
            requireLogin={requireLogin}
          />
        );
      case 'search':
        return <SearchPage onFollow={handleFollow} requireLogin={requireLogin} />;
      case 'notifications':
        return (
          <div className="flex items-center justify-center h-full bg-background text-foreground pb-20">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Notifications</h2>
              <p className="text-muted-foreground">No new notifications</p>
            </div>
          </div>
        );
      case 'profile':
        if (!user) return null;
        return (
          <ProfilePage
            user={user}
            myVideos={myVideos}
            likedVideos={likedVideos}
            favoriteVideos={favoriteVideos}
            onVideoClick={handleVideoClick}
            onLogout={() => {
              logout();
              setActiveTab('home');
              toast({ description: 'Logged out' });
            }}
            onLoginClick={() => setIsAuthOpen(true)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[100dvh] bg-neutral-950 flex items-center justify-center md:p-6">
      <div className="relative w-full max-w-[430px] h-[100dvh] md:h-[min(860px,100dvh)] md:rounded-[28px] overflow-hidden bg-background shadow-2xl md:border md:border-white/10">
        {!user && !authLoading && (
          <button
            onClick={() => setIsAuthOpen(true)}
            className="absolute top-3 right-3 z-50 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-blue-500 text-white text-xs font-medium shadow-lg"
          >
            Log in
          </button>
        )}

        <div className="absolute inset-0 bottom-[60px] overflow-hidden">
          {renderContent()}
        </div>

        <UploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onUpload={handleUpload}
        />

        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

        <Navigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onUpload={handleUploadClick}
        />
      </div>
    </div>
  );
};

export default Index;
