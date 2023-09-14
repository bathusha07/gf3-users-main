import asyncHandler from '../middleware/async';
import {
  migratedUserAddressValidation,
  migratedUserCardValidation,
  migratedUserValidation,
  migratedUserMealkitSubscriptionValidation,
  migratedUserWowSubscriptionValidation,
  migratedUserPreferenceValidation,
} from '../utils/validation';
import ValidationError from './errors/ValidationError';
import {
  MigrationAddressInput,
  MigrationBehaviour,
  MigrationCardInput,
  MigrationMealkitSubscriptionInput,
  MigrationSubscriptionInput,
} from '../domain/types';
import { PreferenceTag, UserEntity } from '@makegoodfood/gf3-types';

export default class MigrationController {
  protected migrationBehaviour: MigrationBehaviour;

  public constructor({ migrationBehaviour }: { migrationBehaviour: MigrationBehaviour }) {
    this.migrationBehaviour = migrationBehaviour;
  }

  public createUser = asyncHandler(async (req, res) => {
    let validatedUserInput: UserEntity;
    let validatedAddressInput: MigrationAddressInput;
    let validatedCardInput: MigrationCardInput | undefined;
    let validatedMealkitSubscription: MigrationMealkitSubscriptionInput | undefined;
    let validatedWowSubscription: MigrationSubscriptionInput | undefined;
    let validatedPreferenceInput: PreferenceTag[] | undefined;

    try {
      validatedUserInput = await migratedUserValidation.validate(req.body.user, {
        abortEarly: false,
      });
      validatedAddressInput = await migratedUserAddressValidation.validate(req.body.address, {
        abortEarly: false,
      });
      if (req.body.card) {
        validatedCardInput = await migratedUserCardValidation.validate(req.body.card, {
          abortEarly: false,
        });
      }
      if (req.body.mealkit_subscription) {
        validatedMealkitSubscription = await migratedUserMealkitSubscriptionValidation.validate(
          req.body.mealkit_subscription,
          { abortEarly: false },
        );
      }
      if (req.body.preference) {
        validatedPreferenceInput = await migratedUserPreferenceValidation.validate(
          req.body.preference,
          { abortEarly: false },
        );
      }
      if (req.body.wow_subscription) {
        validatedWowSubscription = await migratedUserWowSubscriptionValidation.validate(
          req.body.wow_subscription,
          { abortEarly: false },
        );
      }
    } catch (error) {
      throw new ValidationError(error);
    }

    const user = await this.migrationBehaviour.migrateUser({
      user: validatedUserInput,
      address: validatedAddressInput,
      card: validatedCardInput,
      mealkitSubscription: validatedMealkitSubscription,
      wowSubscription: validatedWowSubscription,
      preference: validatedPreferenceInput,
    });
    res.status(201).json(user);
  });
}
