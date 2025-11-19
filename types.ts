
export interface User {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
}

export interface Comment {
  id: string;
  user: User;
  text: string;
  timestamp: number;
  type: 'bug' | 'suggestion' | 'praise';
  gameId?: string; // Reference to game
  gameTitle?: string; // Reference to game
}

export interface Game {
  id: string;
  title: string;
  description: string;
  category: string;
  author: User;
  code: string; // HTML/JS/CSS content
  thumbnail: string;
  plays: number;
  tags: string[];
  comments: Comment[];
  ratings: Record<string, number>; // map userId -> rating
  averageRating: number;
  createdAt: number;
}

export enum ViewMode {
  BROWSE = 'BROWSE',
  PLAY = 'PLAY',
  UPLOAD = 'UPLOAD',
  PROFILE = 'PROFILE'
}
