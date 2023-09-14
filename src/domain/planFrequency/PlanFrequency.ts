import { PlanFrequencyEntity, DateUnit, PlanFrequencyId } from '@makegoodfood/gf3-types';

export default class PlanFrequency implements PlanFrequencyEntity {
  public id: PlanFrequencyId;
  public frequency_type: DateUnit;
  public frequency_value: number;

  public constructor({ id, frequency_type, frequency_value }: PlanFrequencyEntity) {
    this.id = id;
    this.frequency_type = frequency_type;
    this.frequency_value = frequency_value;
  }
}
