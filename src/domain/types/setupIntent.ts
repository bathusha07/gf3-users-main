import { SetupIntentEntity, SetupIntentInput } from '@makegoodfood/gf3-types';

export interface SetupIntentBehaviour {
  createSetupIntent: (input: SetupIntentInput) => Promise<SetupIntentEntity>;
}
