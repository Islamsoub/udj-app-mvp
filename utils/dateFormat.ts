import i18n from '@/i18n';

const MONTHS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

const AR_DIGITS = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];

export function toArabicNumerals(n: number): string {
  return String(n).split('').map((d) => AR_DIGITS[Number(d)] ?? d).join('');
}

const DAYS_LONG_FR = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
const DAYS_LONG_AR = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

export function formatTimestamp(publishedAt: string): string {
  const now = new Date();
  const date = new Date(publishedAt);
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  const time = `${h}:${m}`;

  if (diffDays === 0) return i18n.t('news.today_at', { time });
  if (diffDays === 1) return i18n.t('news.yesterday_at', { time });
  return i18n.t('news.time_ago_days', { n: diffDays });
}

export function formatReadTime(minutes: number): string {
  return i18n.t('news.read_min', { n: minutes });
}

export function formatAbsenceDate(date: Date): string {
  const lang = i18n.language;
  const day = date.getDate().toString().padStart(2, '0');
  const months = lang === 'ar' ? MONTHS_AR : MONTHS_FR;
  return `${day} ${months[date.getMonth()]}`;
}

export function formatLocalDate(date: Date): string {
  const lang = i18n.language;
  const days = lang === 'ar' ? DAYS_LONG_AR : DAYS_LONG_FR;
  const months = lang === 'ar' ? MONTHS_AR : MONTHS_FR;
  const dayName = days[date.getDay()];
  const dayNum = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  if (lang === 'ar') return `${dayName} ${dayNum} ${month} ${year}`;
  return `${dayName} ${dayNum} ${month} ${year}`.toUpperCase();
}

export function formatScheduleDate(date: Date): string {
  const lang = i18n.language;
  const days = lang === 'ar' ? DAYS_LONG_AR : DAYS_LONG_FR;
  const months = lang === 'ar' ? MONTHS_AR : MONTHS_FR;
  const dayNum = lang === 'ar' ? toArabicNumerals(date.getDate()) : String(date.getDate());
  return `${days[date.getDay()]} ${dayNum} ${months[date.getMonth()]}`;
}
