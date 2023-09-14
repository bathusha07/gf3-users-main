import { MembershipBehaviour, MembershipRepository } from '../types';
import { MembershipEntity, MembershipId } from '@makegoodfood/gf3-types';
import ResourceNotFound from '../errors/ResourceNotFound';
import Membership from './Membership';

export default class MembershipBehaviourImpl implements MembershipBehaviour {
  protected membershipRepository: MembershipRepository;

  public constructor({ membershipRepository }: { membershipRepository: MembershipRepository }) {
    this.membershipRepository = membershipRepository;
  }

  public getMembership = async (id: MembershipId): Promise<MembershipEntity> => {
    const membership = await this.membershipRepository.getMembership(id);
    if (!membership) {
      throw new ResourceNotFound(Membership.name, id);
    }
    return membership;
  };

  public getMemberships = async (): Promise<MembershipEntity[]> => {
    return await this.membershipRepository.getMemberships();
  };
}
