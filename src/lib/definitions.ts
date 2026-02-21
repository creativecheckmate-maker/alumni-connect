import type { ImagePlaceholder } from './placeholder-images';

type BaseUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  university: string;
  college: string;
  preferences?: string[];
  networkActivity?: string;
  status?: 'active' | 'deactivated';
};

export type Student = BaseUser & {
  role: 'student';
  major: string;
  graduationYear: number;
};

export type Professor = BaseUser & {
  role: 'professor';
  department: string;
  researchInterests: string[];
};

export type User = Student | Professor;

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

export type Mentor = {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
  expertise: string;
  industry?: string;
};
