import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

/** shadcn-style class combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Dates (GMT+3 · fr locale — reconciliation §2) ──────────────────────────

function toDate(d: string | Date): Date {
  return typeof d === 'string' ? parseISO(d) : d;
}

/** "20 juin 2026" */
export function fmtDate(d: string | Date): string {
  return format(toDate(d), 'd MMMM yyyy', { locale: fr });
}

/** "20 juin 2026 à 14:30" */
export function fmtDateTime(d: string | Date): string {
  return format(toDate(d), "d MMMM yyyy 'à' HH:mm", { locale: fr });
}

/** "mer. 10 juin" */
export function fmtDateShort(d: string | Date): string {
  return format(toDate(d), 'EEE d MMM', { locale: fr });
}

/** "20/06/2026 14:30" — compact mono timestamps (audit). */
export function fmtStamp(d: string | Date): string {
  return format(toDate(d), 'dd/MM/yyyy HH:mm', { locale: fr });
}

/** "il y a 2 heures" */
export function fmtRelative(d: string | Date): string {
  return formatDistanceToNow(toDate(d), { addSuffix: true, locale: fr });
}

/** French thousands separator: 2480 → "2 480" (impl spec §1 locale note). */
export function fmtNumber(n: number): string {
  return n.toLocaleString('fr-FR');
}

// ─── Names / initials ────────────────────────────────────────────────────────

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

// ─── Password generator (impl spec §27) ──────────────────────────────────────

/** Unambiguous alphabet — no 0/O/1/l/I. */
const UNAMBIGUOUS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

/** 12-char random password from the unambiguous alphabet. */
export function randPw(length = 12): string {
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += UNAMBIGUOUS[values[i] % UNAMBIGUOUS.length];
  }
  return out;
}

// ─── JWT decode (auth store — no /me call on page load) ──────────────────────

export interface AdminJwtPayload {
  adminId: string;
  role: string;
  facultyId: string | null;
  type: string;
  exp: number;
  iat: number;
}

export function decodeJwt(token: string): AdminJwtPayload | null {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as AdminJwtPayload;
  } catch {
    return null;
  }
}

// ─── CSV helpers (import wizards, audit export) ──────────────────────────────

/** Minimal CSV parser — handles quoted fields and CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',' || ch === ';') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    if (row.some((c) => c.trim() !== '')) rows.push(row);
  }
  return rows;
}

/** Build + trigger download of a CSV file. */
export function downloadCsv(filename: string, header: string[], rows: (string | number | null)[][]): void {
  const esc = (v: string | number | null) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const content = [header, ...rows].map((r) => r.map(esc).join(',')).join('\n');
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Time helpers (schedule grid) ────────────────────────────────────────────

/** "13:30" → minutes since midnight. */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** Extract API error message (French backend messages pass through). */
export function apiErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    const maybeAxios = err as {
      response?: { data?: { error?: string } };
      message?: string;
    };
    if (maybeAxios.response?.data?.error) return maybeAxios.response.data.error;
    if (maybeAxios.message) return maybeAxios.message;
  }
  return 'Une erreur est survenue. Réessayez.';
}
