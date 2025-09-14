import { useState, useEffect } from 'react';
import VideoFeed from '@/components/VideoFeed';
import Navigation from '@/components/Navigation';
import UploadModal from '@/components/UploadModal';
import SearchPage from '@/components/SearchPage';
import ProfilePage from '@/components/ProfilePage';
import { useToast } from '@/hooks/use-toast';

interface Video {
  id: string;
  url: string;
  username: string;
  description: string;
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
  avatar: string;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [user, setUser] = useState({
    username: 'myusername',
    displayName: 'My Display Name',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
    followers: 1250,
    following: 234,
    likes: 15600,
    bio: 'Creating amazing content every day! 🎥✨'
  });
  const { toast } = useToast();

  // Mock videos for demonstration
  useEffect(() => {
    const mockVideos: Video[] = [
      {
        id: '1',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        username: 'sarah_dancer',
        description: 'Amazing dance moves! What do you think? 💃 #dance #viral #fyp',
        likes: 12400,
        comments: 892,
        shares: 234,
        liked: false,
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
      },
      {
        id: '2', 
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        username: 'mike_cook',
        description: 'Cooking the perfect pasta! Recipe in bio 👨‍🍳 #cooking #food #recipe',
        likes: 8950,
        comments: 445,
        shares: 156,
        liked: true,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
      },
      {
        id: '3',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        username: 'art_by_emma',
        description: 'Digital art process time-lapse ✨ What should I draw next? #art #digital #creative',
        likes: 15670,
        comments: 1203,
        shares: 567,
        liked: false,
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
      }
    ];
    setVideos(mockVideos);
  }, []);

  const handleLike = (videoId: string) => {
    setVideos(prevVideos => 
      prevVideos.map(video => 
        video.id === videoId
          ? {
              ...video,
              likes: video.likes + 1
            }
          : video
      )
    );
    
    toast({
      description: "Liked! ❤️",
      duration: 1500,
    });
  };

  const handleComment = (videoId: string) => {
    // This function is no longer used since we open the modal directly
  };

  const handleAddComment = (videoId: string, comment: string) => {
    setVideos(prevVideos =>
      prevVideos.map(video =>
        video.id === videoId
          ? { ...video, comments: video.comments + 1 }
          : video
      )
    );
    
    toast({
      description: "Comment added! 💬",
      duration: 2000,
    });
  };

  const handleShare = (videoId: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this amazing video!',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        description: "Link copied to clipboard! 📋",
        duration: 2000,
      });
    }
  };

  const handleUpload = (newVideo: { url: string; description: string }) => {
    const video: Video = {
      id: Date.now().toString(),
      url: newVideo.url,
      username: user.username,
      description: newVideo.description,
      likes: 0,
      comments: 0,
      shares: 0,
      liked: false,
      avatar: user.avatar
    };
    
    setVideos(prevVideos => [video, ...prevVideos]);
    toast({
      description: "Video uploaded successfully! 🎉",
      duration: 3000,
    });
  };

  const handleFollow = (userId: string) => {
    toast({
      description: "Follow feature activated! 👥",
      duration: 2000,
    });
  };

  const handleVideoClick = (videoId: string) => {
    setActiveTab('home');
    // Navigate to specific video in feed
  };

  // Mock data for profile page
  const myVideos = videos.filter(v => v.username === user.username).map(v => ({
    id: v.id,
    url: v.url,
    thumbnail: v.url,
    likes: v.likes,
    views: Math.floor(Math.random() * 50000) + 1000
  }));

  const likedVideos = videos.filter((_, index) => index % 2 === 0).map(v => ({
    id: v.id,
    url: v.url,
    thumbnail: v.url,
    likes: v.likes,
    views: Math.floor(Math.random() * 50000) + 1000
  }));

  const sharedVideos = videos.filter((_, index) => index % 3 === 0).map(v => ({
    id: v.id,
    url: v.url,
    thumbnail: v.url,
    likes: v.likes,
    views: Math.floor(Math.random() * 50000) + 1000
  }));

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <VideoFeed
            videos={videos}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onAddComment={handleAddComment}
          />
        );
      case 'search':
        return <SearchPage onFollow={handleFollow} />;
      case 'notifications':
        return (
          <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Notifications</h2>
              <p className="text-muted-foreground">Stay tuned for updates! 🔔</p>
            </div>
          </div>
        );
      case 'profile':
        return (
          <ProfilePage
            user={user}
            myVideos={myVideos}
            likedVideos={likedVideos}
            sharedVideos={sharedVideos}
            onVideoClick={handleVideoClick}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderContent()}
      
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onUpload={() => setIsUploadOpen(true)}
      />
      
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  );
};

export default Index;
