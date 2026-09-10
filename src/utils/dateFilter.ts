export type DateRangePreset =
  | 'all'
  | 'today'
  | '7d'
  | '30d'
  | 'this_month'
  | 'last_month'
  | 'custom';

export type DatePreset = DateRangePreset;

export interface DateFilterState {
  preset: DateRangePreset;
  startDate?: string;
  endDate?: string;
}

export function isDateInRange(
  dateString: string | undefined | null,
  preset: DateRangePreset,
  customStart?: string,
  customEnd?: string
): boolean {
  if (!dateString) return true;
  if (preset === 'all') return true;

  const itemDate = new Date(dateString);
  if (isNaN(itemDate.getTime())) return true;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return itemDate >= startOfDay;

    case '7d': {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return itemDate >= sevenDaysAgo;
    }

    case '30d': {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return itemDate >= thirtyDaysAgo;
    }

    case 'this_month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return itemDate >= startOfMonth;
    }

    case 'last_month': {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return itemDate >= startOfLastMonth && itemDate <= endOfLastMonth;
    }

    case 'custom': {
      if (customStart) {
        const start = new Date(customStart);
        if (itemDate < start) return false;
      }
      if (customEnd) {
        const end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        if (itemDate > end) return false;
      }
      return true;
    }

    default:
      return true;
  }
}

export const isWithinRange = isDateInRange;

export const DATE_PRESET_LABELS: Record<DateRangePreset, string> = {
  all: 'All Time',
  today: 'Today',
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days (1 Month)',
  this_month: 'This Month',
  last_month: 'Last Month',
  custom: 'Custom Range',
};
