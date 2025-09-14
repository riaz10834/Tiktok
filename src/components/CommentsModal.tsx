import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Comment {
  id: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: string;
  likes: number;
}

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  videoUsername: string;
}

const CommentsModal = ({ isOpen, onClose, videoId, videoUsername }: CommentsModalProps) => {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      username: 'john_doe',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      text: 'Amazing video! Love it! 🔥',
      timestamp: '2h',
      likes: 12
    },
    {
      id: '2',
      username: 'sarah_music',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      text: 'This is so creative! How did you make this?',
      timestamp: '1h',
      likes: 8
    },
    {
      id: '3',
      username: 'mike_artist',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      text: 'Perfect! Can you do a tutorial?',
      timestamp: '45m',
      likes: 5
    }
  ]);
  
  const [newComment, setNewComment] = useState('');

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        username: 'myusername',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
        text: newComment,
        timestamp: 'now',
        likes: 0
      };
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddComment();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50">
      <div className="bg-card w-full max-w-md h-[70vh] rounded-t-2xl animate-slide-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Comments ({comments.length})
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Comments List */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={comment.avatar} alt={comment.username} />
                  <AvatarFallback>{comment.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground text-sm">
                      {comment.username}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {comment.timestamp}
                    </span>
                  </div>
                  
                  <p className="text-foreground text-sm leading-relaxed">
                    {comment.text}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <button className="text-muted-foreground hover:text-red-400 text-xs transition-colors">
                      ❤️ {comment.likes}
                    </button>
                    <button className="text-muted-foreground hover:text-foreground text-xs transition-colors">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Add Comment Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-3 items-center">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face" alt="You" />
              <AvatarFallback>M</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-muted border-0 focus:ring-1 focus:ring-primary"
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                size="icon"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentsModal;