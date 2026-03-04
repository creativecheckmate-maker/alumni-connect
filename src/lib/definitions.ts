export type UserRole = 'student' | 'professor' | 'non-teaching-staff';

export type UserProfile = {
  id: string;
  externalAuthId: string;
  role: UserRole;
  name: string;
  email: string;
  avatarUrl?: string;
  branch?: string;
  batch?: string;
  university: string;
  college: string;
  feedbackRating?: number;
  feedbackCount?: number;
  totalFeedbackPoints?: number;
  isVisibleInDirectory: boolean;
  isVerified?: boolean;
  status: 'active' | 'deactivated';
  createdAt: any;
  updatedAt: any;
  major?: string; // for students
  graduationYear?: number; // for students
  department?: string; // for staff/professors
  researchInterests?: string[]; // for professors
  preferences?: string[];
  networkActivity?: string;
};

export type User = UserProfile;

export type Student = UserProfile & { role: 'student'; major: string; graduationYear: number };
export type Professor = UserProfile & { role: 'professor'; department: string; researchInterests: string[] };

export type FriendshipStatus = 'pending' | 'mutual';

export type Friendship = {
  id: string;
  uids: string[];
  followedBy: string[];
  status: FriendshipStatus;
  updatedAt: any;
};

export type Message = {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  content: string;
  participants: string[];
  createdAt: any;
};

export type FeedPost = {
  id: string;
  authorId: string;
  authorName?: string;
  authorAvatarUrl?: string;
  content: string;
  imageUrl?: string;
  likes: number;
  createdAt: any;
};

export type Notification = {
  id: string;
  userId: string;
  type: 'connection' | 'event' | 'general';
  message: string;
  read: boolean;
  createdAt: any;
};

export type Event = {
  id: string;
  name: string;
  description: string;
  date: string;
  organizerId: string;
  tags?: string[];
  university?: string;
  college?: string;
  imageUrl?: string;
};

export type JobPosting = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  industry?: string;
  posterId: string;
  companyLogoUrl?: string;
  university?: string;
  createdAt?: any;
};

export type SiteContent = {
  id: string;
  pageId: string;
  sectionId: string;
  data: Record<string, any>;
  updatedAt: any;
};