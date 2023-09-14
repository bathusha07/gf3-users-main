import { mock, mockClear } from 'jest-mock-extended';
import AddressBehaviourImpl from '../../../../src/domain/address/AddressBehaviourImpl';
import {
  AddressRepository,
  PubsubProducer,
  TranslationLayerService,
  UserRepository,
} from '../../../../src/domain/types';
import generateAddress from '../../../factories/address';
import generateUser from '../../../factories/user';
import ResourceNotFound from '../../../../src/domain/errors/ResourceNotFound';

describe('AddressBehaviourImpl', () => {
  const dummyAddress = generateAddress({ is_default: true });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: dummyAddressId, fsa, ...dummyAddressInput } = dummyAddress;
  const mocks = {
    addressRepository: mock<AddressRepository>(),
    pubsubProducer: mock<PubsubProducer>(),
    translationLayerService: mock<TranslationLayerService>(),
    userRepository: mock<UserRepository>(),
  };

  afterEach(() => {
    Object.values(mocks).forEach(mockClear);
  });

  describe('createAddress', () => {
    test('Return matching address if exists', async () => {
      const localMocks = {
        ...mocks,
        addressRepository: mock<AddressRepository>({
          getMatchingUserAddress: jest.fn(() => Promise.resolve(dummyAddress)),
        }),
      };
      const addressBehaviour = new AddressBehaviourImpl(localMocks);
      const createdAddress = await addressBehaviour.createAddress(dummyAddressInput);
      expect(createdAddress).toStrictEqual(dummyAddress);
    });

    test('Return created address complete with id in uuid format and fsa', async () => {
      const localMocks = {
        ...mocks,
        addressRepository: mock<AddressRepository>({
          createAddress: jest.fn((addressToCreate) => Promise.resolve(addressToCreate)),
          getMatchingUserAddress: jest.fn(() => Promise.resolve(null)),
          getUserAddressHistory: jest.fn(() => Promise.resolve([])),
        }),
      };
      const addressBehaviour = new AddressBehaviourImpl(localMocks);
      const createdAddress = await addressBehaviour.createAddress(dummyAddressInput);
      expect(createdAddress.id).toMatch(
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      );
      expect(createdAddress).toStrictEqual({
        id: createdAddress.id,
        fsa: dummyAddressInput.postal_code.substring(0, 3),
        ...dummyAddressInput,
      });
    });

    test('Send the Agent UUID to translation layer if passed', async () => {
      const localMocks = {
        ...mocks,
        addressRepository: mock<AddressRepository>({
          createAddress: jest.fn((addressToCreate) => Promise.resolve(addressToCreate)),
          getMatchingUserAddress: jest.fn(() => Promise.resolve(null)),
          getUserAddressHistory: jest.fn(() => Promise.resolve([])),
        }),
        userRepository: mock<UserRepository>({
          getUser: jest.fn().mockReturnValue(generateUser()),
        }),
      };
      const dummyAgentId = '57a236ee-2ea5-4329-a0c1-c0805d2401cf';
      const addressBehaviour = new AddressBehaviourImpl(localMocks);
      await addressBehaviour.createAddress(dummyAddressInput, dummyAgentId);
      expect(localMocks.translationLayerService.updateGf2User).toBeCalledWith(
        expect.anything(),
        expect.anything(),
        undefined,
        dummyAgentId,
      );
    });
  });

  describe('updateAddress', () => {
    test('Throw not found error if address does not exist', async () => {
      mocks.addressRepository = mock<AddressRepository>({
        getAddress: jest.fn(() => Promise.resolve(null)),
      });
      const addressBehaviour = new AddressBehaviourImpl(mocks);
      const attemptToUpdate = async () => {
        await addressBehaviour.updateAddress(dummyAddressId, dummyAddressInput);
      };
      await expect(attemptToUpdate).rejects.toThrow(ResourceNotFound);
    });

    test('If existing address matches update, return existing address as is', async () => {
      mocks.addressRepository = mock<AddressRepository>({
        getAddress: jest.fn(() => Promise.resolve(dummyAddress)),
      });
      const addressBehaviour = new AddressBehaviourImpl(mocks);
      const updatedAddress = await addressBehaviour.updateAddress(
        dummyAddressId,
        dummyAddressInput,
      );
      expect(updatedAddress).toStrictEqual(dummyAddress);
    });

    test('Return address with updated fields and fsa', async () => {
      const dummyUpdatedAddress = generateAddress();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: dummyAddressUpdateId, fsa, ...dummyAddressUpdateInput } = dummyUpdatedAddress;
      mocks.addressRepository = mock<AddressRepository>({
        getAddress: jest.fn(() => Promise.resolve(dummyAddress)),
        updateAddress: jest.fn(() => Promise.resolve(dummyUpdatedAddress)),
      });
      const addressBehaviour = new AddressBehaviourImpl(mocks);
      const updatedAddress = await addressBehaviour.updateAddress(
        dummyAddressUpdateId,
        dummyAddressUpdateInput,
      );
      expect(updatedAddress).toStrictEqual(dummyUpdatedAddress);
    });
  });

  describe('anonymizeAddress', () => {
    it('should call anonymizeAddress', async () => {
      const addressBehaviour = new AddressBehaviourImpl(mocks);
      await addressBehaviour.anonymizeAddress(dummyAddress.user_id);
      expect(mocks.addressRepository.anonymizeAddress).toHaveBeenCalledWith(dummyAddress.user_id);
    });
  });
});
