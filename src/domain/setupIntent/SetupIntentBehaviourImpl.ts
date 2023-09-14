import {
  SetupIntentBehaviour,
  UserRepository,
  StripeCustomerBehaviour,
  StripeService,
} from '../types';
import { SetupIntentEntity, SetupIntentInput } from '@makegoodfood/gf3-types';
import SetupIntent from './SetupIntent';
import User from '../user/User';
import SubresourceNotFound from '../errors/SubresourceNotFound';

export default class SetupIntentBehaviourImpl implements SetupIntentBehaviour {
  protected userRepository: UserRepository;
  protected stripeCustomerBehaviour: StripeCustomerBehaviour;
  protected stripeService: StripeService;

  public constructor({
    userRepository,
    stripeCustomerBehaviour,
    stripeService,
  }: {
    userRepository: UserRepository;
    stripeCustomerBehaviour: StripeCustomerBehaviour;
    stripeService: StripeService;
  }) {
    this.userRepository = userRepository;
    this.stripeCustomerBehaviour = stripeCustomerBehaviour;
    this.stripeService = stripeService;
  }

  public createSetupIntent = async (input: SetupIntentInput): Promise<SetupIntentEntity> => {
    // TODO: `input` includes a `requester_id`.
    //       Use this to track MH users creating setup intents on behalf of users.
    const user = await this.userRepository.getUser(input.user_id);
    if (!user) {
      throw new SubresourceNotFound(User.name, input.user_id);
    }
    const stripeCustomer = await this.stripeCustomerBehaviour.createStripeCustomer(input.user_id);
    const setupIntent = await this.stripeService.createSetupIntent(
      stripeCustomer.stripe_customer_id,
    );

    return new SetupIntent({
      customer_id: stripeCustomer.stripe_customer_id,
      client_secret: setupIntent.client_secret,
    });
  };
}
