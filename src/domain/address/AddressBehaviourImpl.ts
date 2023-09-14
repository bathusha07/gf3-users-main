import { v4 as uuidv4 } from 'uuid';
import ResourceNotFound from '../errors/ResourceNotFound';
import { EVENT_TYPE_ADDRESS_CREATED, EVENT_VERSION_ADDRESS_CREATED } from './constants';
import {
  CompleteAddressInput,
  AddressBehaviour,
  AddressRepository,
  UserRepository,
  PostalCode,
  PubsubProducer,
  TranslationLayerService,
} from '../types';
import {
  AgentId,
  UserId,
  UserEntity,
  AddressId,
  AddressEntity,
  AddressInput,
} from '@makegoodfood/gf3-types';
import formatAddressValueObjects from './valueObjects/formatAddressValueObjects';
import Address from './Address';
import User from '../user/User';
import DomainEvent from '../event/DomainEvent';
import pubsubConfigs from '../../config/pubsub';
import entityMatchesUpdate from '../utils/entityMatchesUpdate';

export default class AddressBehaviourImpl implements AddressBehaviour {
  protected pubsubProducer: PubsubProducer;
  protected addressRepository: AddressRepository;
  protected userRepository: UserRepository;
  protected translationLayerService: TranslationLayerService;

  public constructor({
    pubsubProducer,
    addressRepository,
    userRepository,
    translationLayerService,
  }: {
    pubsubProducer: PubsubProducer;
    addressRepository: AddressRepository;
    userRepository: UserRepository;
    translationLayerService: TranslationLayerService;
  }) {
    this.pubsubProducer = pubsubProducer;
    this.addressRepository = addressRepository;
    this.userRepository = userRepository;
    this.translationLayerService = translationLayerService;
  }

  public createAddress = async (
    inputAddress: AddressInput,
    agentId?: AgentId,
  ): Promise<AddressEntity> => {
    const { postal_code }: { postal_code: PostalCode } = formatAddressValueObjects(inputAddress);
    const addressWithFSA: CompleteAddressInput = {
      ...inputAddress,
      fsa: postal_code.getFSA(),
    };

    const user = await this.userRepository.getUser(addressWithFSA.user_id);

    const matchingAddress = await this.addressRepository.getMatchingUserAddress(addressWithFSA);
    if (matchingAddress) {
      if (!matchingAddress.is_default) {
        const updatedAddress = await this.addressRepository.updateAddress(
          matchingAddress.id,
          addressWithFSA,
        );
        await this.addressRepository.unsetPreviousUserDefaultAddress(updatedAddress);
        await this.translationLayerService.updateGf2User(user, updatedAddress, undefined, agentId);

        return updatedAddress;
      }

      return matchingAddress;
    }

    const addressEntity = {
      ...addressWithFSA,
      id: uuidv4(),
    };

    if (addressWithFSA.is_default) {
      await this.translationLayerService.updateGf2User(user, addressEntity, undefined, agentId);
    }

    const createdAddress = await this.addressRepository.createAddress(addressEntity);
    if (addressWithFSA.is_default) {
      await this.addressRepository.unsetPreviousUserDefaultAddress(createdAddress);
    }

    await this.emitFirstAddressCreatedEvent(createdAddress.user_id);

    console.log('[AddressAction] Address created', {
      user_id: createdAddress.user_id,
    });

    return createdAddress;
  };

  private emitFirstAddressCreatedEvent = async (userId: UserId): Promise<void> => {
    const userAddressHistory = await this.addressRepository.getUserAddressHistory(userId);
    if (userAddressHistory.length == 1) {
      const user = await this.userRepository.getUser(userId);
      void this.pubsubProducer.publish(
        new DomainEvent<UserEntity>({
          payload: user,
          topic: pubsubConfigs.topics.onboarding,
          type: EVENT_TYPE_ADDRESS_CREATED,
          version: EVENT_VERSION_ADDRESS_CREATED,
        }),
      );
    }
  };

  public getUserAddresses = async (userId: UserId): Promise<AddressEntity[]> => {
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      throw new ResourceNotFound(User.name, userId);
    }

    return this.addressRepository.getUserAddresses(userId);
  };

  public updateAddress = async (
    addressId: AddressId,
    update: AddressInput,
  ): Promise<AddressEntity> => {
    const address = await this.addressRepository.getAddress(addressId);
    if (!address) {
      throw new ResourceNotFound(Address.name, addressId);
    }
    if (entityMatchesUpdate<AddressEntity, AddressInput>(address, update)) {
      return address;
    }
    const { postal_code }: { postal_code: PostalCode } = formatAddressValueObjects(update);
    const updateWithFsa: CompleteAddressInput = {
      ...update,
      fsa: postal_code.getFSA(),
    };

    if (updateWithFsa.is_default) {
      const user = await this.userRepository.getUser(address.user_id);
      await this.translationLayerService.updateGf2User(user, {
        ...updateWithFsa,
        id: addressId,
      });
    }

    const updatedAddress = await this.addressRepository.updateAddress(addressId, updateWithFsa);
    if (update.is_default && !address.is_default) {
      await this.addressRepository.unsetPreviousUserDefaultAddress(updatedAddress);
    }

    console.log('[AddressAction] Address updated', {
      user_id: address.user_id,
    });

    return updatedAddress;
  };
  public anonymizeAddress = async (userId: UserId): Promise<void> => {
    await this.addressRepository.anonymizeAddress(userId);
    console.log('[AddressAction] Address anonymization', {
      userId: userId,
    });
  };
}
