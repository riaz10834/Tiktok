import { useState } from 'react';
import { Settings, Grid, Heart, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Video {
  id: string;
  url: string;
  thumbnail: string;
  likes: number;
  views: number;
}

interface ProfilePageProps {
  user: {
    username: string;
    displayName: string;
    avatar: string;
    followers: number;
    following: number;
    likes: number;
    bio: string;
  };
  myVideos: Video[];
  likedVideos: Video[];
  sharedVideos: Video[];
  onVideoClick: (videoId: string) => void;
}

const ProfilePage = ({ 
  user, 
  myVideos, 
  likedVideos, 
  sharedVideos, 
  onVideoClick 
}: ProfilePageProps) => {
  const [activeTab, setActiveTab] = useState('my-videos');

  const formatCount = (count: number) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const VideoGrid = ({ videos }: { videos: Video[] }) => (
    <div className="grid grid-cols-3 gap-1">
      {videos.length > 0 ? (
        videos.map((video) => (
          <div
            key={video.id}
            onClick={() => onVideoClick(video.id)}
            className="aspect-[9/16] bg-card rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="relative w-full h-full">
              <video
                src={video.url}
                className="w-full h-full object-cover"
                muted
                preload="metadata"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-2 left-2 flex items-center gap-1">
                <Heart className="w-3 h-3 text-white" />
                <span className="text-xs text-white font-medium">
                  {formatCount(video.likes)}
                </span>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="col-span-3 flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
            <Grid className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No videos yet</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">@{user.username}</h1>
          <Button variant="ghost" size="icon" className="text-foreground">
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Profile Info */}
        <div className="px-4 pb-6">
          <div className="flex items-start gap-4 mb-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full overflow-hidden bg-muted">
              <img
                src={user.avatar}
                alt={user.displayName}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Stats */}
            <div className="flex-1 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-foreground">
                  {formatCount(user.following)}
                </div>
                <div className="text-sm text-muted-foreground">Following</div>
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">
                  {formatCount(user.followers)}
                </div>
                <div className="text-sm text-muted-foreground">Followers</div>
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">
                  {formatCount(user.likes)}
                </div>
                <div className="text-sm text-muted-foreground">Likes</div>
              </div>
            </div>
          </div>

          {/* Name and Bio */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              {user.displayName}
            </h2>
            {user.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {user.bio}
              </p>
            )}
          </div>

          {/* Edit Profile Button */}
          <Button 
            variant="outline" 
            className="w-full mt-4 border-border text-foreground hover:bg-secondary"
          >
            Edit Profile
          </Button>
        </div>

        {/* Video Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
          <TabsList className="w-full bg-transparent border-b border-border rounded-none p-0 h-auto">
            <TabsTrigger
              value="my-videos"
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 border-b-2 rounded-none bg-transparent data-[state=active]:bg-transparent",
                activeTab === "my-videos"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
              )}
            >
              <Grid className="w-4 h-4" />
              <span className="text-sm font-medium">My Videos</span>
            </TabsTrigger>
            <TabsTrigger
              value="liked"
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 border-b-2 rounded-none bg-transparent data-[state=active]:bg-transparent",
                activeTab === "liked"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
              )}
            >
              <Heart className="w-4 h-4" />
              <span className="text-sm font-medium">Liked</span>
            </TabsTrigger>
            <TabsTrigger
              value="shared"
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 border-b-2 rounded-none bg-transparent data-[state=active]:bg-transparent",
                activeTab === "shared"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
              )}
            >
              <Share className="w-4 h-4" />
              <span className="text-sm font-medium">Shared</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="my-videos" className="mt-0">
              <VideoGrid videos={myVideos} />
            </TabsContent>
            
            <TabsContent value="liked" className="mt-0">
              <VideoGrid videos={likedVideos} />
            </TabsContent>
            
            <TabsContent value="shared" className="mt-0">
              <VideoGrid videos={sharedVideos} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;