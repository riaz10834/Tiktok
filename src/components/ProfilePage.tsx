import { useState } from "react";
import { Settings, Grid, Heart } from "lucide-react";
import { FaRegComment, FaRegBookmark } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import EditProfileModal from "@/components/EditProfileModal";

interface Video {
  id: string;
  url: string;
  thumbnail: string;
  likes: number;
  comments: number;
  favorites: number;
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
  favoriteVideos: Video[];
  onVideoClick: (videoId: string) => void;
  onLogout?: () => void;
  onLoginClick?: () => void;
}

const ProfilePage = ({
  user,
  myVideos,
  likedVideos,
  favoriteVideos,
  onVideoClick,
  onLogout,
}: ProfilePageProps) => {
  const [activeTab, setActiveTab] = useState("my-videos");
  const [editOpen, setEditOpen] = useState(false);

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
            className="aspect-[9/16] bg-card rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative"
          >
            <video
              src={video.url}
              className="w-full h-full object-cover"
              muted
              preload="metadata"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-2 left-2 right-2 flex justify-between text-white text-xs">
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {formatCount(video.likes)}
              </div>
              <div className="flex items-center gap-1">
                <FaRegComment className="w-3 h-3" />
                {formatCount(video.comments)}
              </div>
              <div className="flex items-center gap-1">
                <FaRegBookmark className="w-3 h-3" />
                {formatCount(video.favorites)}
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
    <div className="relative h-full bg-background text-foreground">
      <div className="h-full overflow-y-auto pb-4">
        <div className="flex items-center justify-center p-4 relative">
          <h2 className="text-lg font-semibold">{user.displayName}</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3"
            onClick={() => setEditOpen(true)}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Profile Image + Username */}
        <div className="flex flex-col items-center px-4">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-muted mb-2">
            <img
              src={user.avatar}
              alt={user.displayName}
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-xl font-bold">@{user.username}</h1>
          {user.bio && (
            <p className="text-sm text-muted-foreground mt-1">{user.bio}</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex justify-around text-center px-8 mt-4">
          <div>
            <div className="text-lg font-bold">{formatCount(user.following)}</div>
            <div className="text-sm text-muted-foreground">Following</div>
          </div>
          <div>
            <div className="text-lg font-bold">{formatCount(user.followers)}</div>
            <div className="text-sm text-muted-foreground">Followers</div>
          </div>
          <div>
            <div className="text-lg font-bold">{formatCount(user.likes)}</div>
            <div className="text-sm text-muted-foreground">Likes</div>
          </div>
        </div>

        <div className="px-4 mt-4 space-y-2">
          <Button
            type="button"
            className="w-full"
            variant="outline"
            onClick={() => setEditOpen(true)}
          >
            Edit Profile
          </Button>
          {onLogout && (
            <Button type="button" className="w-full" variant="destructive" onClick={onLogout}>
              Log out
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 mt-6">
          <TabsList className="w-full border-b border-border rounded-none p-0 h-auto">
            <TabsTrigger
              value="my-videos"
              className={cn(
                "flex-1 py-3 border-b-2 data-[state=active]:border-primary",
                activeTab === "my-videos"
                  ? "text-primary"
                  : "border-transparent text-muted-foreground"
              )}
            >
              <Grid className="w-4 h-4 mr-1" /> My Videos
            </TabsTrigger>
            <TabsTrigger
              value="liked"
              className={cn(
                "flex-1 py-3 border-b-2 data-[state=active]:border-primary",
                activeTab === "liked"
                  ? "text-primary"
                  : "border-transparent text-muted-foreground"
              )}
            >
              <Heart className="w-4 h-4 mr-1" /> Liked
            </TabsTrigger>
            <TabsTrigger
              value="favorites"
              className={cn(
                "flex-1 py-3 border-b-2 data-[state=active]:border-primary",
                activeTab === "favorites"
                  ? "text-primary"
                  : "border-transparent text-muted-foreground"
              )}
            >
              <FaRegBookmark className="w-4 h-4 mr-1" /> Favorites
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-videos" className="mt-4">
            <VideoGrid videos={myVideos} />
          </TabsContent>
          <TabsContent value="liked" className="mt-4">
            <VideoGrid videos={likedVideos} />
          </TabsContent>
          <TabsContent value="favorites" className="mt-4">
            <VideoGrid videos={favoriteVideos} />
          </TabsContent>
        </Tabs>
      </div>

      <EditProfileModal isOpen={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
};

export default ProfilePage;
