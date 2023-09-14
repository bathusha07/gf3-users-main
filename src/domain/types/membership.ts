import { MembershipEntity, MembershipId, MembershipPriceEntity } from '@makegoodfood/gf3-types';

export interface MembershipBehaviour {
  getMembership: (id: MembershipId) => Promise<MembershipEntity>;
  getMemberships: () => Promise<MembershipEntity[]>;
}

export interface MembershipCompositeEntity extends MembershipEntity {
  price: MembershipPriceEntity;
}

export interface MembershipRepository {
  getMembership: (id: MembershipId) => Promise<MembershipEntity | null>;
  getMembershipByCode: (code: string) => Promise<MembershipEntity | null>;
  getMemberships: () => Promise<MembershipEntity[]>;
  getMembershipCompositeForProvince: (
    membershipId: MembershipId,
    provinceCode: string,
  ) => Promise<MembershipCompositeEntity | null>;
}
