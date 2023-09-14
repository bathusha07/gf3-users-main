import { PrismaClient } from '@prisma/client';
import { MembershipPriceRepository } from '../../domain/types';
import { MembershipPriceEntity, MembershipId } from '@makegoodfood/gf3-types';
import MembershipPrice from '../../domain/membershipPrice/MembershipPrice';

export default class PrismaMembershipPriceRepository implements MembershipPriceRepository {
  protected prismaClient: PrismaClient;

  public constructor({ prismaClient }: { prismaClient: PrismaClient }) {
    this.prismaClient = prismaClient;
  }

  public getMembershipPricesByMembershipId = async (
    membershipId: MembershipId,
  ): Promise<MembershipPriceEntity[]> => {
    const rawMembershipPrices = await this.prismaClient.membershipPrice.findMany({
      where: { membership_id: membershipId },
    });
    return rawMembershipPrices.map(
      (membershipPrice: MembershipPriceEntity) => new MembershipPrice(membershipPrice),
    );
  };
}
