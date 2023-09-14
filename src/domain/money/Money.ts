import { Decimal } from '@prisma/client/runtime';
import { MoneyDecimal } from '@makegoodfood/gf3-types';

export default class Money extends Decimal implements MoneyDecimal {
  public toJSON = (): string => {
    return this.toFixed(2);
  };

  public add = (value: MoneyDecimal | number): MoneyDecimal => new Money(Decimal.add(this, value));
  public mul = (value: MoneyDecimal | number): MoneyDecimal => new Money(Decimal.mul(this, value));
}
