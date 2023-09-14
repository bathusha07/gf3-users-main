import { PrismaClient } from '@prisma/client';
import { MembershipCompositeEntity, MembershipRepository } from '../../domain/types';
import { MembershipEntity, MembershipId } from '@makegoodfood/gf3-types';
import Membership from '../../domain/membership/Membership';
import MembershipPrice from '../../domain/membershipPrice/MembershipPrice';

export default class PrismaMembershipRepository implements MembershipRepository {
  protected prismaClient: PrismaClient;

  public constructor({ prismaClient }: { prismaClient: PrismaClient }) {
    this.prismaClient = prismaClient;
  }

  public getMembership = async (id: MembershipId): Promise<MembershipEntity | null> => {
    const membership = await this.prismaClient.membership.findUnique({
      where: { id },
    });
    if (membership) {
      return new Membership(membership);
    }
    return null;
  };

  public getMembershipByCode = async (code: string): Promise<MembershipEntity | null> => {
    const membership = await this.prismaClient.membership.findFirst({
      where: { code },
    });
    if (membership) {
      return new Membership(membership);
    }
    return null;
  };

  public getMemberships = async (): Promise<MembershipEntity[]> => {
    const rawMemberships = await this.prismaClient.membership.findMany({
      where: { deleted_at: null },
    });
    return rawMemberships.map((membership: MembershipEntity) => new Membership(membership));
  };

  public getMembershipCompositeForProvince = async (
    membershipId: MembershipId,
    provinceCode: string,
  ): Promise<MembershipCompositeEntity | null> => {
    const record = await this.prismaClient.membership.findUnique({
      where: { id: membershipId },
      include: {
        prices: {
          where: { province_code: provinceCode },
        },
      },
    });

    if (!record) {
      return null;
    }

    const {
      id,
      code,
      name,
      trial_type,
      trial_value,
      frequency_type,
      frequency_value,
      prices,
    } = record;

    if (!prices || prices.length === 0) {
      return null;
    }

    return {
      id,
      code,
      name,
      trial_type,
      trial_value,
      frequency_type,
      frequency_value,
      price: new MembershipPrice(prices[0]),
    };
  };
}
