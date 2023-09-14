import {
  MembershipPriceBehaviour,
  MembershipPriceRepository,
  MembershipRepository,
} from '../types';
import { MembershipId, MembershipPriceEntity } from '@makegoodfood/gf3-types';
import ResourceNotFound from '../errors/ResourceNotFound';
import Membership from '../membership/Membership';

export default class MembershipPriceBehaviourImpl implements MembershipPriceBehaviour {
  protected membershipRepository: MembershipRepository;
  protected membershipPriceRepository: MembershipPriceRepository;

  public constructor({
    membershipRepository,
    membershipPriceRepository,
  }: {
    membershipRepository: MembershipRepository;
    membershipPriceRepository: MembershipPriceRepository;
  }) {
    this.membershipRepository = membershipRepository;
    this.membershipPriceRepository = membershipPriceRepository;
  }

  public getMembershipPrices = async (
    membershipId: MembershipId,
  ): Promise<MembershipPriceEntity[]> => {
    const membership = await this.membershipRepository.getMembership(membershipId);
    if (!membership) {
      throw new ResourceNotFound(Membership.name, membershipId);
    }
    return await this.membershipPriceRepository.getMembershipPricesByMembershipId(membershipId);
  };
}
