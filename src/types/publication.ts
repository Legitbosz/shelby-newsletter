export interface Publication {
  address: string;
  name: string;
  description: string;
  avatarUrl?: string;
  coverUrl?: string;
  issueCount: number;
  subscriberCount: number;
  createdAt: number;
  tags: string[];
  socialLinks?: {
    twitter?: string;
    website?: string;
  };
}
