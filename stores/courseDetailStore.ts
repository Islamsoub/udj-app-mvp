import { create } from 'zustand';
import type { Course } from '@/components/schedule/CourseCard';

export interface ExtendedCourse extends Course {
  code: string;
  coefficient: number;
}

interface CourseDetailState {
  selectedCourse: ExtendedCourse | null;
  personalNote: string;
  setSelectedCourse: (course: ExtendedCourse) => void;
  clearSelectedCourse: () => void;
  setPersonalNote: (note: string) => void;
}

export const useCourseDetailStore = create<CourseDetailState>((set) => ({
  selectedCourse: null,
  personalNote: '',
  setSelectedCourse: (course) => set({ selectedCourse: course }),
  clearSelectedCourse: () => set({ selectedCourse: null }),
  setPersonalNote: (note) => set({ personalNote: note }),
}));
