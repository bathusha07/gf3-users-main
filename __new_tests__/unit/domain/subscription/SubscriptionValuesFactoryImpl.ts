import { TYPE_MEMBERSHIP, TYPE_SCHEDULED } from '@makegoodfood/gf3-types';
import { mock, mockClear } from 'jest-mock-extended';
import ValidationError from '../../../../src/domain/errors/ValidationError';
import SubscriptionValuesFactoryImpl from '../../../../src/domain/subscription/SubscriptionValuesFactoryImpl';
import {
  DateBehaviour,
  MembershipRepository,
  PlanFrequencyRepository,
  PlanRepository,
} from '../../../../src/domain/types';
import generateMembership from '../../../factories/membership';
import { generateSubscriptionInput } from '../../../factories/subscription';

describe(SubscriptionValuesFactoryImpl.name, () => {
  const mocks = {
    membershipRepository: mock<MembershipRepository>(),
    planRepository: mock<PlanRepository>(),
    planFrequencyRepository: mock<PlanFrequencyRepository>(),
    dateBehaviour: mock<DateBehaviour>({
      getCurrentDate: jest.fn().mockImplementation(() => new Date(2019)),
    }),
  };

  const behaviour = new SubscriptionValuesFactoryImpl(mocks);

  afterEach(() => {
    Object.values(mocks).forEach(mockClear);
  });

  describe('subscriptionValues', () => {
    it('should accept MEMBERSHIP inputs with no address_id', () => {
      const input = generateSubscriptionInput();
      input.subscription_type = TYPE_MEMBERSHIP;
      input.address_id = undefined;
      mocks.membershipRepository.getMembership.mockImplementationOnce(() =>
        Promise.resolve(generateMembership()),
      );
      mocks.dateBehaviour.calculateNextCycle.mockImplementationOnce(() => new Date());
      return expect(behaviour.subscriptionValues(input)).resolves.toBeTruthy();
    });

    it('should throw an error on SCHEDULED inputs with no address_id', () => {
      const input = generateSubscriptionInput();
      input.subscription_type = TYPE_SCHEDULED;
      input.address_id = undefined;
      return expect(behaviour.subscriptionValues(input)).rejects.toThrowError(ValidationError);
    });
  });
});
