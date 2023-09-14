import { UserId, AddressId, AddressEntity, AddressInput, AgentId } from '@makegoodfood/gf3-types';

export type CompleteAddressInput = AddressInput & { fsa: string };

export interface Country {
  getCode(): string;
}

export interface PostalCode {
  getPostalCode(): string;
  getFSA(): string;
}

export interface AddressBehaviour {
  createAddress: (inputAddress: AddressInput, agentId?: AgentId) => Promise<AddressEntity>;
  getUserAddresses: (userId: UserId) => Promise<AddressEntity[]>;
  updateAddress: (addressId: AddressId, update: AddressInput) => Promise<AddressEntity>;
  anonymizeAddress: (userId: UserId) => Promise<void>;
}

export interface AddressRepository {
  createAddress: (addressToCreate: AddressEntity) => Promise<AddressEntity>;
  getAddress: (id: AddressId) => Promise<AddressEntity | null>;
  getAddressForUser: (id: AddressId, userId: UserId) => Promise<AddressEntity | null>;
  getMatchingUserAddress: (address: CompleteAddressInput) => Promise<AddressEntity | null>;
  getUserAddresses: (userId: UserId) => Promise<AddressEntity[]>;
  getUserAddressHistory: (userId: UserId) => Promise<AddressEntity[]>;
  unsetPreviousUserDefaultAddress: (newDefault: AddressEntity) => Promise<void>;
  updateAddress: (id: AddressId, update: CompleteAddressInput) => Promise<AddressEntity>;
  anonymizeAddress: (userId: UserId) => Promise<void>;
}
