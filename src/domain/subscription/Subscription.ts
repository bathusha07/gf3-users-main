import {
  AddressId,
  AgreementId,
  CardId,
  DateUnit,
  DayOfWeek,
  ProductId,
  SubscriptionEntity,
  SubscriptionId,
  SubscriptionProduct,
  SubscriptionState,
  SubscriptionType,
  UserId,
} from '@makegoodfood/gf3-types';

export default class Subscription implements SubscriptionEntity {
  public id: SubscriptionId;
  public user_id: UserId;
  public card_id?: CardId | null;
  public address_id?: AddressId | null;
  public agreement_id: AgreementId;
  public state: SubscriptionState;
  public subscription_type: SubscriptionType;
  public product_id: ProductId;
  public frequency_type: DateUnit;
  public frequency_value: number;
  public delivery_day?: DayOfWeek | null;
  public is_afterhours?: boolean | null;
  public next_cycle: Date | null;
  public send_notification: boolean;
  public coupon_code?: string | null;
  public started_at: Date;
  public product?: SubscriptionProduct;

  public constructor(subscription: SubscriptionEntity) {
    this.id = subscription.id;
    this.user_id = subscription.user_id;
    this.card_id = subscription.card_id;
    this.address_id = subscription.address_id;
    this.agreement_id = subscription.agreement_id;
    this.state = subscription.state;
    this.subscription_type = subscription.subscription_type;
    this.product_id = subscription.product_id;
    this.frequency_type = subscription.frequency_type;
    this.frequency_value = subscription.frequency_value;
    this.delivery_day = subscription.delivery_day;
    this.is_afterhours = subscription.is_afterhours;
    this.next_cycle = subscription.next_cycle;
    this.send_notification = subscription.send_notification;
    this.coupon_code = subscription.coupon_code;
    this.started_at = subscription.started_at;
  }
}

module.exports = Subscription;
