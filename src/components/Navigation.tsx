import { Home, Search, Plus, Heart, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onUpload: () => void;
}

const Navigation = ({ activeTab, onTabChange, onUpload }: NavigationProps) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'notifications', icon: Heart, label: 'Notifications' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {navItems.map((item, index) => (
          <div key={item.id} className="flex-1 flex justify-center">
            {index === 2 ? (
              // Upload button in the center
              <Button
                onClick={onUpload}
                size="icon"
                className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white border-0 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200"
              >
                <Plus className="w-6 h-6" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-12 h-12 rounded-full transition-all duration-200",
                  activeTab === item.id
                    ? "text-primary bg-primary/10 scale-110"
                    : "text-muted-foreground hover:text-foreground hover:scale-105"
                )}
              >
                <item.icon className="w-6 h-6" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;