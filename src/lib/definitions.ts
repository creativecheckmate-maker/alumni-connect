
import type { ImagePlaceholder } from './placeholder-images';

export type UserRole = 'student' | 'professor' | 'non-teaching-staff';

type BaseUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  university: string;
  college: string;
  branch?: string;
  batch?: string;
  preferences?: string[];
  networkActivity?: string;
  status?: 'active' | 'deactivated';
  isVisibleInDirectory?: boolean;
  feedbackRating?: number;
  feedbackCount?: number;
  totalFeedbackPoints?: number;
};

export type Student = BaseUser & { role: 'student'; major: string; graduationYear: number; };
export type Professor = BaseUser & { role: 'professor'; department: string; researchInterests: string[]; };
export type NonTeachingStaff = BaseUser & { role: 'non-teaching-staff'; department: string; };

export type User = Student | Professor | NonTeachingStaff;

export type FeedPost = {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorRole: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  createdAt: string;
};

export type Notification = {
  id: string;
  type: 'connection' | 'event' | 'general';
  message: string;
  description?: string;
  timestamp: string;
  read: boolean;
};

export type NewsUpdate = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
};

export type Event = {
  id: string;
  name: string;
  date: string;
  description: string;
  image: ImagePlaceholder;
  tags?: string[];
  university?: string;
  college?: string;
};

export type JobPost = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  industry?: string;
  companyLogoUrl: string;
  university?: string;
};
