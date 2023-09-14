import { PrismaClient } from '@prisma/client';
import { AnonUserInput, UserCompositeEntity, UserRepository } from '../../domain/types';
import { UserId, FirebaseId, UserEntity, UserInput } from '@makegoodfood/gf3-types';
import ResourceNotFound from '../../domain/errors/ResourceNotFound';
import User from '../../domain/user/User';
import handlePrismaError from './prismaErrorHandler';
import UserComposite from '../../domain/user/UserComposite';
import { v4 as uuidv4 } from 'uuid';
import { ANONYMIZED_USER_PREFIX } from '../../domain/user/constants';

export default class PrismaUserRepository implements UserRepository {
  protected prismaClient: PrismaClient;
  private RESOURCE_NAME = User.name;

  public constructor({ prismaClient }: { prismaClient: PrismaClient }) {
    this.prismaClient = prismaClient;
  }

  public createUser = async (userToCreate: UserEntity): Promise<UserEntity> => {
    let createdUser;
    try {
      createdUser = await this.prismaClient.user.create({
        data: userToCreate,
      });
    } catch (error) {
      throw handlePrismaError(error);
    }

    return new User(createdUser);
  };

  public getMatchingUser = async (user: UserInput): Promise<UserEntity | null> => {
    const matching = await this.prismaClient.user.findFirst({
      where: {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        firebase_id: user.firebase_id,
      },
    });

    if (matching) {
      return new User(matching);
    }
    return null;
  };

  protected fieldExists = (field: keyof UserEntity): ((s: string) => Promise<boolean>) => async (
    fieldValue: string,
  ): Promise<boolean> => {
    const count = await this.prismaClient.user.count({
      where: { [field]: fieldValue },
    });
    return count > 0;
  };

  public emailExists = this.fieldExists('email');

  public firebaseIdExists = this.fieldExists('firebase_id');

  public getUser = async (id: UserId): Promise<UserEntity> => {
    const user = await this.prismaClient.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new ResourceNotFound(User.name, id);
    }
    return new User(user);
  };

  public getUserByFirebaseId = async (firebaseId: FirebaseId): Promise<UserEntity | null> => {
    const user = await this.prismaClient.user.findFirst({
      where: { firebase_id: firebaseId },
    });
    if (!user) {
      throw new ResourceNotFound(User.name, firebaseId);
    }
    return new User(user);
  };

  public getUserComposite = async (id: UserId): Promise<UserCompositeEntity> => {
    const record = await this.prismaClient.user.findUnique({
      where: { id },
      include: {
        addresses: true,
        subscriptions: true,
        preferences: true,
      },
    });

    if (!record) {
      throw new ResourceNotFound(this.RESOURCE_NAME, id);
    }

    const { addresses, subscriptions, preferences, ...user } = record;

    return new UserComposite({
      user,
      addresses,
      subscriptions,
      preferences,
    });
  };

  public getUserByFirebaseIdComposite = async (
    firebaseId: FirebaseId,
  ): Promise<UserCompositeEntity | null> => {
    const record = await this.prismaClient.user.findFirst({
      where: { firebase_id: firebaseId },
      include: {
        addresses: true,
        subscriptions: true,
        preferences: true,
      },
    });

    if (record) {
      const { addresses, subscriptions, preferences, ...user } = record;

      return new UserComposite({
        user,
        addresses,
        subscriptions,
        preferences,
      });
    }
    return null;
  };

  public updateUser = async (id: UserId, update: Partial<UserInput>): Promise<UserEntity> => {
    const updatedUser = await this.prismaClient.user.update({
      where: { id },
      data: update,
    });

    return new User(updatedUser);
  };

  public anonymizePersonalData = async (
    id: UserId,
    anonymizedUser: AnonUserInput,
  ): Promise<void> => {
    try {
      const anonymizedFBid = ANONYMIZED_USER_PREFIX.concat(
        uuidv4().replace(/-/g, '').substring(0, 20),
      );
      await this.prismaClient.user.update({
        where: { id },
        data: {
          email: anonymizedUser.email_hash,
          firebase_id: anonymizedFBid,
          first_name: anonymizedUser.first_name_hash,
          last_name: anonymizedUser.last_name_hash,
          phone: anonymizedUser.phone_hash,
          deleted_at: new Date(),
        },
      });
    } catch (e) {
      throw handlePrismaError(e);
    }
  };
}
