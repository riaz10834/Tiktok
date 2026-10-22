// Same-origin `/api` in production (Vercel rewrite → server service).
// Local Vite can proxy `/api` to Express, or set VITE_API_URL.
const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data as T;
}

export const api = {
  register: (body: {
    username: string;
    displayName: string;
    email: string;
    password: string;
  }) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  me: () => request<{ user: User }>('/auth/me'),

  updateProfile: (body: {
    username?: string;
    displayName?: string;
    bio?: string;
    avatarFile?: File | null;
    avatarUrl?: string;
  }) => {
    const form = new FormData();
    if (body.username !== undefined) form.append('username', body.username);
    if (body.displayName !== undefined) form.append('displayName', body.displayName);
    if (body.bio !== undefined) form.append('bio', body.bio);
    if (body.avatarUrl) form.append('avatarUrl', body.avatarUrl);
    if (body.avatarFile) form.append('avatar', body.avatarFile);
    return request<{ user: User }>('/auth/profile', {
      method: 'PUT',
      body: form,
    });
  },

  getVideos: () => request<{ videos: Video[] }>('/videos'),

  uploadVideo: (file: File, description: string) => {
    const form = new FormData();
    form.append('video', file);
    form.append('description', description);
    return request<{ video: Video }>('/videos', { method: 'POST', body: form });
  },

  likeVideo: (id: string) =>
    request<{ liked: boolean; likes: number }>(`/videos/${id}/like`, {
      method: 'POST',
    }),

  shareVideo: (id: string) =>
    request<{ shares: number }>(`/videos/${id}/share`, { method: 'POST' }),

  getComments: (id: string) =>
    request<{ comments: Comment[] }>(`/videos/${id}/comments`),

  addComment: (id: string, text: string, parentId?: string) =>
    request<{ comment: Comment }>(`/videos/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text, parentId }),
    }),

  likeComment: (commentId: string) =>
    request<{ liked: boolean; likes: number }>(
      `/videos/comments/${commentId}/like`,
      { method: 'POST' }
    ),

  deleteComment: (commentId: string) =>
    request<{ ok: boolean; removed: number; videoId: string }>(
      `/videos/comments/${commentId}`,
      { method: 'DELETE' }
    ),

  searchUsers: (q: string) =>
    request<{ users: SearchUser[] }>(`/users/search?q=${encodeURIComponent(q)}`),

  getProfile: (id: string) =>
    request<{
      user: User;
      myVideos: ProfileVideo[];
      likedVideos: ProfileVideo[];
      favoriteVideos: ProfileVideo[];
    }>(`/users/${id}/profile`),

  followUser: (id: string) =>
    request<{ isFollowing: boolean; followers: number }>(`/users/${id}/follow`, {
      method: 'POST',
    }),
};

export interface User {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  likes: number;
}

export interface Video {
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

export interface Comment {
  id: string;
  parentId?: string | null;
  userId?: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: string;
  likes: number;
  liked?: boolean;
  isMine?: boolean;
  replies?: Comment[];
}

export interface SearchUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  followers: number;
  following: number;
  isFollowing: boolean;
}

export interface ProfileVideo {
  id: string;
  url: string;
  thumbnail: string;
  likes: number;
  comments: number;
  favorites: number;
  views: number;
}
