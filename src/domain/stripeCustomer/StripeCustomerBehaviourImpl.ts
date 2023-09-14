import {
  StripeCustomerBehaviour,
  StripeCustomerRepository,
  StripeService,
  UserRepository,
} from '../types';
import { StripeCustomerEntity, UserId } from '@makegoodfood/gf3-types';

export default class StripeCustomerBehaviourImpl implements StripeCustomerBehaviour {
  protected stripeCustomerRepository: StripeCustomerRepository;
  protected stripeService: StripeService;
  protected userRepository: UserRepository;

  public constructor({
    stripeCustomerRepository,
    stripeService,
    userRepository,
  }: {
    stripeCustomerRepository: StripeCustomerRepository;
    stripeService: StripeService;
    userRepository: UserRepository;
  }) {
    this.stripeCustomerRepository = stripeCustomerRepository;
    this.stripeService = stripeService;
    this.userRepository = userRepository;
  }

  public createStripeCustomer = async (userId: UserId): Promise<StripeCustomerEntity> => {
    const stripeCustomer = await this.stripeCustomerRepository.getStripeCustomerByUserId(userId);
    if (stripeCustomer) {
      return stripeCustomer;
    }

    const userRecord = await this.userRepository.getUser(userId);
    const customer = await this.stripeService.createCustomer({
      email: userRecord.email,
      description: 'Created from gf3-users',
      metadata: {
        user_id: userRecord.id,
      },
    });
    const newStripeCustomer: StripeCustomerEntity = {
      user_id: userId,
      stripe_customer_id: customer.id,
    };
    return await this.stripeCustomerRepository.createStripeCustomer(newStripeCustomer);
  };

  public anonymizeStripeCustomer = async (userId: UserId): Promise<void> => {
    const stripeCustomer = await this.stripeCustomerRepository.getStripeCustomerByUserId(userId);
    if (stripeCustomer) {
      await this.stripeService.deleteCustomerAndCards(stripeCustomer.stripe_customer_id);
      await this.stripeCustomerRepository.anonymizeStripeCustomer(
        stripeCustomer.stripe_customer_id,
      );
    }
  };
}
