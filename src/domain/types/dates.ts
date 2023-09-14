import { DateUnit } from '@makegoodfood/gf3-types';

export interface DateBehaviour {
  getCurrentDate: () => Date;
  calculateNextCycle: (unit: DateUnit, value: number, now: Date) => Date;
  isDateInPast: (date: Date) => boolean;
  isDateWithinAYearAfter: (targetDate: Date, referenceDate: Date) => boolean;
}
