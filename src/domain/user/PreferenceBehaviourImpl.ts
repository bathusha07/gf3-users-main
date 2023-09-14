import {
  PreferenceBehaviour,
  UserRepository,
  PreferenceInput,
  SubscriptionRepository,
  PreferenceRepository,
  AddressRepository,
  SubscriptionMessagePublisher,
  TranslationLayerService,
} from '../types';
import {
  UserId,
  PreferenceEntity,
  OptionalSubscriptionId,
  SubscriptionEntity,
  TYPE_SCHEDULED,
} from '@makegoodfood/gf3-types';
import BaseDomainError from '../errors/BaseDomainError';
import SubscriptionComposite from '../subscription/SubscriptionComposite';
import Address from '../address/Address';
import SubresourceNotFound from '../errors/SubresourceNotFound';

export default class PreferenceBehaviourImpl implements PreferenceBehaviour {
  protected userRepository: UserRepository;
  protected subscriptionRepository: SubscriptionRepository;
  protected preferenceRepository: PreferenceRepository;
  protected addressRepository: AddressRepository;
  protected subscriptionMessagePublisher: SubscriptionMessagePublisher;
  protected translationLayerService: TranslationLayerService;

  public constructor({
    userRepository,
    subscriptionRepository,
    preferenceRepository,
    addressRepository,
    subscriptionMessagePublisher,
    translationLayerService,
  }: {
    userRepository: UserRepository;
    subscriptionRepository: SubscriptionRepository;
    preferenceRepository: PreferenceRepository;
    addressRepository: AddressRepository;
    subscriptionMessagePublisher: SubscriptionMessagePublisher;
    translationLayerService: TranslationLayerService;
  }) {
    this.userRepository = userRepository;
    this.subscriptionRepository = subscriptionRepository;
    this.preferenceRepository = preferenceRepository;
    this.addressRepository = addressRepository;
    this.subscriptionMessagePublisher = subscriptionMessagePublisher;
    this.translationLayerService = translationLayerService;
  }

  public upsert = async (input: PreferenceInput): Promise<PreferenceEntity[]> => {
    const subscription = await this.checkUserAndSubscription(input.userId, input.subscriptionId);

    const existingPreferences = await this.preferenceRepository.getByUserIdAndSubscriptionId(
      input.userId,
      input.subscriptionId,
    );

    const toDelete = existingPreferences.filter((existingPreference) => {
      return !input.tags.includes(existingPreference.tag);
    });
    const toInsert = input.tags
      .filter((tag) => {
        return !existingPreferences.find((existingPreference) => existingPreference.tag == tag);
      })
      .map((tag) => {
        return {
          user_id: input.userId,
          subscription_id: input.subscriptionId,
          tag,
        };
      });

    const nextPreferences = await this.preferenceRepository.upsert({
      userId: input.userId,
      subscriptionId: input.subscriptionId,
      toDelete,
      toInsert,
    });

    await this.translationLayerService.updateUserPreferences(
      input.userId,
      nextPreferences.map((preference) => preference.tag),
    );

    if (
      input.subscriptionId &&
      subscription &&
      subscription.subscription_type === TYPE_SCHEDULED &&
      subscription.address_id
    ) {
      const address = await this.addressRepository.getAddress(subscription.address_id);
      if (!address) {
        throw new SubresourceNotFound(Address.name, subscription.address_id);
      }

      void (await this.subscriptionMessagePublisher.dispatchCurationJob(
        new SubscriptionComposite({
          subscription,
          address,
          preferences: nextPreferences,
        }),
      ));
    }

    return nextPreferences;
  };

  public get = async (
    userId: UserId,
    subscriptionId: OptionalSubscriptionId,
  ): Promise<PreferenceEntity[]> => {
    void (await this.checkUserAndSubscription(userId, subscriptionId));
    if (subscriptionId) {
      return await this.preferenceRepository.getByUserIdAndSubscriptionId(userId, subscriptionId);
    }
    return await this.preferenceRepository.getByUserId(userId);
  };

  private checkUserAndSubscription = async (
    userId: UserId,
    subscriptionId: OptionalSubscriptionId,
  ): Promise<SubscriptionEntity | null> => {
    let subscription = null;
    const user = await this.userRepository.getUser(userId);
    if (subscriptionId) {
      subscription = await this.subscriptionRepository.getSubscription(subscriptionId);
      if (subscription.user_id !== user.id) {
        throw new BaseDomainError('Specified subscription does not belong to specified user.');
      }
    }
    return subscription;
  };
}
