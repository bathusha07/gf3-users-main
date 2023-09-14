import * as yup from 'yup';
import {
  DateBehaviour,
  SubscriptionBehaviour,
  SubscriptionEvent,
  CancellationReasonBehaviour,
  UpdateSubscriptionScheduleInput,
} from '../domain/types';
import {
  CancellationSelectionInput,
  DayOfWeek,
  PlanIds,
  SubscriptionInput,
} from '@makegoodfood/gf3-types';
import asyncHandler, { RequestHandler } from '../middleware/async';
import {
  cancellationReasonValidation,
  cancellationSelectionValidation,
  deliveryDayValidation,
  getCancellationOptionValidation,
  isAfterhoursValidation,
  numericIdValidation,
  subscriptionValidation,
  dateValidation,
  planIdsValidation,
  subscriptionTypeValidation,
  updateSubscriptionScheduleValidation,
} from '../utils/validation';
import ValidationError from './errors/ValidationError';

export default class SubscriptionController {
  protected subscriptionBehaviour: SubscriptionBehaviour;
  protected dateBehaviour: DateBehaviour;
  protected cancellationReasonBehaviour: CancellationReasonBehaviour;

  public constructor({
    subscriptionBehaviour,
    dateBehaviour,
    cancellationReasonBehaviour,
  }: {
    subscriptionBehaviour: SubscriptionBehaviour;
    dateBehaviour: DateBehaviour;
    cancellationReasonBehaviour: CancellationReasonBehaviour;
  }) {
    this.subscriptionBehaviour = subscriptionBehaviour;
    this.dateBehaviour = dateBehaviour;
    this.cancellationReasonBehaviour = cancellationReasonBehaviour;
  }

  public updateSubscriptionState = (event: SubscriptionEvent): RequestHandler =>
    asyncHandler(async (req, res) => {
      const { subscriptionId } = req.params;

      await this.subscriptionBehaviour.updateSubscriptionState(subscriptionId, event);
      res.sendStatus(204);
    });

  public checkSubscriptionsDueForRenewal = asyncHandler(async (req, res) => {
    const now = this.dateBehaviour.getCurrentDate();

    await this.subscriptionBehaviour.checkSubscriptionsDueForRenewal(now);

    res.sendStatus(200);
  });

  public createSubscription = asyncHandler(async (req, res) => {
    const input = {
      user_id: req.body.user_id,
      card_id: req.body.card_id,
      address_id: req.body.address_id,
      terms_id: req.body.terms_id,
      subscription_type: req.body.subscription_type,
      product_id: req.body.product_id,
      send_notification: req.body.send_notification,
      ip_address: req.body.ip_address,
      delivery_day: req.body.delivery_day,
      plan_frequency_id: req.body.plan_frequency_id,
      initial_cycle_date: req.body.initial_cycle_date,
      coupon_code: req.body.coupon_code,
      old_plan_id: req.body.old_plan_id,
      invite_uuid: req.body.invite_uuid,
      referrer_id: req.body.referrer_id,
    };
    let validatedInput: SubscriptionInput;
    try {
      validatedInput = await subscriptionValidation.validate(input, { abortEarly: false });
    } catch (error) {
      throw new ValidationError(error as yup.ValidationError);
    }
    const subscription = await this.subscriptionBehaviour.createSubscription(validatedInput);
    res.status(201).json(subscription);
  });

  public getSubscription = asyncHandler(async (req, res) => {
    const subscription = await this.subscriptionBehaviour.getSubscription(req.params.id);
    res.status(200).json(subscription);
  });

  public getSubscriptionMembership = asyncHandler(async (req, res) => {
    const membership = await this.subscriptionBehaviour.getSubscriptionMembership(req.params.id);
    res.status(200).json(membership);
  });

  public getUserSubscriptions = asyncHandler(async (req, res) => {
    const subscriptions = await this.subscriptionBehaviour.getUserSubscriptions(req.params.id);
    res.status(200).json(subscriptions);
  });

  public updateSubscriptionPlan = asyncHandler(async (req, res) => {
    let planIds: PlanIds;
    try {
      planIds = await planIdsValidation.validate({
        plan_id: req.body.plan_id,
        old_plan_id: req.body.old_plan_id,
      });
    } catch (error) {
      throw new ValidationError(error as yup.ValidationError);
    }

    const subscription = await this.subscriptionBehaviour.updateSubscriptionPlan(
      req.params.id,
      planIds.plan_id,
      planIds.old_plan_id,
    );

    res.status(200).json(subscription);
  });

  public updateSubscriptionDeliveryDay = asyncHandler(async (req, res) => {
    let deliveryDay: DayOfWeek;
    let isAfterhours = false;
    try {
      deliveryDay = await deliveryDayValidation
        .required()
        .defined()
        .validate(req.body.delivery_day, {
          strict: true,
          abortEarly: false,
        });
      isAfterhours = await isAfterhoursValidation.validate(req.body.is_afterhours);
    } catch (error) {
      throw new ValidationError(error as yup.ValidationError);
    }

    const subscription = await this.subscriptionBehaviour.updateSubscriptionDeliveryDay(
      req.params.id,
      deliveryDay,
      isAfterhours,
    );

    res.status(200).json(subscription);
  });

  public updateSubscriptionDeliverySchedule = asyncHandler(async (req, res) => {
    const input = {
      id: req.params.id,
      delivery_day: req.body.delivery_day,
      plan_frequency_id: req.body.plan_frequency_id,
      initial_cycle_date: req.body.initial_cycle_date,
    };
    let validatedInput: UpdateSubscriptionScheduleInput;
    try {
      validatedInput = await updateSubscriptionScheduleValidation.validate(input, {
        abortEarly: false,
      });
    } catch (error) {
      throw new ValidationError(error as yup.ValidationError);
    }
    const subscription = await this.subscriptionBehaviour.updateSubscriptionDeliverySchedule(
      validatedInput,
    );

    res.status(200).json(subscription);
  });

  public extendSubscriptionTrial = asyncHandler(async (req, res) => {
    let trialEnd: Date;
    try {
      trialEnd = await dateValidation.validate(req.body.trial_end);
    } catch (error) {
      throw new ValidationError(error as yup.ValidationError);
    }

    const subscription = await this.subscriptionBehaviour.extendSubscriptionTrial(
      req.params.id,
      trialEnd,
    );

    res.status(200).json(subscription);
  });

  public curateScheduledSubscriptions = asyncHandler(async (req, res) => {
    const now = this.dateBehaviour.getCurrentDate();
    await this.subscriptionBehaviour.curateScheduledSubscriptions(now);
    res.sendStatus(204);
  });

  public cancelSubscription = asyncHandler(async (req, res) => {
    let selections;
    try {
      selections =
        (await cancellationSelectionValidation.validate(
          cancellationSelectionValidation.cast(req.body),
          {
            strict: true,
            abortEarly: true,
          },
          // Can't figure out why yup.array has undefined as a possible return type here. The `cast()`
          // call here and `ensure()` in the validation line should make that impossible.
        )) ?? [];
    } catch (error) {
      throw new ValidationError(error as yup.ValidationError);
    }
    const results = await this.subscriptionBehaviour.cancelSubscription(
      req.params.id,
      selections.map<CancellationSelectionInput>((selection) => ({
        ...selection,
        subscription_id: req.params.id,
      })),
    );
    res.status(200).json(results);
  });

  public getCancellationReasons = asyncHandler(async (req, res) => {
    const { is_user_visible } = req.query;
    let opts;
    try {
      opts = await getCancellationOptionValidation.validate(
        getCancellationOptionValidation.cast({ is_user_visible }),
        { abortEarly: true, strict: true },
      );
    } catch (error) {
      throw new ValidationError(error as yup.ValidationError);
    }
    const reasons = await this.cancellationReasonBehaviour.getReasons(opts);
    res.status(200).json(reasons);
  });

  public createCancellationReason = asyncHandler(async (req, res) => {
    let reason;
    try {
      reason = await cancellationReasonValidation.validate(
        cancellationReasonValidation.cast(req.body),
        {
          strict: true,
          abortEarly: true,
        },
      );
    } catch (error) {
      throw new ValidationError(error as yup.ValidationError);
    }

    const createdReason = await this.cancellationReasonBehaviour.createReason(reason);

    res.status(201).json(createdReason);
  });

  public updateCancellationReason = asyncHandler(async (req, res) => {
    const id = numericIdValidation.validateSync(req.params.id);
    let reason;
    try {
      reason = await cancellationReasonValidation.validate(
        cancellationReasonValidation.cast(req.body),
        {
          strict: true,
          abortEarly: true,
        },
      );
    } catch (error) {
      throw new ValidationError(error as yup.ValidationError);
    }

    const updatedReason = await this.cancellationReasonBehaviour.updateReason({ id, ...reason });
    res.status(200).json(updatedReason);
  });

  public deleteCancellationReason = asyncHandler(async (req, res) => {
    const id = numericIdValidation.validateSync(req.params.id);
    await this.cancellationReasonBehaviour.deleteReason(id);
    res.sendStatus(204);
  });

  public getCancellationSelections = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const selections = await this.subscriptionBehaviour.getCancellationSelections(id);
    res.status(200).json(selections);
  });

  public getLastCancelledSubscription = asyncHandler(async (req, res) => {
    const id = req.params.user_id;
    let type;
    try {
      type = subscriptionTypeValidation.validateSync(req.query.type);
    } catch (error) {
      throw new ValidationError(error as yup.ValidationError);
    }
    const out = await this.subscriptionBehaviour.getLastCancelledSubscription(id, type);
    res.status(200).json(out);
  });
}
