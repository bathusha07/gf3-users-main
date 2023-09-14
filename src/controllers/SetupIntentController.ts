import asyncHandler from '../middleware/async';
import { SetupIntentBehaviour } from '../domain/types';
import { SetupIntentInput } from '@makegoodfood/gf3-types';
import { setupIntentValidation } from '../utils/validation';
import ValidationError from './errors/ValidationError';

export default class SetupIntentController {
  protected setupIntentBehaviour: SetupIntentBehaviour;

  public constructor({ setupIntentBehaviour }: { setupIntentBehaviour: SetupIntentBehaviour }) {
    this.setupIntentBehaviour = setupIntentBehaviour;
  }

  public createSetupIntent = asyncHandler(async (req, res) => {
    const body = req.body;
    const inputSetupIntent = {
      user_id: body.user_id,
      requester_id: body.requester_id,
    };
    let validatedInput: SetupIntentInput;
    try {
      validatedInput = await setupIntentValidation.validate(inputSetupIntent, {
        abortEarly: false,
        strict: true,
      });
    } catch (error) {
      throw new ValidationError(error);
    }
    const setupIntent = await this.setupIntentBehaviour.createSetupIntent(validatedInput);
    res.status(201).json(setupIntent);
  });
}
