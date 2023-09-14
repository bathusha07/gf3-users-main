import asyncHandler, { RequestHandler } from '../middleware/async';
import {
  addressValidation,
  adminUpdateValidation,
  adminUpdateUserValidation,
  cancellationSelectionValidation,
  deliveryDayValidation,
  isAfterhoursValidation,
  couponCodeValidation,
  oldPlanIdValidation,
  planIdsValidation,
  subscriptionIdValidation,
  subscriptionTypeValidation,
  userIdValidation,
  cancellationSelectionGf2Validation,
} from '../utils/validation';
import ValidationError from './errors/ValidationError';
import {
  AddressBehaviour,
  DateBehaviour,
  SubscriptionBehaviour,
  SubscriptionEvent,
  UserBehaviour,
} from '../domain/types';
import {
  AddressInput,
  AgentId,
  CancellationSelectionInput,
  CancellationSelectionGf2Input,
  DayOfWeek,
  OldPlanId,
  PlanIds,
  SubscriptionId,
  SubscriptionType,
  STATE_CANCELLED,
  TYPE_SCHEDULED,
  UserId,
} from '@makegoodfood/gf3-types';

export default class AdminController {
  protected addressBehaviour: AddressBehaviour;
  protected dateBehaviour: DateBehaviour;
  protected subscriptionBehaviour: SubscriptionBehaviour;
  protected userBehaviour: UserBehaviour;

  public constructor({
    addressBehaviour,
    dateBehaviour,
    subscriptionBehaviour,
    userBehaviour,
  }: {
    addressBehaviour: AddressBehaviour;
    dateBehaviour: DateBehaviour;
    subscriptionBehaviour: SubscriptionBehaviour;
    userBehaviour: UserBehaviour;
  }) {
    this.addressBehaviour = addressBehaviour;
    this.dateBehaviour = dateBehaviour;
    this.subscriptionBehaviour = subscriptionBehaviour;
    this.userBehaviour = userBehaviour;
  }

  public createAddress = asyncHandler(async (req, res) => {
    const body = {
      user_id: req.body.user_id,
      is_default: req.body.is_default,
      address_line_1: req.body.address_line_1,
      address_line_2: req.body.address_line_2,
      company: req.body.company,
      city: req.body.city,
      province_code: req.body.province_code,
      country_code: req.body.country_code,
      postal_code: (req.body.postal_code as string).replace(/\s|-/g, ''),
      building_type: req.body.building_type,
      special_instructions: req.body.special_instructions,
    };

    let agentId: AgentId;
    let validatedBody: AddressInput;
    try {
      agentId = await adminUpdateValidation.validate(req.body.agent_id);
      validatedBody = await addressValidation.validate(body, {
        abortEarly: false,
      });
    } catch (error) {
      throw new ValidationError(error);
    }

    const address = await this.addressBehaviour.createAddress(validatedBody, agentId);
    res.status(201).json(address);
  });

  public createSubscriptionFromLastCancelledSubscription = asyncHandler(async (req, res) => {
    let agentId: AgentId;
    let oldPlanId: OldPlanId | undefined;
    let subscriptionType: SubscriptionType;
    let userId: UserId;
    try {
      agentId = await adminUpdateValidation.validate(req.body.agent_id);
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
      agentId,
    );

    res.status(201).json(subscription);
  });

  public cancelSubscription = asyncHandler(async (req, res) => {
    let agentId: AgentId;
    let subscriptionId: SubscriptionId;
    let selections;
    try {
      agentId = await adminUpdateValidation.validate(req.body.agent_id);
      selections =
        (await cancellationSelectionValidation.validate(
          cancellationSelectionValidation.cast(req.body.reasons),
          {
            strict: true,
            abortEarly: true,
          },
          // Can't figure out why yup.array has undefined as a possible return type here. The `cast()`
          // call here and `ensure()` in the validation line should make that impossible.
        )) ?? [];
      subscriptionId = await subscriptionIdValidation.validate(req.params.id);
    } catch (error) {
      throw new ValidationError(error);
    }

    const results = await this.subscriptionBehaviour.cancelSubscription(
      subscriptionId,
      selections.map<CancellationSelectionInput>((selection) => ({
        ...selection,
        subscription_id: subscriptionId,
      })),
      agentId,
    );

    res.status(200).json(results);
  });

  public cancelUser = asyncHandler(async (req, res) => {
    let agentId: AgentId | undefined;
    let reasons: Omit<CancellationSelectionInput, 'subscription_id'>[];
    let gf2reasons: CancellationSelectionGf2Input | undefined;
    let userId: UserId;
    try {
      if (req.body.agent_id) {
        agentId = await adminUpdateValidation.validate(req.body.agent_id);
      }
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
      const gf2ReasonsInput = req.body.gf2Reasons;
      if (gf2ReasonsInput) {
        gf2reasons =
          (await cancellationSelectionGf2Validation.validate(
            cancellationSelectionGf2Validation.cast(gf2ReasonsInput),
            {
              strict: true,
              abortEarly: true,
            },
          )) ?? [];
      }
      userId = await userIdValidation.validate(req.params.user_id);
    } catch (error) {
      throw new ValidationError(error);
    }
    await this.subscriptionBehaviour.cancelUserSubscriptions(userId, reasons, agentId);
    await this.userBehaviour.cancelUser(userId, gf2reasons, agentId);

    res.sendStatus(204);
  });

  public userCancellationSelection = asyncHandler(async (req, res) => {
    const userId: UserId = await userIdValidation.validate(req.params.user_id);
    try {
      const userSubscriptions = await this.subscriptionBehaviour.getUserSubscriptions(userId);
      const userCancelledSubscriptions = userSubscriptions.filter((subscription) => {
        return (subscription.state = STATE_CANCELLED);
      });

      const cancellationSelectionsPromises = userCancelledSubscriptions.map(
        async (userCancelledSubscription) => {
          return await this.subscriptionBehaviour.getCancellationSelections(
            userCancelledSubscription.id,
          );
        },
      );
      const cancellationSelectionsAllPromises = await Promise.all(cancellationSelectionsPromises);

      const cancellationSelections = cancellationSelectionsAllPromises
        .reduce(function (arr, row) {
          return arr.concat(row);
        }, [])
        .filter((cancellationSelection) => {
          return cancellationSelection !== undefined;
        });

      res.status(200).json(cancellationSelections);
    } catch (error) {
      throw new ValidationError(error);
    }
  });

  public updateSubscriptionCoupon = asyncHandler(async (req, res) => {
    let agentId: AgentId | undefined;
    let couponCode: string | null;
    let subscriptionId: SubscriptionId;
    try {
      agentId = await adminUpdateValidation.label('agent_id').validate(req.body.agent_id);
      couponCode = await couponCodeValidation
        .nullable()
        .defined()
        .label('coupon_code')
        .validate(req.body.coupon_code);
      subscriptionId = await subscriptionIdValidation.validate(req.params.id);
    } catch (error) {
      throw new ValidationError(error);
    }

    const subscription = await this.subscriptionBehaviour.updateSubscriptionCoupon(
      subscriptionId,
      couponCode,
      agentId,
    );

    res.status(200).json(subscription);
  });

  public updateSubscriptionState = (event: SubscriptionEvent): RequestHandler =>
    asyncHandler(async (req, res) => {
      let agentId: AgentId;
      let subscriptionId: SubscriptionId;
      try {
        agentId = await adminUpdateValidation.validate(req.body.agent_id);
        subscriptionId = await subscriptionIdValidation.validate(req.params.id);
      } catch (error) {
        throw new ValidationError(error);
      }

      await this.subscriptionBehaviour.updateSubscriptionState(subscriptionId, event, agentId);
      res.sendStatus(204);
    });

  public updateSubscriptionDeliveryDay = asyncHandler(async (req, res) => {
    let agentId: AgentId | undefined;
    let deliveryDay: DayOfWeek;
    let isAfterhours = false;
    let subscriptionId: SubscriptionId;
    try {
      agentId = await adminUpdateValidation.validate(req.body.agent_id);
      deliveryDay = await deliveryDayValidation
        .required()
        .defined()
        .validate(req.body.delivery_day, {
          strict: true,
          abortEarly: false,
        });
      isAfterhours = await isAfterhoursValidation.validate(req.body.is_afterhours);
      subscriptionId = await subscriptionIdValidation.validate(req.params.id);
    } catch (error) {
      throw new ValidationError(error);
    }

    const subscription = await this.subscriptionBehaviour.updateSubscriptionDeliveryDay(
      subscriptionId,
      deliveryDay,
      isAfterhours,
      agentId,
    );

    res.status(200).json(subscription);
  });

  public updateSubscriptionPlan = asyncHandler(async (req, res) => {
    let agentId: AgentId | undefined;
    let planIds: PlanIds;
    let subscriptionId: SubscriptionId;
    try {
      if (req.body.agent_id) {
        agentId = await adminUpdateValidation.validate(req.body.agent_id);
      }
      planIds = await planIdsValidation.validate({
        plan_id: req.body.plan_id,
        old_plan_id: req.body.old_plan_id,
      });
      subscriptionId = await subscriptionIdValidation.validate(req.params.id);
    } catch (error) {
      throw new ValidationError(error);
    }

    const subscription = await this.subscriptionBehaviour.updateSubscriptionPlan(
      subscriptionId,
      planIds.plan_id,
      planIds.old_plan_id,
      agentId,
    );

    res.status(200).json(subscription);
  });

  public updateUser = asyncHandler(async (req, res) => {
    const body = {
      agent_id: req.body.agent_id,
      firebase_id: req.body.firebase_id,
      email: req.body.email,
      phone: req.body.phone,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      language: req.body.language,
    };

    let userId: UserId;
    let validatedBody;
    try {
      userId = await userIdValidation.validate(req.params.id);
      validatedBody = await adminUpdateUserValidation.validate(body, {
        abortEarly: false,
      });
    } catch (error) {
      throw new ValidationError(error);
    }

    const { agent_id: agentId, ...validatedUpdate } = validatedBody;
    const user = await this.userBehaviour.updateUser(userId, validatedUpdate, agentId);
    res.status(200).json(user);
  });

  public createMembershipSubscriptionTrial = asyncHandler(async (req, res) => {
    let userId: UserId;
    try {
      userId = await userIdValidation.validate(req.params.id);
    } catch (error) {
      throw new ValidationError(error);
    }
    const subscription = await this.subscriptionBehaviour.createMembershipSubscriptionTrial(userId);
    res.status(200).json(subscription);
  });
}
