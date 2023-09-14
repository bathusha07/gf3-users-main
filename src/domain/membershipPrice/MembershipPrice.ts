import { MembershipPriceEntity, MembershipPriceId, MembershipId } from '@makegoodfood/gf3-types';

export default class MembershipPrice implements MembershipPriceEntity {
  public id: MembershipPriceId;
  public membership_id: MembershipId;
  public province_code: string;
  public price: number;
  public tax_code: string;

  public constructor({ id, membership_id, province_code, price, tax_code }: MembershipPriceEntity) {
    this.id = id;
    this.membership_id = membership_id;
    this.province_code = province_code;
    this.price = price;
    this.tax_code = tax_code;
  }
}
