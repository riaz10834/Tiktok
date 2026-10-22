import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share, ChevronUp, ChevronDown, Volume2, VolumeX, Play, Pause } from 'lucide-react';
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
  onAddComment: (videoId: string, comment: string) => void;
  onDeleteComment?: (videoId: string, removed: number) => void;
  requireLogin?: () => boolean;
}

const VideoFeed = ({ videos, onLike, onShare, onAddComment, onDeleteComment, requireLogin }: VideoFeedProps) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const lastTapRef = useRef(0);

  const currentVideo = videos[currentVideoIndex];

  useEffect(() => {
    const el = videoRefs.current[currentVideoIndex];
    if (el) {
      el.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
    videoRefs.current.forEach((video, index) => {
      if (video && index !== currentVideoIndex) video.pause();
    });
  }, [currentVideoIndex]);

  const togglePlayPause = () => {
    const el = videoRefs.current[currentVideoIndex];
    if (!el) return;
    if (el.paused) {
      el.play().then(() => setIsPlaying(true)).catch(() => {});
      setIsPlaying(true);
    } else {
      el.pause();
      setIsPlaying(false);
    }
    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 500);
  };

  const handleScreenTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      lastTapRef.current = 0;
      if (requireLogin && !requireLogin()) return;
      if (!currentVideo.liked) onLike(currentVideo.id);
      setHeartBurst(true);
      setTimeout(() => setHeartBurst(false), 700);
      return;
    }
    lastTapRef.current = now;
    const tapTime = now;
    setTimeout(() => {
      if (lastTapRef.current === tapTime) {
        togglePlayPause();
      }
    }, 280);
  };

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
    <div className="relative h-full w-full bg-background overflow-hidden">
      <div className="absolute inset-0" onClick={handleScreenTap}>
        <video
          ref={(el) => (videoRefs.current[currentVideoIndex] = el)}
          src={currentVideo.url}
          className="w-full h-full object-cover"
          loop
          muted={isMuted}
          playsInline
          preload="metadata"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      </div>

      {showPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white fill-white" />
            ) : (
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            )}
          </div>
        </div>
      )}

      {heartBurst && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <Heart className="w-24 h-24 text-red-500 fill-red-500 animate-ping" />
        </div>
      )}

      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            scrollToPrevious();
          }}
          disabled={currentVideoIndex === 0}
          className="w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white border-white/20 hover:border-white/40 backdrop-blur-sm disabled:opacity-30"
        >
          <ChevronUp className="w-6 h-6" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            scrollToNext();
          }}
          disabled={currentVideoIndex === videos.length - 1}
          className="w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white border-white/20 hover:border-white/40 backdrop-blur-sm disabled:opacity-30"
        >
          <ChevronDown className="w-6 h-6" />
        </Button>
      </div>

      <div
        className="absolute right-3 bottom-8 flex flex-col items-center gap-5 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white">
          <img
            src={currentVideo.avatar}
            alt={currentVideo.username}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (requireLogin && !requireLogin()) return;
              onLike(currentVideo.id);
            }}
            className="w-12 h-12 rounded-full text-white hover:text-red-400 hover:scale-110 transition-all duration-200"
          >
            <Heart
              className={cn(
                'w-7 h-7',
                currentVideo.liked && 'fill-red-500 text-red-500'
              )}
            />
          </Button>
          <span className="text-white text-sm font-medium">
            {formatCount(currentVideo.likes)}
          </span>
        </div>

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

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMuted(!isMuted)}
          className="w-12 h-12 rounded-full text-white hover:text-gray-300 hover:scale-110 transition-all duration-200"
        >
          {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </Button>
      </div>

      <div
        className="absolute bottom-10 left-4 right-20 z-20 pointer-events-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-lg">@{currentVideo.username}</h3>
          <p className="text-white/90 text-sm leading-relaxed">{currentVideo.description}</p>
        </div>
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 z-20 pointer-events-none">
        {videos.map((_, index) => (
          <div
            key={index}
            className={cn(
              'w-8 h-1 rounded-full transition-all duration-300',
              index === currentVideoIndex ? 'bg-white' : 'bg-white/30'
            )}
          />
        ))}
      </div>

      <CommentsModal
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        videoId={currentVideo.id}
        videoUsername={currentVideo.username}
        onAddComment={onAddComment}
        onDeleteComment={onDeleteComment}
        requireLogin={requireLogin}
      />
    </div>
  );
};

export default VideoFeed;
