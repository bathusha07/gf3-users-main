import * as date from 'date-and-time';
import { DateBehaviour } from '../types';
import { DateUnit, DATE_UNIT_DAY, DATE_UNIT_MONTH, DATE_UNIT_YEAR } from '@makegoodfood/gf3-types';

export default class DateBehaviourImpl implements DateBehaviour {
  public getCurrentDate = (): Date => new Date();

  public calculateNextCycle = (dateUnit: DateUnit, value: number, now: Date): Date => {
    switch (dateUnit) {
      case DATE_UNIT_DAY:
        return date.addDays(now, value);
      case DATE_UNIT_MONTH:
        return date.addMonths(now, value);
      case DATE_UNIT_YEAR:
        return date.addYears(now, value);
      default:
        throw new TypeError(`Invalid dateUnit encountered: ${dateUnit as string}`);
    }
  };

  public isDateInPast = (date: Date): boolean => date < this.getCurrentDate();

  public isDateWithinAYearAfter = (targetDate: Date, referenceDate: Date): boolean =>
    date.subtract(date.addYears(referenceDate, 1), targetDate).toDays() > 0;
}
