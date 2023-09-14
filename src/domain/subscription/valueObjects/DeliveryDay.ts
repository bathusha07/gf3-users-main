import { DeliveryDayValueObject } from '../../types';
import { DayOfWeek, TYPE_SCHEDULED, VALID_DAYS } from '@makegoodfood/gf3-types';
import ValueObjectValidationError from '../../errors/ValueObjectValidationError';

export default class DeliveryDay implements DeliveryDayValueObject {
  public deliveryDay: DayOfWeek;
  public constructor(deliveryDay: string | null | undefined) {
    this.deliveryDay = this.validate(deliveryDay);
  }

  public getDeliveryDay(): DayOfWeek {
    return this.deliveryDay;
  }

  public validate(deliveryDay: string | null | undefined): DayOfWeek {
    if (!deliveryDay) {
      throw new ValueObjectValidationError(
        `Missing delivery day. Value must be passed for ${TYPE_SCHEDULED} subscriptions.`,
      );
    }
    if (!VALID_DAYS.includes(deliveryDay as DayOfWeek)) {
      throw new ValueObjectValidationError(
        `Invalid delivery day. Day must be one of: ${Object.values(VALID_DAYS).toString()}`,
      );
    }
    return deliveryDay as DayOfWeek;
  }
}
