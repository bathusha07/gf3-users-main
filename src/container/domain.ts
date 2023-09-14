import * as awilix from 'awilix';
import AddressBehaviourImpl from '../domain/address/AddressBehaviourImpl';
import AgreementBehaviourImpl from '../domain/agreement/AgreementBehaviourImpl';
import CardBehaviourImpl from '../domain/card/CardBehaviourImpl';
import DateBehaviourImpl from '../domain/date/DateBehaviourImpl';
import MembershipBehaviourImpl from '../domain/membership/MembershipBehaviourImpl';
import MembershipPriceBehaviourImpl from '../domain/membershipPrice/MembershipPriceBehaviourImpl';
import MigrationBehaviourImpl from '../domain/migration/MigrationBehaviourImpl';
import PlanBehaviourImpl from '../domain/plan/PlanBehaviourImpl';
import PlanFrequencyBehaviourImpl from '../domain/planFrequency/PlanFrequencyBehaviourImpl';
import SetupIntentBehaviourImpl from '../domain/setupIntent/SetupIntentBehaviourImpl';
import StripeCustomerBehaviourImpl from '../domain/stripeCustomer/StripeCustomerBehaviourImpl';
import CancellationReasonBehaviourImpl from '../domain/subscription/CancellationReasonBehaviourImpl';
import SubscriptionBehaviourImpl from '../domain/subscription/SubscriptionBehaviourImpl';
import SubscriptionValuesFactoryImpl from '../domain/subscription/SubscriptionValuesFactoryImpl';
import UserBehaviourImpl from '../domain/user/UserBehaviourImpl';
import PreferenceBehaviourImpl from '../domain/user/PreferenceBehaviourImpl';
import SubscriptionMessagePublisherImpl from '../domain/subscription/SubscriptionMessagePublisherImpl';
import SubscriptionProductFetcherImpl from '../domain/subscription/SubscriptionProductFetcherImpl';

export default {
  addressBehaviour: awilix.asClass(AddressBehaviourImpl),
  agreementBehaviour: awilix.asClass(AgreementBehaviourImpl),
  cardBehaviour: awilix.asClass(CardBehaviourImpl),
  dateBehaviour: awilix.asClass(DateBehaviourImpl),
  membershipBehaviour: awilix.asClass(MembershipBehaviourImpl),
  membershipPriceBehaviour: awilix.asClass(MembershipPriceBehaviourImpl),
  migrationBehaviour: awilix.asClass(MigrationBehaviourImpl),
  planBehaviour: awilix.asClass(PlanBehaviourImpl),
  planFrequencyBehaviour: awilix.asClass(PlanFrequencyBehaviourImpl),
  setupIntentBehaviour: awilix.asClass(SetupIntentBehaviourImpl),
  stripeCustomerBehaviour: awilix.asClass(StripeCustomerBehaviourImpl),
  subscriptionBehaviour: awilix.asClass(SubscriptionBehaviourImpl),
  subscriptionValuesFactory: awilix.asClass(SubscriptionValuesFactoryImpl),
  subscriptionMessagePublisher: awilix.asClass(SubscriptionMessagePublisherImpl),
  userBehaviour: awilix.asClass(UserBehaviourImpl),
  preferenceBehaviour: awilix.asClass(PreferenceBehaviourImpl),
  cancellationReasonBehaviour: awilix.asClass(CancellationReasonBehaviourImpl),
  subscriptionProductFetcher: awilix.asClass(SubscriptionProductFetcherImpl),
};
