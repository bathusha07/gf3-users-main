import { CardEntity, CardId, StripeCustomerId } from '@makegoodfood/gf3-types';

export default class Card implements CardEntity {
  public id: CardId;
  public stripe_customer_id: StripeCustomerId;
  public stripe_payment_method_id?: string | null;
  public stripe_card_id?: string | null;
  public stripe_card_token?: string | null;
  public is_default: boolean;

  public constructor({
    id,
    stripe_customer_id,
    stripe_payment_method_id,
    stripe_card_id,
    stripe_card_token,
    is_default,
  }: CardEntity) {
    this.id = id;
    this.stripe_customer_id = stripe_customer_id;
    this.stripe_payment_method_id = stripe_payment_method_id;
    this.stripe_card_id = stripe_card_id;
    this.stripe_card_token = stripe_card_token;
    this.is_default = is_default;
  }
}
