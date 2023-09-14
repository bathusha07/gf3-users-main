import { PlanEntity, PlanId } from '@makegoodfood/gf3-types';

export default class Plan implements PlanEntity {
  public id: PlanId;
  public number_of_recipes: number;
  public number_of_portions: number;

  public constructor({ id, number_of_recipes, number_of_portions }: PlanEntity) {
    this.id = id;
    this.number_of_recipes = number_of_recipes;
    this.number_of_portions = number_of_portions;
  }
}
