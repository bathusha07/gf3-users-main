import { mock, mockClear } from 'jest-mock-extended';
import StripeCustomerBehaviourImpl from '../../../../src/domain/stripeCustomer/StripeCustomerBehaviourImpl';
import {
  StripeCustomerRepository,
  StripeService,
  UserRepository,
} from '../../../../src/domain/types';
import generateUser from '../../../factories/user';
import generateStripeCustomer from '../../../factories/stripeCustomer';

describe('StripeCustomerBehaviourImpl', () => {
  const mocks = {
    stripeCustomerRepository: mock<StripeCustomerRepository>(),
    stripeService: mock<StripeService>(),
    userRepository: mock<UserRepository>(),
  };
  describe('createStripeCustomer', () => {
    beforeEach(() => {
      Object.values(mocks).forEach(mockClear);
    });

    test("it should include the user's id and email in the record on stripe", async () => {
      const inputUser = generateUser();
      mocks.stripeCustomerRepository.getStripeCustomerByUserId.mockResolvedValueOnce(null);
      mocks.userRepository.getUser.mockResolvedValueOnce(inputUser);
      mocks.stripeService.createCustomer.mockResolvedValueOnce({ id: 'stripe_cus' });
      mocks.stripeCustomerRepository.createStripeCustomer.mockResolvedValueOnce({
        user_id: 'foo',
        stripe_customer_id: 'stripe_cus',
      });

      const behaviour = new StripeCustomerBehaviourImpl(mocks);
      await behaviour.createStripeCustomer('foo');

      expect(mocks.stripeService.createCustomer).toBeCalledWith(
        expect.objectContaining({
          email: inputUser.email,
          metadata: {
            user_id: inputUser.id,
          },
        }),
      );
    });

    test('if the record already exists do not call anything', async () => {
      mocks.stripeCustomerRepository.getStripeCustomerByUserId.mockResolvedValueOnce({
        user_id: 'foo',
        stripe_customer_id: 'stripe_cus',
      });

      const behaviour = new StripeCustomerBehaviourImpl(mocks);
      await behaviour.createStripeCustomer('foo');

      expect(mocks.userRepository.createUser).not.toBeCalled();
      expect(mocks.stripeService.createCustomer).not.toBeCalled();
      expect(mocks.stripeCustomerRepository.createStripeCustomer).not.toBeCalled();
    });
  });

  describe('anonymizeStripeCustomer', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    const stripeCustomer = generateStripeCustomer();
    it('should anonymize a Stripe customer if found', async () => {
      const behaviour = new StripeCustomerBehaviourImpl(mocks);
      mocks.stripeCustomerRepository.getStripeCustomerByUserId.mockResolvedValueOnce(
        stripeCustomer,
      );

      await behaviour.anonymizeStripeCustomer(stripeCustomer.user_id);

      expect(mocks.stripeCustomerRepository.getStripeCustomerByUserId).toHaveBeenCalledWith(
        stripeCustomer.user_id,
      );
      expect(mocks.stripeService.deleteCustomerAndCards).toHaveBeenCalledWith(
        stripeCustomer.stripe_customer_id,
      );
      expect(mocks.stripeCustomerRepository.anonymizeStripeCustomer).toHaveBeenCalledWith(
        stripeCustomer.stripe_customer_id,
      );
    });

    it('should not anonymize if Stripe customer not found', async () => {
      const behaviour = new StripeCustomerBehaviourImpl(mocks);
      mocks.stripeCustomerRepository.getStripeCustomerByUserId.mockResolvedValueOnce(null);

      await behaviour.anonymizeStripeCustomer(stripeCustomer.user_id);

      expect(mocks.stripeCustomerRepository.getStripeCustomerByUserId).toHaveBeenCalledWith(
        stripeCustomer.user_id,
      );
      expect(mocks.stripeService.deleteCustomerAndCards).not.toHaveBeenCalled();
      expect(mocks.stripeCustomerRepository.anonymizeStripeCustomer).not.toHaveBeenCalled();
    });
  });
});
