import {
  UserId,
  FirebaseId,
  AgentId,
  CancellationSelectionGf2Input,
  CreateUserInput,
  UserInput,
  UserEntity,
  AddressEntity,
  SubscriptionEntity,
  PreferenceEntity,
  UserOutput,
} from '@makegoodfood/gf3-types';

export interface ContactInformation {
  isEmpty: () => boolean;
}

export interface AnonUserInput {
  email_hash: string;
  phone_hash: string;
  first_name_hash: string;
  last_name_hash: string;
}

export interface UserBehaviour {
  cancelUser: (
    userId: UserId,
    reasons?: CancellationSelectionGf2Input,
    agentId?: AgentId,
  ) => Promise<void>;
  createUser: (inputUser: CreateUserInput) => Promise<UserEntity>;
  findMatchingUser: (input: UserEntity | CreateUserInput) => Promise<UserEntity | null>;
  getUser: (id: UserId) => Promise<UserOutput>;
  getUserByFirebaseId: (firebaseId: FirebaseId) => Promise<UserEntity | null>;
  updateUser: (id: UserId, update: Partial<UserInput>, agentId?: AgentId) => Promise<UserEntity>;
  anonymizeUser: (id: UserId) => Promise<void>;
}

export interface UserRepository {
  createUser: (user: UserEntity) => Promise<UserEntity>;
  getMatchingUser: (user: UserInput) => Promise<UserEntity | null>;
  getUser: (id: UserId) => Promise<UserEntity>;
  getUserByFirebaseId: (firebaseId: FirebaseId) => Promise<UserEntity | null>;
  getUserComposite: (id: UserId) => Promise<UserCompositeEntity>;
  getUserByFirebaseIdComposite: (firebaseId: FirebaseId) => Promise<UserCompositeEntity | null>;
  emailExists: (email: string) => Promise<boolean>;
  firebaseIdExists: (firebaseId: string) => Promise<boolean>;
  updateUser: (id: UserId, update: Partial<UserInput>) => Promise<UserEntity>;
  anonymizePersonalData: (id: UserId, anonymizedUser: AnonUserInput) => Promise<void>;
}

export interface UserCompositeEntity {
  user: UserEntity;
  addresses: AddressEntity[];
  subscriptions: SubscriptionEntity[];
  preferences: PreferenceEntity[];
}
