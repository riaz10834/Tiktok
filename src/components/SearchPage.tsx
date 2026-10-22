import { useState, useEffect } from 'react';
import { Search, UserPlus, UserCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api, SearchUser } from '@/lib/api';

interface SearchPageProps {
  onFollow: (userId: string) => void;
  requireLogin: () => boolean;
}

const SearchPage = ({ onFollow, requireLogin }: SearchPageProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const loadUsers = async (q = '') => {
    setIsSearching(true);
    try {
      const { users } = await api.searchUsers(q);
      setUsers(users);
    } catch {
      setUsers([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleFollowToggle = async (userId: string) => {
    if (!requireLogin()) return;
    try {
      const { isFollowing, followers } = await api.followUser(userId);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isFollowing, followers } : u
        )
      );
      onFollow(userId);
    } catch {
      // parent may toast
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    loadUsers(query);
  };

  const formatFollowers = (count: number) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const UserRow = ({ user }: { user: SearchUser }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card hover:bg-card/80 transition-colors">
      <img
        src={user.avatar}
        alt={user.displayName}
        className="w-12 h-12 rounded-full object-cover"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">{user.displayName}</h3>
        <p className="text-sm text-muted-foreground">
          @{user.username} • {formatFollowers(user.followers)} followers
        </p>
      </div>
      <Button
        onClick={() => handleFollowToggle(user.id)}
        variant={user.isFollowing ? 'outline' : 'default'}
        size="sm"
        className={cn(
          'px-4 transition-all duration-200',
          user.isFollowing
            ? 'border-border text-foreground hover:bg-destructive hover:text-destructive-foreground'
            : 'bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white border-0'
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
  );

  return (
    <div className="h-full overflow-y-auto bg-background text-foreground pt-4 pb-4">
      <div className="w-full px-4">
        <div className="sticky top-0 bg-background/95 backdrop-blur-lg z-10 pb-4">
          <h1 className="text-2xl font-bold mb-4">Discover</h1>
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

        <div className="space-y-3">
          {isSearching ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length > 0 ? (
            <>
              {!searchQuery.trim() && (
                <h2 className="text-lg font-semibold">Creators</h2>
              )}
              {users.map((user) => (
                <UserRow key={user.id} user={user} />
              ))}
            </>
          ) : (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {searchQuery.trim()
                  ? `No users found for "${searchQuery}"`
                  : 'No users yet — create an account!'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
