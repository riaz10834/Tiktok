import { useState } from 'react';
import { Search, UserPlus, UserCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  followers: number;
  isFollowing: boolean;
  verified?: boolean;
}

interface SearchPageProps {
  onFollow: (userId: string) => void;
}

const SearchPage = ({ onFollow }: SearchPageProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Mock users for demonstration
  const mockUsers: User[] = [
    {
      id: '1',
      username: 'sarah_dancer',
      displayName: 'Sarah Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      followers: 45600,
      isFollowing: false,
      verified: true
    },
    {
      id: '2',
      username: 'mike_cook',
      displayName: 'Mike Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      followers: 23400,
      isFollowing: true
    },
    {
      id: '3',
      username: 'art_by_emma',
      displayName: 'Emma Wilson',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      followers: 67800,
      isFollowing: false,
      verified: true
    },
    {
      id: '4',
      username: 'fitness_alex',
      displayName: 'Alex Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      followers: 34200,
      isFollowing: false
    }
  ];

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      setIsSearching(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const filtered = mockUsers.filter(user => 
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.displayName.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  const formatFollowers = (count: number) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-4 pb-20">
      <div className="max-w-md mx-auto px-4">
        {/* Search Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-lg z-10 pb-4">
          <h1 className="text-2xl font-bold mb-4">Discover</h1>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search users..."
              className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Search Results */}
        <div className="space-y-3">
          {isSearching ? (
            // Loading skeleton
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                  <div className="w-20 h-8 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : searchResults.length > 0 ? (
            // Search results
            searchResults.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg bg-card hover:bg-card/80 transition-colors">
                <div className="relative">
                  <img
                    src={user.avatar}
                    alt={user.displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {user.verified && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {user.displayName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    @{user.username} • {formatFollowers(user.followers)} followers
                  </p>
                </div>
                
                <Button
                  onClick={() => onFollow(user.id)}
                  variant={user.isFollowing ? "outline" : "default"}
                  size="sm"
                  className={cn(
                    "px-4 transition-all duration-200",
                    user.isFollowing
                      ? "border-border text-foreground hover:bg-secondary"
                      : "bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white border-0"
                  )}
                >
                  {user.isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4 mr-1" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-1" />
                      Follow
                    </>
                  )}
                </Button>
              </div>
            ))
          ) : searchQuery.trim() ? (
            // No results
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No users found for "{searchQuery}"</p>
            </div>
          ) : (
            // Popular suggestions when no search
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Popular Creators</h2>
              {mockUsers.slice(0, 3).map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg bg-card hover:bg-card/80 transition-colors">
                  <div className="relative">
                    <img
                      src={user.avatar}
                      alt={user.displayName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {user.verified && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {user.displayName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      @{user.username} • {formatFollowers(user.followers)} followers
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => onFollow(user.id)}
                    variant={user.isFollowing ? "outline" : "default"}
                    size="sm"
                    className={cn(
                      "px-4 transition-all duration-200",
                      user.isFollowing
                        ? "border-border text-foreground hover:bg-secondary"
                        : "bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white border-0"
                    )}
                  >
                    {user.isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4 mr-1" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-1" />
                        Follow
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;