export function isWeekend(): boolean {
  const day = new Date().getDay();
  return day === 5 || day === 6;
}

export function getGreeting(): string {
  if (isWeekend()) {
    return 'home.greeting.weekend';
  }

  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return 'home.greeting.morning';
  if (hour >= 12 && hour < 18) return 'home.greeting.afternoon';
  return 'home.greeting.evening';
}
