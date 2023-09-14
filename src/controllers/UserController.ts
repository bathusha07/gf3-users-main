import asyncHandler from '../middleware/async';
import {
  cancellationSelectionValidation,
  createUserValidation,
  updateUserValidation,
  userIdValidation,
  optionalSubscriptionIdValidation,
  preferenceCodesValidation,
  oldPlanIdValidation,
  subscriptionTypeValidation,
} from '../utils/validation';
import ValidationError from './errors/ValidationError';
import {
  UserBehaviour,
  PreferenceBehaviour,
  PreferenceInput,
  DateBehaviour,
  SubscriptionBehaviour,
  AddressBehaviour,
  StripeCustomerBehaviour,
} from '../domain/types';
import {
  CancellationSelectionInput,
  CancellationSelectionGf2Input,
  UserId,
  OptionalSubscriptionId,
  OldPlanId,
  SubscriptionType,
  TYPE_SCHEDULED,
} from '@makegoodfood/gf3-types';
import { ControllerRequest } from './types';

export default class UserController {
  protected userBehaviour: UserBehaviour;
  protected preferenceBehaviour: PreferenceBehaviour;
  protected dateBehaviour: DateBehaviour;
  protected subscriptionBehaviour: SubscriptionBehaviour;
  protected addressBehaviour: AddressBehaviour;
  protected stripeCustomerBehaviour: StripeCustomerBehaviour;

  public constructor({
    userBehaviour,
    preferenceBehaviour,
    dateBehaviour,
    subscriptionBehaviour,
    addressBehaviour,
    stripeCustomerBehaviour,
  }: {
    userBehaviour: UserBehaviour;
    preferenceBehaviour: PreferenceBehaviour;
    dateBehaviour: DateBehaviour;
    subscriptionBehaviour: SubscriptionBehaviour;
    addressBehaviour: AddressBehaviour;
    stripeCustomerBehaviour: StripeCustomerBehaviour;
  }) {
    this.userBehaviour = userBehaviour;
    this.preferenceBehaviour = preferenceBehaviour;
    this.dateBehaviour = dateBehaviour;
    this.subscriptionBehaviour = subscriptionBehaviour;
    this.addressBehaviour = addressBehaviour;
    this.stripeCustomerBehaviour = stripeCustomerBehaviour;
  }

  public createUser = asyncHandler(async (req, res) => {
    const input = {
      firebase_id: req.body.firebase_id,
      email: req.body.email,
      fsa: req.body.fsa,
      phone: req.body.phone,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      language: req.body.language,
      referrer_id: req.body.referrer_id,
    };
    let validatedInput;
    try {
      validatedInput = await createUserValidation.validate(input, { abortEarly: false });
    } catch (error) {
      throw new ValidationError(error);
    }
    const user = await this.userBehaviour.createUser(validatedInput);
    res.status(201).json(user);
  });

  public getUser = asyncHandler(async (req, res) => {
    const user = await this.userBehaviour.getUser(req.params.id);
    res.status(200).json(user);
  });

  public getUserByFirebaseId = asyncHandler(async (req, res) => {
    const user = await this.userBehaviour.getUserByFirebaseId(req.params.id);
    res.status(200).json(user);
  });

  public updateUser = asyncHandler(async (req, res) => {
    const userId: UserId = req.params.id;
    const update = {
      firebase_id: req.body.firebase_id,
      email: req.body.email,
      phone: req.body.phone,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      language: req.body.language,
    };

    let validatedUpdate;
    try {
      validatedUpdate = await updateUserValidation.validate(update, {
        abortEarly: false,
      });
    } catch (error) {
      throw new ValidationError(error);
    }

    const user = await this.userBehaviour.updateUser(userId, validatedUpdate);
    res.status(200).json(user);
  });

  public createPreferences = asyncHandler(async (req, res) => {
    const results = await this.preferenceBehaviour.upsert(await this.validatePreferences(req));
    res.status(201).json(results);
  });

  public setPreferences = asyncHandler(async (req, res) => {
    const results = await this.preferenceBehaviour.upsert(await this.validatePreferences(req));
    res.status(200).json(results);
  });

  private validatePreferences = async (req: ControllerRequest): Promise<PreferenceInput> => {
    let userPreferenceInput: PreferenceInput;
    try {
      userPreferenceInput = {
        userId: await userIdValidation.validate(req.params.id),
        subscriptionId:
          (await optionalSubscriptionIdValidation.validate(req.query.subscription_id)) ?? null,
        tags: (await preferenceCodesValidation.validate(req.body)) ?? [],
      };
    } catch (error) {
      throw new ValidationError(error);
    }
    return userPreferenceInput;
  };

  public getPreferences = asyncHandler(async (req, res) => {
    let userId: UserId;
    let subscriptionId: OptionalSubscriptionId;
    try {
      userId = await userIdValidation.validate(req.params.id);
      subscriptionId =
        (await optionalSubscriptionIdValidation.validate(req.query.subscription_id)) || null;
    } catch (error) {
      throw new ValidationError(error);
    }
    const results = await this.preferenceBehaviour.get(userId, subscriptionId);
    res.status(200).json(results);
  });

  public accountReactivation = asyncHandler(async (req, res) => {
    let oldPlanId: OldPlanId | undefined;
    let subscriptionType: SubscriptionType;
    let userId: UserId;
    try {
      subscriptionType = await subscriptionTypeValidation
        .required()
        .defined()
        .validate(req.body.subscription_type);
      if (subscriptionType == TYPE_SCHEDULED) {
        oldPlanId = await oldPlanIdValidation.required().validate(req.body.old_plan_id);
      }
      userId = await userIdValidation.validate(req.params.user_id);
    } catch (error) {
      throw new ValidationError(error);
    }

    const subscription = await this.subscriptionBehaviour.createSubscriptionFromLastCancelledSubscription(
      userId,
      subscriptionType,
      this.dateBehaviour.getCurrentDate(),
      oldPlanId,
    );

    const subscriptionDetail = await this.subscriptionBehaviour.getSubscription(subscription.id);

    res.status(201).json(subscriptionDetail);
  });

  public cancelUser = asyncHandler(async (req, res) => {
    let reasons: Omit<CancellationSelectionInput, 'subscription_id'>[];
    let gf2reasons: CancellationSelectionGf2Input;
    let userId: UserId;
    try {
      reasons =
        (await cancellationSelectionValidation.validate(
          cancellationSelectionValidation.cast(req.body.reasons),
          {
            strict: true,
            abortEarly: true,
          },
          // Can't figure out why yup.array has undefined as a possible return type here. The `cast()`
          // call here and `ensure()` in the validation line should make that impossible.
        )) ?? [];

      gf2reasons = {
        reason_id: reasons[0].reason_id,
        notes: reasons[0].edit_value,
      };
      userId = await userIdValidation.validate(req.params.id);
    } catch (error) {
      throw new ValidationError(error);
    }

    await this.subscriptionBehaviour.cancelUserSubscriptions(userId, reasons);
    await this.userBehaviour.cancelUser(userId, gf2reasons);

    res.sendStatus(204);
  });

  public anonymizeUser = asyncHandler(async (req, res) => {
    const userId: UserId = await userIdValidation.validate(req.params.id);
    await this.userBehaviour.anonymizeUser(userId);
    await this.addressBehaviour.anonymizeAddress(userId);
    await this.stripeCustomerBehaviour.anonymizeStripeCustomer(userId);
    res.sendStatus(204);
  });
}
