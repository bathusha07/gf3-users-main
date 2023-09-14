/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { CatalogService, RecipeEntity } from '../../domain/types';

export default class CatalogServiceStub implements CatalogService {
  // eslint-disable-next-line
  public getCuratedRecipes = async (): Promise<RecipeEntity[]> => {
    // get recipes from Catalog API endpoint according to input
    return [];
  };
}
