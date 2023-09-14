import asyncHandler from '../middleware/async';
import { MembershipBehaviour } from '../domain/types';

export default class MembershipController {
  protected membershipBehaviour: MembershipBehaviour;

  public constructor({ membershipBehaviour }: { membershipBehaviour: MembershipBehaviour }) {
    this.membershipBehaviour = membershipBehaviour;
  }

  public getMembership = asyncHandler(async (req, res) => {
    const membership = await this.membershipBehaviour.getMembership(req.params.id);
    res.status(200).json(membership);
  });

  public getMemberships = asyncHandler(async (req, res) => {
    const memberships = await this.membershipBehaviour.getMemberships();
    res.status(200).json(memberships);
  });
}
