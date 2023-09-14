import { PrismaClient } from '@prisma/client';
import { MembershipEntity } from '@makegoodfood/gf3-types';

import Membership from '../../../../src/domain/membership/Membership';
import PrismaMembershipRepository from '../../../../src/infrastructure/repositories/PrismaMembershipRepository';
import { MembershipCompositeEntity } from '../../../../src/domain/types';

describe('PrismaMembershipRepository', () => {
  describe('getMembership()', () => {
    it('should call findUnique with the correct parameters', async () => {
      const mockPrismaClient = ({
        membership: { findUnique: jest.fn() },
      } as unknown) as PrismaClient;

      const membershipRepository = new PrismaMembershipRepository({
        prismaClient: mockPrismaClient,
      });

      const spy = jest.spyOn(mockPrismaClient.membership, 'findUnique');

      await membershipRepository.getMembership('test-membership-id');

      expect(spy).toHaveBeenCalledWith({ where: { id: 'test-membership-id' } });
    });

    it('should return a new Membership if the record exists', async () => {
      const mockMembershipEntity: MembershipEntity = {
        id: 'test-membership-id',
        code: 'test-membership-code',
        name: 'Test Membership Name',
        trial_type: 'DAY',
        trial_value: 1,
        frequency_type: 'DAY',
        frequency_value: 1,
      };

      const mockPrismaClient = ({
        membership: {
          findUnique: jest.fn(() => Promise.resolve(mockMembershipEntity)),
        },
      } as unknown) as PrismaClient;

      const membershipRepository = new PrismaMembershipRepository({
        prismaClient: mockPrismaClient,
      });

      const result = await membershipRepository.getMembership('test-membership-id');

      expect(result).toEqual(new Membership(mockMembershipEntity));
    });

    it('should return null if the record does not exist', async () => {
      const mockPrismaClient = ({
        membership: {
          findUnique: jest.fn(() => Promise.resolve(undefined)),
        },
      } as unknown) as PrismaClient;

      const membershipRepository = new PrismaMembershipRepository({
        prismaClient: mockPrismaClient,
      });

      const result = await membershipRepository.getMembership('test-membership-id');

      expect(result).toEqual(null);
    });
  });

  describe('getMembershipByCode()', () => {
    it('should call findFirst with the correct parameters', async () => {
      const mockPrismaClient = ({
        membership: { findFirst: jest.fn() },
      } as unknown) as PrismaClient;

      const membershipRepository = new PrismaMembershipRepository({
        prismaClient: mockPrismaClient,
      });

      const spy = jest.spyOn(mockPrismaClient.membership, 'findFirst');

      await membershipRepository.getMembershipByCode('test-membership-code');

      expect(spy).toHaveBeenCalledWith({ where: { code: 'test-membership-code' } });
    });

    it('should return a new Membership if the record exists', async () => {
      const mockMembershipEntity: MembershipEntity = {
        id: 'test-membership-id',
        code: 'test-membership-code',
        name: 'Test Membership Name',
        trial_type: 'DAY',
        trial_value: 1,
        frequency_type: 'DAY',
        frequency_value: 1,
      };

      const mockPrismaClient = ({
        membership: {
          findFirst: jest.fn(() => Promise.resolve(mockMembershipEntity)),
        },
      } as unknown) as PrismaClient;

      const membershipRepository = new PrismaMembershipRepository({
        prismaClient: mockPrismaClient,
      });

      const result = await membershipRepository.getMembershipByCode('test-membership-code');

      expect(result).toEqual(new Membership(mockMembershipEntity));
    });

    it('should return null if the record does not exist', async () => {
      const mockPrismaClient = ({
        membership: {
          findFirst: jest.fn(() => Promise.resolve(undefined)),
        },
      } as unknown) as PrismaClient;

      const membershipRepository = new PrismaMembershipRepository({
        prismaClient: mockPrismaClient,
      });

      const result = await membershipRepository.getMembershipByCode('test-membership-code');

      expect(result).toEqual(null);
    });
  });

  describe('getMemberships()', () => {
    it('should call findMany with the correct parameters', async () => {
      const mockPrismaClient = ({
        membership: { findMany: jest.fn(() => Promise.resolve([])) },
      } as unknown) as PrismaClient;

      const membershipRepository = new PrismaMembershipRepository({
        prismaClient: mockPrismaClient,
      });

      const spy = jest.spyOn(mockPrismaClient.membership, 'findMany');

      await membershipRepository.getMemberships();

      expect(spy).toHaveBeenCalledWith({ where: { deleted_at: null } });
    });

    it('should return an array of Memberships', async () => {
      const mockMembershipEntities: MembershipEntity[] = [
        {
          id: 'test-membership-id-1',
          code: 'test-membership-code-1',
          name: 'Test Membership Name 1',
          trial_type: 'DAY',
          trial_value: 1,
          frequency_type: 'DAY',
          frequency_value: 1,
        },
        {
          id: 'test-membership-id-2',
          code: 'test-membership-code-2',
          name: 'Test Membership Name 2',
          trial_type: 'DAY',
          trial_value: 1,
          frequency_type: 'DAY',
          frequency_value: 1,
        },
      ];

      const mockPrismaClient = ({
        membership: { findMany: jest.fn(() => Promise.resolve(mockMembershipEntities)) },
      } as unknown) as PrismaClient;

      const membershipRepository = new PrismaMembershipRepository({
        prismaClient: mockPrismaClient,
      });

      const result = await membershipRepository.getMemberships();
      const expected = [
        new Membership(mockMembershipEntities[0]),
        new Membership(mockMembershipEntities[1]),
      ];

      expect(result).toEqual(expected);
    });

    it('should return an empty array', async () => {
      const mockPrismaClient = ({
        membership: { findMany: jest.fn(() => Promise.resolve([])) },
      } as unknown) as PrismaClient;

      const membershipRepository = new PrismaMembershipRepository({
        prismaClient: mockPrismaClient,
      });

      const result = await membershipRepository.getMemberships();

      expect(result).toEqual([]);
    });
  });

  describe('getMembershipCompositeForProvince()', () => {
    it('should call findUnique with the correct parameters', async () => {
      const mockPrismaClient = ({
        membership: { findUnique: jest.fn(() => Promise.resolve(undefined)) },
      } as unknown) as PrismaClient;

      const membershipRepository = new PrismaMembershipRepository({
        prismaClient: mockPrismaClient,
      });

      const spy = jest.spyOn(mockPrismaClient.membership, 'findUnique');

      await membershipRepository.getMembershipCompositeForProvince(
        'test-membership-id',
        'province code',
      );

      expect(spy).toHaveBeenCalledWith({
        where: { id: 'test-membership-id' },
        include: { prices: { where: { province_code: 'province code' } } },
      });
    });

    it('should return null if the record does not exist', async () => {
      const mockPrismaClient = ({
        membership: { findUnique: jest.fn(() => Promise.resolve(undefined)) },
      } as unknown) as PrismaClient;

      const membershipRepository = new PrismaMembershipRepository({
        prismaClient: mockPrismaClient,
      });

      const result = await membershipRepository.getMembershipCompositeForProvince(
        'test-membership-id',
        'province code',
      );

      expect(result).toEqual(null);
    });

    it('should return null if the prices array does not exist', async () => {
      const mockPrismaClient = ({
        membership: { findUnique: jest.fn(() => Promise.resolve({})) },
      } as unknown) as PrismaClient;

      const membershipRepository = new PrismaMembershipRepository({
        prismaClient: mockPrismaClient,
      });

      const result = await membershipRepository.getMembershipCompositeForProvince(
        'test-membership-id',
        'province code',
      );

      expect(result).toEqual(null);
    });

    it('should return null if the prices array is empty', async () => {
      const mockPrismaClient = ({
        membership: { findUnique: jest.fn(() => Promise.resolve({ prices: [] })) },
      } as unknown) as PrismaClient;

      const membershipRepository = new PrismaMembershipRepository({
        prismaClient: mockPrismaClient,
      });

      const result = await membershipRepository.getMembershipCompositeForProvince(
        'test-membership-id',
        'province code',
      );

      expect(result).toEqual(null);
    });

    it('should return  a membership object with a price object', async () => {
      const mockMembershipEntity: MembershipCompositeEntity = {
        id: 'test-membership-id',
        code: 'test-membership-code',
        name: 'Test Membership Name',
        trial_type: 'DAY',
        trial_value: 1,
        frequency_type: 'DAY',
        frequency_value: 1,
        price: {
          id: 1,
          membership_id: 'test-membership-id',
          price: 12.34,
          province_code: 'province code',
          tax_code: 'tax code',
        },
      };

      const mockPrismaClient = ({
        membership: {
          findUnique: jest.fn(() =>
            Promise.resolve({
              id: 'test-membership-id',
              code: 'test-membership-code',
              name: 'Test Membership Name',
              trial_type: 'DAY',
              trial_value: 1,
              frequency_type: 'DAY',
              frequency_value: 1,
              prices: [
                {
                  id: 1,
                  membership_id: 'test-membership-id',
                  price: 12.34,
                  province_code: 'province code',
                  tax_code: 'tax code',
                },
              ],
            }),
          ),
        },
      } as unknown) as PrismaClient;

      const membershipRepository = new PrismaMembershipRepository({
        prismaClient: mockPrismaClient,
      });

      const result = await membershipRepository.getMembershipCompositeForProvince(
        'test-membership-id',
        'province code',
      );

      expect(result).toEqual(mockMembershipEntity);
    });
  });
});
