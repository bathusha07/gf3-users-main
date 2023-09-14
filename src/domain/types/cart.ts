import { RecipeEntity } from './';

export interface CartService {
  createCartFromCuratedRecipes: (recipes: RecipeEntity[]) => Promise<void>;
}
