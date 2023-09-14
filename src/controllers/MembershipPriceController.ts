import asyncHandler from '../middleware/async';
import { MembershipPriceBehaviour } from '../domain/types';

export default class MembershipPriceController {
  protected membershipPriceBehaviour: MembershipPriceBehaviour;

  public constructor({
    membershipPriceBehaviour,
  }: {
    membershipPriceBehaviour: MembershipPriceBehaviour;
  }) {
    this.membershipPriceBehaviour = membershipPriceBehaviour;
  }

  public getMembershipPrices = asyncHandler(async (req, res) => {
    const membershipPrices = await this.membershipPriceBehaviour.getMembershipPrices(req.params.id);
    res.status(200).json(membershipPrices);
  });
}
