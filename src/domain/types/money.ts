import { Decimal } from '@prisma/client/runtime';

declare module '@makegoodfood/gf3-types' {
  interface MoneyDecimal extends Decimal {
    toJSON: () => string;
    add: (value: MoneyDecimal | number) => MoneyDecimal;
    mul: (value: MoneyDecimal | number) => MoneyDecimal;
  }
}
