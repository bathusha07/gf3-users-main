import { DateUnit, MembershipEntity, MembershipId } from '@makegoodfood/gf3-types';

export default class Membership implements MembershipEntity {
  public id: MembershipId;
  public code: string;
  public name: string;
  public trial_type: DateUnit;
  public trial_value: number;
  public frequency_type: DateUnit;
  public frequency_value: number;

  public constructor({
    id,
    code,
    name,
    trial_type,
    trial_value,
    frequency_type,
    frequency_value,
  }: MembershipEntity) {
    this.id = id;
    this.code = code;
    this.name = name;
    this.trial_type = trial_type;
    this.trial_value = trial_value;
    this.frequency_type = frequency_type;
    this.frequency_value = frequency_value;
  }
}
