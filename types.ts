
export interface User {
  id: string;
  username: string;
  email: string;
  isPremium: boolean;
  avatar?: string;
}

export interface CalendarEvent {
  id: string;
  userId?: string;
  name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location: string;
  color: string; // Tailwind bg color class
  duration: number; // in minutes
  description?: string;
  reminderType: 'none' | 'minutes' | 'hours' | 'days';
  reminderValue: number;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface ExtractedEvent {
  name: string;
  date: string;
  time: string;
  location: string;
  color: string;
  duration: number;
  description: string;
  reminderType?: 'none' | 'minutes' | 'hours' | 'days';
  reminderValue?: number;
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export enum ViewMode {
  MONTH = 'MONTH',
  WEEK = 'WEEK',
  DAY = 'DAY'
}
