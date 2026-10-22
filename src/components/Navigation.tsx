import { Home, Search, Plus, Heart, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onUpload: () => void;
}

const Navigation = ({ activeTab, onTabChange, onUpload }: NavigationProps) => {
  const left = [
    { id: 'home', icon: Home },
    { id: 'search', icon: Search },
  ];
  const right = [
    { id: 'notifications', icon: Heart },
    { id: 'profile', icon: User },
  ];

  return (
    <nav className="absolute bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md">
      <div className="flex items-center justify-around py-2 px-2">
        {left.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            size="icon"
            onClick={() => onTabChange(item.id)}
            className={cn(
              'w-12 h-12 rounded-full transition-all duration-200',
              activeTab === item.id
                ? 'text-primary bg-primary/10 scale-110'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon className="w-6 h-6" />
          </Button>
        ))}

        <Button
          onClick={onUpload}
          size="icon"
          className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white border-0 shadow-lg"
        >
          <Plus className="w-6 h-6" />
        </Button>

        {right.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            size="icon"
            onClick={() => onTabChange(item.id)}
            className={cn(
              'w-12 h-12 rounded-full transition-all duration-200',
              activeTab === item.id
                ? 'text-primary bg-primary/10 scale-110'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon className="w-6 h-6" />
          </Button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
