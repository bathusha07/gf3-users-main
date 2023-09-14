import { PrismaClient } from '@prisma/client';
import ResourceNotFound from '../../domain/errors/ResourceNotFound';
import CancellationReason from '../../domain/subscription/CancellationReason';
import { CancellationReasonRepository, GetCancellationReasonsOptions } from '../../domain/types';
import {
  CancellationReasonEntity,
  CancellationReasonId,
  CancellationReasonInput,
} from '@makegoodfood/gf3-types';
import handlePrismaError from './prismaErrorHandler';

export default class PrismaCancellationReasonRepository implements CancellationReasonRepository {
  private prismaClient: PrismaClient;
  private resourceName = CancellationReason.name;

  public constructor({ prismaClient }: { prismaClient: PrismaClient }) {
    this.prismaClient = prismaClient;
  }

  public createReason = async (
    data: CancellationReasonInput,
  ): Promise<CancellationReasonEntity> => {
    let reason;
    try {
      reason = await this.prismaClient.cancellationReason.create({ data });
    } catch (error) {
      throw handlePrismaError(error);
    }

    return new CancellationReason(reason);
  };

  public getReason = async (id: CancellationReasonId): Promise<CancellationReasonEntity> => {
    const reason = await this.prismaClient.cancellationReason.findUnique({
      where: { id },
    });
    if (!reason || reason.deleted_at) {
      throw new ResourceNotFound(this.resourceName, id);
    }

    return new CancellationReason(reason);
  };

  public getReasons = async (
    opts?: GetCancellationReasonsOptions,
  ): Promise<CancellationReasonEntity[]> => {
    const reasons = await this.prismaClient.cancellationReason.findMany({
      where: {
        is_user_visible: opts?.is_user_visible,
        deleted_at: null,
      },
      orderBy: {
        priority: 'asc',
      },
    });
    return reasons.map<CancellationReasonEntity>((reason) => new CancellationReason(reason));
  };

  public updateReason = async (
    data: CancellationReasonEntity,
  ): Promise<CancellationReasonEntity> => {
    let reason;
    try {
      reason = await this.prismaClient.cancellationReason.update({
        data,
        where: {
          id: data.id,
        },
      });
    } catch (error) {
      throw handlePrismaError(error);
    }

    return new CancellationReason(reason);
  };

  public deleteReason = async (id: CancellationReasonId, now: Date): Promise<void> => {
    try {
      await this.prismaClient.cancellationReason.update({
        data: { deleted_at: now },
        where: { id },
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  };
}
