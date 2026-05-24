import { create } from 'zustand';
import type { Course } from '@/components/schedule/CourseCard';

export interface ExtendedCourse extends Course {
  code: string;
  coefficient: number;
  dayOfWeek: number;
}

interface CourseDetailState {
  selectedCourse: ExtendedCourse | null;
  setSelectedCourse: (course: ExtendedCourse) => void;
  clearSelectedCourse: () => void;
}

export const useCourseDetailStore = create<CourseDetailState>((set) => ({
  selectedCourse: null,
  setSelectedCourse: (course) => set({ selectedCourse: course }),
  clearSelectedCourse: () => set({ selectedCourse: null }),
}));
