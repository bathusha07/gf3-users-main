import { CartService, RecipeEntity } from '../../domain/types';

export default class CartServiceStub implements CartService {
  // eslint-disable-next-line
  public createCartFromCuratedRecipes = async (recipes: RecipeEntity[]): Promise<void> => {
    return;
  };
}
