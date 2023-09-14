import { PrismaClient, PrismaPromise } from '@prisma/client';
import { PreferenceRepository, PreferenceUpdateInput } from '../../domain/types';
import {
  UserId,
  OptionalSubscriptionId,
  PreferenceEntity,
  PreferenceTag,
} from '@makegoodfood/gf3-types';
import Preference from '../../domain/user/Preference';
import handlePrismaError from './prismaErrorHandler';

export default class PrismaPreferenceRepository implements PreferenceRepository {
  protected prismaClient: PrismaClient;

  public constructor({ prismaClient }: { prismaClient: PrismaClient }) {
    this.prismaClient = prismaClient;
  }

  public upsert = async (input: PreferenceUpdateInput): Promise<PreferenceEntity[]> => {
    const queries: PrismaPromise<Preference>[] = [];
    input.toDelete.forEach((preference) =>
      queries.push(
        this.prismaClient.preference.delete({
          where: { id: preference.id },
        }),
      ),
    );
    input.toInsert.forEach((preference) =>
      queries.push(
        this.prismaClient.preference.create({
          data: preference,
        }),
      ),
    );

    try {
      await this.prismaClient.$transaction(queries);
    } catch (error) {
      throw handlePrismaError(error);
    }

    if (input.subscriptionId) {
      return this.getByUserIdAndSubscriptionId(input.userId, input.subscriptionId);
    }
    return this.getByUserId(input.userId);
  };

  public getByUserIdAndSubscriptionId = async (
    userId: UserId,
    subscriptionId: OptionalSubscriptionId,
  ): Promise<PreferenceEntity[]> => {
    const selections = await this.prismaClient.preference.findMany({
      where: {
        user_id: userId,
        subscription_id: subscriptionId,
      },
    });

    return selections.map<PreferenceEntity>((preference) => new Preference(preference));
  };

  public getByUserId = async (userId: UserId): Promise<PreferenceEntity[]> => {
    const selections = await this.prismaClient.preference.findMany({
      where: {
        user_id: userId,
      },
    });

    return selections.map<PreferenceEntity>((preference) => new Preference(preference));
  };

  public upsertMigratedPreferences = async (
    userId: UserId,
    inputPreference: PreferenceTag[],
  ): Promise<PreferenceEntity[]> => {
    await this.prismaClient.preference.deleteMany({
      where: { user_id: userId },
    });

    const data = {
      data: inputPreference.map((preference: string) => ({
        user_id: userId,
        tag: preference,
      })),
    };
    await this.prismaClient.preference.createMany(data);
    return this.getByUserId(userId);
  };
}
