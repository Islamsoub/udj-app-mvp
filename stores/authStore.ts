import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export const REFRESH_KEY = 'refreshToken';

export type StudentProfile = {
  id: string;
  firstName: string;
  lastName: string;
  studentIdDisplay: string;
  email: string;
  photoUrl: string | null;
  currentSemester: number;
  status: string;
  programme: {
    id: string;
    nameFr: string;
    nameAr: string;
    code: string;
    level: string;
    durationSemesters?: number;
    totalCredits?: number;
  };
  faculty: {
    id: string;
    nameFr: string;
    nameAr: string;
    code: string;
    email?: string;
    phone?: string;
  };
  stats?: {
    gpa: number | null;
    mention: string | null;
    semesterCredits: { earned: number; total: number };
    totalCredits: { earned: number; total: number };
    attendancePercentage: number | null;
  };
  preferences?: {
    notifGrades: boolean;
    notifCourses: boolean;
    notifAttendance: boolean;
    quietHoursStart: string | null;
    quietHoursEnd: string | null;
  };
};

interface AuthState {
  accessToken: string | null;
  student: StudentProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  showSessionExpired: boolean;
  loaded: boolean;
  setTokens: (accessToken: string) => void;
  setStudent: (student: StudentProfile) => void;
  logout: () => void;
  reset: () => void;
  setShowSessionExpired: (show: boolean) => void;
  loadAuthFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  student: null,
  isAuthenticated: false,
  isLoading: false,
  showSessionExpired: false,
  loaded: false,

  setTokens: (accessToken) =>
    set({ accessToken, isAuthenticated: true, showSessionExpired: false }),

  setStudent: (student) => set({ student }),

  logout: () =>
    set({ accessToken: null, student: null, isAuthenticated: false, showSessionExpired: false }),

  reset: () =>
    set({
      accessToken: null,
      student: null,
      isAuthenticated: false,
      isLoading: false,
      showSessionExpired: false,
    }),

  setShowSessionExpired: (show) => set({ showSessionExpired: show }),

  loadAuthFromStorage: async () => {
    try {
      const refresh = await SecureStore.getItemAsync(REFRESH_KEY);
      set({ isAuthenticated: !!refresh, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
}));
