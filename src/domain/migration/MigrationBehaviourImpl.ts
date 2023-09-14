import { v4 as uuidv4 } from 'uuid';
import formatAddressValueObjects from '../address/valueObjects/formatAddressValueObjects';
import {
  AddressRepository,
  AgreementRepository,
  CardRepository,
  CompleteAddressInput,
  MembershipRepository,
  MigrationAddressInput,
  MigrationBehaviour,
  MigrationCardInput,
  MigrationInput,
  MigrationMealkitSubscriptionInput,
  MigrationSubscriptionInput,
  PostalCode,
  PreferenceRepository,
  StripeCustomerRepository,
  SubscriptionRepository,
  TermsRepository,
  UserBehaviour,
  UserRepository,
} from '../types';
import {
  AddressEntity,
  AddressId,
  CardEntity,
  CardId,
  DATE_UNIT_DAY,
  TYPE_MEMBERSHIP,
  TYPE_SCHEDULED,
  SubscriptionEntity,
  UserEntity,
  UserId,
  UserOutput,
  MembershipEntity,
  PreferenceTag,
} from '@makegoodfood/gf3-types';
import Membership from '../../domain/membership/Membership';
import SubresourceNotFound from '../errors/SubresourceNotFound';

const CODE_WOW_MONTHLY = 'wow-monthly';
const NAME_MEALKITS = 'mealkits-weekly';
const NAME_WOW = 'wow';
const NUMBER_DAYS_IN_A_WEEK = 7;

export default class MigrationBehaviourImpl implements MigrationBehaviour {
  protected addressRepository: AddressRepository;
  protected agreementRepository: AgreementRepository;
  protected cardRepository: CardRepository;
  protected membershipRepository: MembershipRepository;
  protected stripeCustomerRepository: StripeCustomerRepository;
  protected subscriptionRepository: SubscriptionRepository;
  protected termsRepository: TermsRepository;
  protected userBehaviour: UserBehaviour;
  protected userRepository: UserRepository;
  protected preferenceRepository: PreferenceRepository;

  public constructor({
    addressRepository,
    agreementRepository,
    cardRepository,
    membershipRepository,
    stripeCustomerRepository,
    subscriptionRepository,
    termsRepository,
    userBehaviour,
    userRepository,
    preferenceRepository,
  }: {
    addressRepository: AddressRepository;
    agreementRepository: AgreementRepository;
    cardRepository: CardRepository;
    membershipRepository: MembershipRepository;
    stripeCustomerRepository: StripeCustomerRepository;
    subscriptionRepository: SubscriptionRepository;
    termsRepository: TermsRepository;
    userBehaviour: UserBehaviour;
    userRepository: UserRepository;
    preferenceRepository: PreferenceRepository;
  }) {
    this.addressRepository = addressRepository;
    this.agreementRepository = agreementRepository;
    this.cardRepository = cardRepository;
    this.membershipRepository = membershipRepository;
    this.stripeCustomerRepository = stripeCustomerRepository;
    this.subscriptionRepository = subscriptionRepository;
    this.termsRepository = termsRepository;
    this.userBehaviour = userBehaviour;
    this.userRepository = userRepository;
    this.preferenceRepository = preferenceRepository;
  }

  public migrateUser = async (input: MigrationInput): Promise<UserOutput> => {
    const user = await this.createUser(input.user);
    const address = await this.createAddress(user.id, input.address);
    await this.createPreferences(user.id, input.preference);

    let card: CardEntity | undefined;
    if (input.card) {
      await this.createStripeCustomer(user.id, input.card);
      card = await this.createCard(user.id, input.card);
    }

    if (input.mealkitSubscription) {
      await this.createMealkitSubscription(
        user.id,
        address.id,
        input.mealkitSubscription,
        card ? card.id : null,
      );
    }
    if (input.wowSubscription) {
      await this.createWowSubscription(
        user.id,
        address.id,
        input.wowSubscription,
        card ? card.id : null,
      );
    }

    return await this.userBehaviour.getUser(user.id);
  };

  private createUser = async (inputUser: UserEntity): Promise<UserEntity> => {
    const existingUser = await this.userBehaviour.findMatchingUser(inputUser);
    if (existingUser) {
      return existingUser;
    }

    const user = await this.userRepository.createUser(inputUser);

    console.log('[UserAction] User created via migration', {
      user_id: user.id,
    });

    return user;
  };

  private createPreferences = async (
    userId: UserId,
    inputPreference: PreferenceTag[] | undefined,
  ) => {
    if (inputPreference !== undefined && inputPreference.length > 0) {
      await this.preferenceRepository.upsertMigratedPreferences(userId, inputPreference);
    }
  };
  private createAddress = async (
    userId: UserId,
    inputAddress: MigrationAddressInput,
  ): Promise<AddressEntity> => {
    const existingUserAddresses = await this.addressRepository.getUserAddresses(userId);
    if (existingUserAddresses.length) {
      return existingUserAddresses[0];
    }

    const userAddress = {
      ...inputAddress,
      is_default: true,
      user_id: userId,
    };
    const { postal_code }: { postal_code: PostalCode } = formatAddressValueObjects(userAddress);
    const addressWithFSA: CompleteAddressInput = {
      ...userAddress,
      fsa: postal_code.getFSA(),
    };

    const addressEntity = {
      ...addressWithFSA,
      id: uuidv4(),
    };

    return await this.addressRepository.createAddress(addressEntity);
  };

  private createStripeCustomer = async (
    userId: UserId,
    inputCard: MigrationCardInput,
  ): Promise<void> => {
    const existingStripeCustomer = await this.stripeCustomerRepository.getStripeCustomerByUserId(
      userId,
    );
    if (existingStripeCustomer) {
      return;
    }

    await this.stripeCustomerRepository.createStripeCustomer({
      user_id: userId,
      stripe_customer_id: inputCard.stripe_customer_id,
    });
  };

  private createCard = async (
    userId: UserId,
    inputCard: MigrationCardInput,
  ): Promise<CardEntity> => {
    const existingUserCards = await this.cardRepository.getUserCards(userId);
    if (existingUserCards.length) {
      return existingUserCards[0];
    }

    const newCard = await this.cardRepository.createCard({
      id: uuidv4(),
      stripe_card_id: inputCard.stripe_card_id,
      stripe_customer_id: inputCard.stripe_customer_id,
      stripe_card_token: inputCard.stripe_card_token,
      is_default: true,
    });

    await this.cardRepository.setUserDefaultCard(newCard);

    return newCard;
  };

  private createMealkitSubscription = async (
    userId: UserId,
    addressId: AddressId,
    inputSubscription: MigrationMealkitSubscriptionInput,
    cardId: CardId | null = null,
  ): Promise<void> => {
    const existingUserMealkitSubscriptions = (
      await this.subscriptionRepository.getUserSubscriptions(userId)
    ).filter((subscription) => {
      return subscription.subscription_type === TYPE_SCHEDULED;
    });

    const gf3SubscriptionExist = existingUserMealkitSubscriptions.find((subscription) => {
      return subscription.id === inputSubscription.gf3_subscription_id;
    });
    if (inputSubscription.gf3_subscription_id && gf3SubscriptionExist) {
      for (let i = 0; i < existingUserMealkitSubscriptions.length; i++) {
        if (existingUserMealkitSubscriptions[i].id === inputSubscription.gf3_subscription_id) {
          await this.updateSpecificMealkitSubscription(
            existingUserMealkitSubscriptions[i],
            addressId,
            inputSubscription,
            cardId,
          );
        } else if (existingUserMealkitSubscriptions[i].state !== 'CANCELLED') {
          await this.invalidateSubscription(existingUserMealkitSubscriptions[i]);
        }
      }
      return;
    }
    if (existingUserMealkitSubscriptions.length) {
      for (let i = 0; i < existingUserMealkitSubscriptions.length; i++) {
        await this.invalidateSubscription(existingUserMealkitSubscriptions[i]);
      }
    }

    const terms = await this.termsRepository.getTermsByName(NAME_MEALKITS);
    const agreement = await this.agreementRepository.createAgreement({
      terms_id: terms.id,
      user_id: userId,
      ip_address: inputSubscription.ip_address,
    });

    const subscription = await this.subscriptionRepository.createSubscription({
      id: uuidv4(),
      user_id: userId,
      card_id: cardId,
      address_id: addressId,
      agreement_id: agreement.id,
      subscription_type: TYPE_SCHEDULED,
      send_notification: false,
      state: inputSubscription.state,
      started_at: inputSubscription.started_at,
      next_cycle: null,
      product_id: inputSubscription.plan_id,
      frequency_type: DATE_UNIT_DAY,
      frequency_value: NUMBER_DAYS_IN_A_WEEK,
      delivery_day: inputSubscription.delivery_day,
      is_afterhours: inputSubscription.is_afterhours ?? false,
      coupon_code: inputSubscription.coupon_code,
    });

    console.log('[SubscriptionAction] Subscription created via migration', {
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      product_id: subscription.product_id,
    });
  };

  private updateSpecificMealkitSubscription = async (
    subscription: SubscriptionEntity,
    addressId: AddressId,
    inputSubscription: MigrationMealkitSubscriptionInput,
    cardId: CardId | null = null,
  ): Promise<void> => {
    subscription.card_id = cardId;
    subscription.address_id = addressId;
    subscription.state = inputSubscription.state;
    subscription.started_at = inputSubscription.started_at;
    subscription.product_id = inputSubscription.plan_id;
    subscription.delivery_day = inputSubscription.delivery_day;
    subscription.is_afterhours = inputSubscription.is_afterhours ?? false;
    subscription.coupon_code = inputSubscription.coupon_code;
    subscription.address_id = addressId;
    await this.subscriptionRepository.updateSubscription(subscription);

    console.log('[SubscriptionAction] Subscription resurected via migration', {
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      product_id: subscription.product_id,
    });
  };

  private invalidateSubscription = async (subscription: SubscriptionEntity): Promise<void> => {
    subscription.state = 'CANCELLED';
    await this.subscriptionRepository.updateSubscription(subscription);
  };

  private createWowSubscription = async (
    userId: UserId,
    addressId: AddressId,
    inputSubscription: MigrationSubscriptionInput,
    cardId: CardId | null = null,
  ): Promise<void> => {
    const existingUserWowSubscriptions = (
      await this.subscriptionRepository.getUserSubscriptions(userId)
    ).filter((subscription) => {
      return subscription.subscription_type === TYPE_MEMBERSHIP;
    });

    const membership = await this.membershipRepository.getMembershipByCode(CODE_WOW_MONTHLY);
    if (!membership) {
      throw new SubresourceNotFound(Membership.name, CODE_WOW_MONTHLY);
    }

    const gf3SubscriptionExist = existingUserWowSubscriptions.find((subscription) => {
      return subscription.id === inputSubscription.gf3_subscription_id;
    });
    if (inputSubscription.gf3_subscription_id && gf3SubscriptionExist) {
      for (let i = 0; i < existingUserWowSubscriptions.length; i++) {
        if (existingUserWowSubscriptions[i].id === inputSubscription.gf3_subscription_id) {
          await this.updateSpecificWowSubscription(
            existingUserWowSubscriptions[i],
            addressId,
            inputSubscription,
            cardId,
            membership,
          );
        } else if (existingUserWowSubscriptions[i].state !== 'CANCELLED') {
          await this.invalidateSubscription(existingUserWowSubscriptions[i]);
        }
      }
      return;
    }
    if (existingUserWowSubscriptions.length) {
      for (let i = 0; i < existingUserWowSubscriptions.length; i++) {
        await this.invalidateSubscription(existingUserWowSubscriptions[i]);
      }
    }

    const terms = await this.termsRepository.getTermsByName(NAME_WOW);
    const agreement = await this.agreementRepository.createAgreement({
      terms_id: terms.id,
      user_id: userId,
      ip_address: inputSubscription.ip_address,
    });

    const subscription = await this.subscriptionRepository.createSubscription({
      id: uuidv4(),
      user_id: userId,
      card_id: cardId,
      address_id: addressId,
      agreement_id: agreement.id,
      subscription_type: TYPE_MEMBERSHIP,
      send_notification: false,
      state: inputSubscription.state,
      started_at: inputSubscription.started_at,
      next_cycle: null,
      product_id: membership.id,
      frequency_type: membership.frequency_type,
      frequency_value: membership.frequency_value,
    });

    console.log('[SubscriptionAction] Subscription created via migration', {
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      product_id: subscription.product_id,
    });
  };

  private updateSpecificWowSubscription = async (
    subscription: SubscriptionEntity,
    addressId: AddressId,
    inputSubscription: MigrationSubscriptionInput,
    cardId: CardId | null = null,
    membership: MembershipEntity,
  ): Promise<void> => {
    subscription.address_id = addressId;
    subscription.card_id = cardId;
    subscription.address_id = addressId;
    subscription.state = inputSubscription.state;
    subscription.started_at = inputSubscription.started_at;
    subscription.product_id = membership.id;
    subscription.frequency_type = membership.frequency_type;
    subscription.frequency_value = membership.frequency_value;
    await this.subscriptionRepository.updateSubscription(subscription);

    console.log('[SubscriptionAction] Subscription resurected via migration', {
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      product_id: subscription.product_id,
    });
  };
}
