import { RecipeEntity } from './';

export interface CatalogService {
  getCuratedRecipes: () => Promise<RecipeEntity[]>;
}
