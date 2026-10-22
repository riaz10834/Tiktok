import { useState, useEffect, useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditProfileModal = ({ isOpen, onClose }: EditProfileModalProps) => {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setUsername(user.username);
      setDisplayName(user.displayName);
      setBio(user.bio || '');
      setAvatarPreview(user.avatar || '');
      setAvatarFile(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const { user: updated } = await api.updateProfile({
        username: username.trim(),
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatarFile,
      });
      setUser(updated);
      toast({ description: 'Profile updated!' });
      onClose();
    } catch (err) {
      toast({
        description: err instanceof Error ? err.message : 'Update failed',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[100] bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button type="button" onClick={onClose} className="p-2 -ml-2 text-muted-foreground">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-base font-semibold">Edit profile</h2>
        <Button
          type="submit"
          form="edit-profile-form"
          disabled={loading}
          size="sm"
          className="bg-primary text-primary-foreground"
        >
          {loading ? '...' : 'Save'}
        </Button>
      </div>

      <form
        id="edit-profile-form"
        onSubmit={handleSave}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-5"
      >
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative w-24 h-24 rounded-full overflow-hidden bg-muted group"
          >
            <img
              src={avatarPreview || user?.avatar}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-100">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-sm text-primary font-medium"
          >
            Change photo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Name</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            placeholder="Display name"
            className="bg-card border-border"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Username</label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="username"
            className="bg-card border-border"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Bio</label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={150}
            placeholder="Tell people about yourself..."
            className="min-h-[90px] bg-card border-border"
          />
          <p className="text-xs text-muted-foreground text-right">{bio.length}/150</p>
        </div>
      </form>
    </div>
  );
};

export default EditProfileModal;
