export function localName(item: { nameFr?: string; nameAr?: string }, lang: string): string {
  if (lang === 'ar' && item.nameAr) return item.nameAr;
  return item.nameFr || '';
}

export function localTitle(item: { titleFr?: string; titleAr?: string }, lang: string): string {
  if (lang === 'ar' && item.titleAr) return item.titleAr;
  return item.titleFr || '';
}

export function localBody(item: { bodyFr?: string; bodyAr?: string }, lang: string): string {
  if (lang === 'ar' && item.bodyAr) return item.bodyAr;
  return item.bodyFr || '';
}
