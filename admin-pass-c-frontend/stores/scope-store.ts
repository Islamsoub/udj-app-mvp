import { create } from 'zustand';

/**
 * Scope store (Pass C-2, change-set §30.1 / AD §1) — the persistent
 * Faculté → Programme scope carried across navigation by the Context Bar.
 *
 * In-memory only (no localStorage): resetting on a page refresh is the intended
 * behaviour so an admin always starts from an explicit, visible scope. The
 * schedule view mode + room/teacher selections live here too so the Context Bar
 * can swap its controls in the par-salle / par-enseignant modes (§30.7).
 */
export type ScheduleMode = 'programme' | 'room' | 'teacher';

export interface ScopeState {
  facultyId: string | null;
  programmeId: string | null;
  scheduleMode: ScheduleMode;
  room: string | null;
  professorName: string | null;
  setFaculty: (id: string | null) => void;
  setProgramme: (id: string | null) => void;
  setScheduleMode: (mode: ScheduleMode) => void;
  setRoom: (room: string | null) => void;
  setProfessor: (name: string | null) => void;
  reset: () => void;
}

export const useScopeStore = create<ScopeState>((set) => ({
  facultyId: null,
  programmeId: null,
  scheduleMode: 'programme',
  room: null,
  professorName: null,
  // Changing the faculty clears the programme (it may belong to another faculty).
  setFaculty: (id) =>
    set((s) => (s.facultyId === id ? s : { facultyId: id, programmeId: null })),
  setProgramme: (id) => set({ programmeId: id }),
  setScheduleMode: (scheduleMode) => set({ scheduleMode }),
  setRoom: (room) => set({ room }),
  setProfessor: (professorName) => set({ professorName }),
  // Clears the scope selections (faculty/programme/room/teacher); keeps the
  // schedule view mode, which is a view preference rather than a scope filter.
  reset: () => set({ facultyId: null, programmeId: null, room: null, professorName: null }),
}));

/** Convenience selector hook — the whole scope object. */
export function useScope(): ScopeState {
  return useScopeStore((s) => s);
}
