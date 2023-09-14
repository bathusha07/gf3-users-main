import { PrismaClient, SubscriptionState } from '@prisma/client';
import ResourceNotFound from '../../domain/errors/ResourceNotFound';
import RecordCreationConflict from '../../domain/errors/RecordCreationConflict';
import Subscription from '../../domain/subscription/Subscription';
import { SubscriptionCompositeEntity, SubscriptionRepository } from '../../domain/types';
import {
  CancellationSelectionEntity,
  CancellationSelectionInput,
  SubscriptionEntity,
  SubscriptionId,
  SubscriptionType,
  STATE_ACTIVE,
  STATE_TRIAL,
  TYPE_SCHEDULED,
  TYPE_MEMBERSHIP,
  STATE_CANCELLED,
  STATE_CANCELLATION,
} from '@makegoodfood/gf3-types';
import { UserId } from '@makegoodfood/gf3-types';
import prismaErrorHandler from './prismaErrorHandler';
import CancellationSelection from '../../domain/subscription/CancellationSelection';
import SubscriptionComposite from '../../domain/subscription/SubscriptionComposite';

export default class PrismaSubscriptionRepository implements SubscriptionRepository {
  protected prismaClient: PrismaClient;
  private RESOURCE_NAME = Subscription.name;

  public constructor({ prismaClient }: { prismaClient: PrismaClient }) {
    this.prismaClient = prismaClient;
  }

  public createSubscription = async (data: SubscriptionEntity): Promise<SubscriptionEntity> => {
    const { user_id, subscription_type } = data;
    const existingActiveRecord = await this.prismaClient.subscription.findFirst({
      where: { user_id, subscription_type, state: STATE_ACTIVE },
    });
    if (existingActiveRecord) {
      throw new RecordCreationConflict('Subscription');
    }
    const createdSubscription = await this.prismaClient.subscription.create({ data });
    return new Subscription(createdSubscription);
  };

  public getSubscription = async (id: SubscriptionId): Promise<SubscriptionEntity> => {
    // add a comment
    const subscription = await this.prismaClient.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new ResourceNotFound(this.RESOURCE_NAME, id);
    }

    return new Subscription(subscription);
  };

  public getSubscriptionComposite = async (
    id: SubscriptionId,
  ): Promise<SubscriptionCompositeEntity> => {
    const record = await this.prismaClient.subscription.findUnique({
      where: { id },
      include: {
        address: true,
        preferences: true,
      },
    });

    if (!record) {
      throw new ResourceNotFound(this.RESOURCE_NAME, id);
    }

    const { address, preferences, ...subscription } = record;

    return new SubscriptionComposite({
      subscription,
      address,
      preferences,
    });
  };

  public getActiveUserSubscriptions = async (id: UserId): Promise<SubscriptionEntity[]> => {
    const userSubscriptions = await this.prismaClient.subscription.findMany({
      where: {
        user_id: id,
        deleted_at: null,
        OR: [{ state: STATE_ACTIVE }, { state: STATE_TRIAL }],
      },
    });
    return userSubscriptions.map((subscription) => new Subscription(subscription));
  };

  public getUserSubscriptions = async (id: UserId): Promise<SubscriptionEntity[]> => {
    const userSubscriptions = await this.prismaClient.subscription.findMany({
      where: {
        user_id: id,
        deleted_at: null,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    return userSubscriptions.map((subscription) => new Subscription(subscription));
  };

  private getSubscriptionsDue = (type: SubscriptionType) => async (
    now: Date,
  ): Promise<SubscriptionEntity[]> => {
    const subscriptionsDue = await this.prismaClient.subscription.findMany({
      where: {
        OR: [{ state: STATE_ACTIVE }, { state: STATE_TRIAL }],
        subscription_type: type,
        next_cycle: {
          lte: now,
        },
      },
    });
    return subscriptionsDue.map((sub) => new Subscription(sub));
  };

  public getSubscriptionsDueForCuration = this.getSubscriptionsDue(TYPE_SCHEDULED);

  public getSubscriptionsDueForRenewal = this.getSubscriptionsDue(TYPE_MEMBERSHIP);

  public getMatchingSubscription = async (
    subscription: SubscriptionEntity,
  ): Promise<SubscriptionEntity | null> => {
    const matching = await this.prismaClient.subscription.findFirst({
      where: {
        user_id: subscription.user_id,
        card_id: subscription.card_id,
        address_id: subscription.address_id,
        agreement_id: subscription.agreement_id,
        state: subscription.state,
        subscription_type: subscription.subscription_type,
        product_id: subscription.product_id,
        frequency_type: subscription.frequency_type,
        frequency_value: subscription.frequency_value,
        send_notification: subscription.send_notification,
        deleted_at: null,
      },
    });
    if (matching) {
      return new Subscription(matching);
    }
    return null;
  };

  public updateSubscription = async (
    subscription: SubscriptionEntity,
  ): Promise<SubscriptionEntity> => {
    const updatedSubscription = await this.prismaClient.subscription.update({
      data: subscription,
      where: {
        id: subscription.id,
      },
    });
    return new Subscription(updatedSubscription);
  };

  public updateSubscriptionWithCancellationSelections = async (
    subscription: SubscriptionEntity,
    selections: CancellationSelectionInput[],
  ): Promise<CancellationSelectionEntity[]> => {
    if (selections.length === 0) {
      await this.updateSubscription(subscription);
      return [];
    }
    try {
      await this.prismaClient.$transaction([
        this.prismaClient.subscription.update({
          data: subscription,
          where: { id: subscription.id },
        }),
        this.prismaClient.cancellationSelection.createMany({ data: selections }),
      ]);
    } catch (error) {
      throw prismaErrorHandler(error);
    }

    return this.getCancellationSelectionsBySubscriptionId(subscription.id);
  };

  public getCancellationSelectionsBySubscriptionId = async (
    id: SubscriptionId,
  ): Promise<CancellationSelectionEntity[]> => {
    const selections = await this.prismaClient.cancellationSelection.findMany({
      where: { subscription_id: id },
      orderBy: {
        id: 'desc',
      },
    });

    return selections.map<CancellationSelectionEntity>(
      (selection) => new CancellationSelection(selection),
    );
  };

  public getLastCancelledSubscription = async (
    userId: UserId,
    subscriptionType?: SubscriptionType,
  ): Promise<SubscriptionEntity | null> => {
    const cancelStates: SubscriptionState[] = [STATE_CANCELLED, STATE_CANCELLATION];
    return this.prismaClient.subscription.findFirst({
      where: {
        user_id: userId,
        state: {
          in: cancelStates,
        },
        subscription_type: subscriptionType,
      },
      orderBy: {
        updated_at: 'desc',
      },
    });
  };
}
