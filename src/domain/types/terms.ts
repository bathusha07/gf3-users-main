import { TermsEntity } from '@makegoodfood/gf3-types';

export interface TermsRepository {
  getTerms: (id: string) => Promise<TermsEntity>;
  getTermsByName: (name: string) => Promise<TermsEntity>;
}
