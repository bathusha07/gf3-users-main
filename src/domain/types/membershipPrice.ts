import { MembershipId, MembershipPriceEntity } from '@makegoodfood/gf3-types';

export interface MembershipPriceBehaviour {
  getMembershipPrices: (membershipId: MembershipId) => Promise<MembershipPriceEntity[]>;
}

export interface MembershipPriceRepository {
  getMembershipPricesByMembershipId: (
    membershipId: MembershipId,
  ) => Promise<MembershipPriceEntity[]>;
}
