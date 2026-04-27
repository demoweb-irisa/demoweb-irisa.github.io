export interface Video {
  id: string;
  slug?: string;
  body: string;
  collection: string;
  data: VideoData;
}

export interface VideoData {
  title: string;
  date: Date;
  description: string;
  category: VideoCategory;
  tags: VideoTag[];
  thumbnail?: string;
  videoFile: string;
  duration?: number;
  featured: boolean;
}

export type VideoCategory = 
  | 'tutorial'
  | 'presentation'
  | 'demo'
  | 'webinar'
  | 'vlog'
  | 'interview'
  | 'other';

export type VideoTag =
  | 'frontend'
  | 'backend'
  | 'astro'
  | 'vuejs'
  | 'typescript'
  | 'javascript'
  | 'css'
  | 'devops'
  | 'database'
  | 'api'
  | 'mobile'
  | 'performance'
  | 'security'
  | 'design'
  | 'ux-ui';

export interface VideoFilters {
  category?: VideoCategory;
  tags?: VideoTag[];
  search?: string;
  sortBy?: 'date' | 'title' | 'duration';
  sortOrder?: 'asc' | 'desc';
}