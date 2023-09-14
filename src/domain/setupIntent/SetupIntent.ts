import { SetupIntentEntity } from '@makegoodfood/gf3-types';

export default class SetupIntent implements SetupIntentEntity {
  public customer_id: string;
  public client_secret: string;

  public constructor({ customer_id, client_secret }: SetupIntentEntity) {
    this.customer_id = customer_id;
    this.client_secret = client_secret;
  }
}
