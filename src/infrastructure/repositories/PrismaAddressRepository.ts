import { PrismaClient } from '@prisma/client';
import { CompleteAddressInput, AddressRepository } from '../../domain/types';
import { UserId, AddressId, AddressEntity } from '@makegoodfood/gf3-types';
import Address from '../../domain/address/Address';
import handlePrismaError from './prismaErrorHandler';

export default class PrismaAddressRepository implements AddressRepository {
  protected prismaClient: PrismaClient;

  public constructor({ prismaClient }: { prismaClient: PrismaClient }) {
    this.prismaClient = prismaClient;
  }

  public createAddress = async (addressToCreate: AddressEntity): Promise<AddressEntity> => {
    let createdAddress;
    try {
      createdAddress = await this.prismaClient.address.create({ data: addressToCreate });
    } catch (error) {
      throw handlePrismaError(error);
    }

    return new Address(createdAddress);
  };

  public getAddress = async (id: AddressId): Promise<AddressEntity | null> => {
    const address = await this.prismaClient.address.findUnique({
      where: { id },
    });

    if (address) {
      return new Address(address);
    }
    return null;
  };

  public getAddressForUser = async (
    id: AddressId,
    userId: UserId,
  ): Promise<AddressEntity | null> => {
    const address = await this.prismaClient.address.findFirst({
      where: {
        id: id,
        user_id: userId,
        deleted_at: null,
      },
    });

    if (address) {
      return new Address(address);
    }
    return null;
  };

  public getMatchingUserAddress = async (
    address: CompleteAddressInput,
  ): Promise<AddressEntity | null> => {
    const matching = await this.prismaClient.address.findFirst({
      where: {
        user_id: address.user_id,
        address_line_1: address.address_line_1,
        address_line_2: address.address_line_2,
        company: address.company,
        city: address.city,
        province_code: address.province_code,
        country_code: address.country_code,
        postal_code: address.postal_code,
        building_type: address.building_type,
        special_instructions: address.special_instructions,
        deleted_at: null,
      },
    });

    if (matching) {
      return new Address(matching);
    }
    return null;
  };

  public getUserAddresses = async (userId: UserId): Promise<AddressEntity[]> => {
    const queriedAddresses = await this.prismaClient.address.findMany({
      where: {
        user_id: userId,
        deleted_at: null,
      },
    });

    return queriedAddresses.map((address) => new Address(address));
  };

  public getUserAddressHistory = async (userId: UserId): Promise<AddressEntity[]> => {
    const addressHistory = await this.prismaClient.address.findMany({
      where: { user_id: userId },
    });

    return addressHistory.map((address) => new Address(address));
  };

  public unsetPreviousUserDefaultAddress = async (newDefault: AddressEntity): Promise<void> => {
    await this.prismaClient.address.updateMany({
      where: {
        user_id: newDefault.user_id,
        is_default: true,
        NOT: {
          id: newDefault.id,
        },
      },
      data: {
        is_default: false,
      },
    });
  };

  public updateAddress = async (
    id: AddressId,
    update: CompleteAddressInput,
  ): Promise<AddressEntity> => {
    let updatedAddress;
    try {
      updatedAddress = await this.prismaClient.address.update({
        where: { id },
        data: update,
      });
    } catch (error) {
      throw handlePrismaError(error);
    }

    return new Address(updatedAddress);
  };

  public anonymizeAddress = async (userId: UserId): Promise<void> => {
    try {
      await this.prismaClient.address.updateMany({
        where: { user_id: userId },
        data: {
          address_line_1: '',
          address_line_2: '',
          company: '',
          city: '',
          country_code: '',
          building_type: '',
          postal_code: '',
          special_instructions: '',
          deleted_at: new Date(),
        },
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  };
}
