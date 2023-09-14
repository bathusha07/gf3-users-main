import { v4 as uuidv4 } from 'uuid';
import {
  EVENT_TYPE_USER_CREATED,
  EVENT_VERSION_USER_CREATED,
  EVENT_TYPE_CONTACT_INFO_ADDED,
  EVENT_VERSION_CONTACT_INFO_ADDED,
  ANONYMIZED_USER_PREFIX,
} from './constants';
import {
  AnonUserInput,
  PubsubProducer,
  SubscriptionProductFetcher,
  TranslationLayerService,
  UserBehaviour,
  UserRepository,
} from '../types';
import {
  AgentId,
  UserId,
  UserEntity,
  CancellationSelectionGf2Input,
  CreateUserInput,
  UserInput,
  UserOutput,
  TYPE_MEMBERSHIP,
  TYPE_SCHEDULED,
  FirebaseId,
  SubscriptionType,
  SubscriptionEntity,
} from '@makegoodfood/gf3-types';
import ContactInformation from './valueObjects/ContactInformationValueObject';
import DomainEvent from '../event/DomainEvent';
import pubsubConfigs from '../../config/pubsub';
import entityMatchesUpdate from '../utils/entityMatchesUpdate';
import UserComposite from './UserComposite';
import UniqueConstraintError from '../errors/UniqueConstraintError';
import { ACTIVE_SUBSCRIPTION_STATES } from '../subscription/constants';
import InvalidUpdateError from '../errors/InvalidUpdateError';
import { FirebaseService } from '../types/firebase';

export default class UserBehaviourImpl implements UserBehaviour {
  protected pubsubProducer: PubsubProducer;
  protected subscriptionProductFetcher: SubscriptionProductFetcher;
  protected userRepository: UserRepository;
  protected translationLayerService: TranslationLayerService;
  protected firebaseService: FirebaseService;

  public constructor({
    pubsubProducer,
    subscriptionProductFetcher,
    userRepository,
    translationLayerService,
    firebaseService,
  }: {
    pubsubProducer: PubsubProducer;
    subscriptionProductFetcher: SubscriptionProductFetcher;
    userRepository: UserRepository;
    translationLayerService: TranslationLayerService;
    firebaseService: FirebaseService;
  }) {
    this.pubsubProducer = pubsubProducer;
    this.subscriptionProductFetcher = subscriptionProductFetcher;
    this.userRepository = userRepository;
    this.translationLayerService = translationLayerService;
    this.firebaseService = firebaseService;
  }

  public cancelUser = async (
    id: UserId,
    reasons?: CancellationSelectionGf2Input,
    agentId?: AgentId,
  ): Promise<void> => {
    await this.translationLayerService.cancelUser(id, reasons, agentId);

    console.log('[UserAction] User cancelled', {
      user_id: id,
      agent_id: agentId,
    });
  };

  public anonymizeUser = async (id: UserId): Promise<void> => {
    const user = await this.userRepository.getUser(id);
    if (user.firebase_id.includes(ANONYMIZED_USER_PREFIX)) {
      throw new InvalidUpdateError('The user is already anonymized');
    }
    const anonymizeUser: AnonUserInput = {
      email_hash: ANONYMIZED_USER_PREFIX.concat(user.id).concat('@anon.ca'),
      first_name_hash: uuidv4(),
      last_name_hash: uuidv4(),
      phone_hash: Date.now().toString(),
    };
    await this.firebaseService.deleteUser(user.firebase_id);
    await this.userRepository.anonymizePersonalData(user.id, anonymizeUser);
    await this.translationLayerService.anonymizeGf2User(user.id, anonymizeUser);

    console.log('[UserAction] User anonymized', {
      user_id: id,
    });
  };

  public createUser = async (inputUser: CreateUserInput): Promise<UserEntity> => {
    const existingUser = await this.findMatchingUser(inputUser);
    if (existingUser) {
      return existingUser;
    }

    const userEntity = {
      id: uuidv4(),
      ...inputUser,
    };
    await this.translationLayerService.createGf2User(userEntity);

    // Some fields like fsa and referrer_id are required by Translation Layer,
    // but are not saved on this service.
    const { referrer_id, fsa, ...baseUserEntity } = userEntity;
    const user = await this.userRepository.createUser(baseUserEntity);

    await this.translationLayerService.createStandardCart(userEntity.id, fsa);

    void this.pubsubProducer.publish(
      new DomainEvent<UserEntity>({
        payload: user,
        topic: pubsubConfigs.topics.onboarding,
        type: EVENT_TYPE_USER_CREATED,
        version: EVENT_VERSION_USER_CREATED,
      }),
    );

    console.log('[UserAction] User created', {
      user_id: user.id,
    });

    return user;
  };

  public findMatchingUser = async (
    input: UserEntity | CreateUserInput,
  ): Promise<UserEntity | null> => {
    const existingUser = await this.userRepository.getMatchingUser(input);
    if (existingUser) {
      return existingUser;
    }

    const { email, firebase_id } = input;
    if (await this.userRepository.emailExists(email)) {
      throw new UniqueConstraintError('The email is already in use');
    }
    if (await this.userRepository.firebaseIdExists(firebase_id)) {
      throw new UniqueConstraintError('The firebase_id is already in use');
    }
    return null;
  };

  public getUser = async (id: UserId): Promise<UserOutput> => {
    const userComposite = await this.userRepository.getUserComposite(id);
    return this.buildProfile(userComposite);
  };

  public getUserByFirebaseId = async (id: FirebaseId): Promise<UserOutput> => {
    const userComposite = await this.userRepository.getUserByFirebaseIdComposite(id);

    if (userComposite) {
      return this.buildProfile(userComposite);
    }
    return this.buildEmptyProfile();
  };

  public updateUser = async (
    id: UserId,
    update: Partial<UserInput>,
    agentId?: AgentId,
  ): Promise<UserEntity> => {
    const user = await this.userRepository.getUser(id);
    if (entityMatchesUpdate<UserEntity, Partial<UserInput>>(user, update)) {
      return user;
    }

    await this.translationLayerService.updateGf2User(
      {
        id: user.id,
        ...update,
      },
      undefined,
      undefined,
      agentId,
    );
    const updatedUser = await this.userRepository.updateUser(id, update);
    this.emitContactInformationAddedEvent(user, updatedUser);
    return updatedUser;
  };

  private emitContactInformationAddedEvent = (
    oldUser: UserEntity,
    updatedUser: UserEntity,
  ): void => {
    const oldUserContact = new ContactInformation(oldUser);
    const updatedUserContact = new ContactInformation(updatedUser);
    if (oldUserContact.isEmpty() && !updatedUserContact.isEmpty()) {
      void this.pubsubProducer.publish(
        new DomainEvent<UserEntity>({
          payload: updatedUser,
          topic: pubsubConfigs.topics.onboarding,
          type: EVENT_TYPE_CONTACT_INFO_ADDED,
          version: EVENT_VERSION_CONTACT_INFO_ADDED,
        }),
      );
    }
  };

  private buildProfile = async (userComposite: UserComposite): Promise<UserOutput> => {
    const userCarts = await this.translationLayerService.getUserCarts(userComposite.user.id);
    const default_address = userComposite.addresses.find((address) => address.is_default);
    const filterByTypeAndActiveStates = (wantedSubscriptionType: SubscriptionType) => ({
      subscription_type,
      state,
    }: SubscriptionEntity) =>
      subscription_type === wantedSubscriptionType && ACTIVE_SUBSCRIPTION_STATES.includes(state);

    const subscriptionsWithProducts = await Promise.all(
      userComposite.subscriptions
        .filter((subscription) => ACTIVE_SUBSCRIPTION_STATES.includes(subscription.state))
        .map(async (subscription) => {
          return {
            ...subscription,
            product: await this.subscriptionProductFetcher.getSubscriptionProduct(subscription),
          };
        }),
    );

    return {
      ...userComposite.user,
      addresses: userComposite.addresses,
      address_ids: userComposite.addresses.map((address) => address.id),
      subscriptions: subscriptionsWithProducts,
      membership_subscription_ids: userComposite.subscriptions
        .filter(filterByTypeAndActiveStates(TYPE_MEMBERSHIP))
        .map((subscription) => subscription.id),
      scheduled_subscription_ids: userComposite.subscriptions
        .filter(filterByTypeAndActiveStates(TYPE_SCHEDULED))
        .map((subscription) => subscription.id),
      default_postal_code: default_address ? default_address.postal_code : null,
      carts: userCarts,
      preference_tags: userComposite.preferences
        .filter((preference) => preference.subscription_id === null)
        .map((preference) => preference.tag),
    };
  };

  private buildEmptyProfile = (): UserOutput => {
    return {
      id: '',
      email: '',
      phone: null,
      first_name: null,
      last_name: null,
      firebase_id: '',
      language: 'en',
      default_postal_code: null,
      addresses: [],
      address_ids: [],
      subscriptions: [],
      membership_subscription_ids: [],
      scheduled_subscription_ids: [],
      carts: [],
      preference_tags: [],
    };
  };
}
