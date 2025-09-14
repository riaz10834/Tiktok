import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share, ChevronUp, ChevronDown, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import CommentsModal from './CommentsModal';

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

interface VideoFeedProps {
  videos: Video[];
  onLike: (videoId: string) => void;
  onComment: (videoId: string) => void;
  onShare: (videoId: string) => void;
}

const VideoFeed = ({ videos, onLike, onComment, onShare }: VideoFeedProps) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const currentVideo = videos[currentVideoIndex];

  useEffect(() => {
    // Auto-play current video
    const currentVideoElement = videoRefs.current[currentVideoIndex];
    if (currentVideoElement) {
      currentVideoElement.play().catch(() => {
        // Handle autoplay restrictions
      });
    }

    // Pause other videos
    videoRefs.current.forEach((video, index) => {
      if (video && index !== currentVideoIndex) {
        video.pause();
      }
    });
  }, [currentVideoIndex]);

  const scrollToNext = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  const scrollToPrevious = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  const formatCount = (count: number) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  if (!currentVideo) return null;

  return (
    <div className="relative h-screen w-full bg-background overflow-hidden">
      {/* Video Container */}
      <div className="absolute inset-0">
        <video
          ref={(el) => (videoRefs.current[currentVideoIndex] = el)}
          src={currentVideo.url}
          className="w-full h-full object-cover"
          loop
          muted={isMuted}
          playsInline
          preload="metadata"
        />
        
        {/* Video Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Navigation Controls */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={scrollToPrevious}
          disabled={currentVideoIndex === 0}
          className="w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white border-white/20 hover:border-white/40 backdrop-blur-sm disabled:opacity-30"
        >
          <ChevronUp className="w-6 h-6" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={scrollToNext}
          disabled={currentVideoIndex === videos.length - 1}
          className="w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white border-white/20 hover:border-white/40 backdrop-blur-sm disabled:opacity-30"
        >
          <ChevronDown className="w-6 h-6" />
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="absolute right-4 bottom-20 flex flex-col items-center gap-6 z-20">
        {/* Profile Avatar */}
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white">
          <img 
            src={currentVideo.avatar} 
            alt={currentVideo.username}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Like Button */}
        <div className="flex flex-col items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onLike(currentVideo.id)}
            className={cn(
              "w-12 h-12 rounded-full hover:scale-110 transition-all duration-200",
              currentVideo.liked 
                ? "text-red-500 animate-heart-beat" 
                : "text-white hover:text-red-400"
            )}
          >
            <Heart className={cn("w-7 h-7", currentVideo.liked && "fill-current")} />
          </Button>
          <span className="text-white text-sm font-medium">
            {formatCount(currentVideo.likes)}
          </span>
        </div>

        {/* Comment Button */}
        <div className="flex flex-col items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCommentsOpen(true)}
            className="w-12 h-12 rounded-full text-white hover:text-blue-400 hover:scale-110 transition-all duration-200"
          >
            <MessageCircle className="w-7 h-7" />
          </Button>
          <span className="text-white text-sm font-medium">
            {formatCount(currentVideo.comments)}
          </span>
        </div>

        {/* Share Button */}
        <div className="flex flex-col items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onShare(currentVideo.id)}
            className="w-12 h-12 rounded-full text-white hover:text-yellow-400 hover:scale-110 transition-all duration-200"
          >
            <Share className="w-7 h-7" />
          </Button>
          <span className="text-white text-sm font-medium">
            {formatCount(currentVideo.shares)}
          </span>
        </div>

        {/* Mute Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMuted(!isMuted)}
          className="w-12 h-12 rounded-full text-white hover:text-gray-300 hover:scale-110 transition-all duration-200"
        >
          {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </Button>
      </div>

      {/* Video Info */}
      <div className="absolute bottom-4 left-4 right-20 z-20">
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-lg">@{currentVideo.username}</h3>
          <p className="text-white/90 text-sm leading-relaxed">
            {currentVideo.description}
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 z-20">
        {videos.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-8 h-1 rounded-full transition-all duration-300",
              index === currentVideoIndex 
                ? "bg-white" 
                : "bg-white/30"
            )}
          />
        ))}
      </div>

      {/* Comments Modal */}
      <CommentsModal
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        videoId={currentVideo.id}
        videoUsername={currentVideo.username}
      />
    </div>
  );
};

export default VideoFeed;