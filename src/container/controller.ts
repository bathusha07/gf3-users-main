import * as awilix from 'awilix';
import AddressController from '../controllers/AddressController';
import AdminController from '../controllers/AdminController';
import AgreementController from '../controllers/AgreementController';
import CardController from '../controllers/CardController';
import MembershipController from '../controllers/MembershipController';
import MembershipPriceController from '../controllers/MembershipPriceController';
import MigrationController from '../controllers/MigrationController';
import PlanController from '../controllers/PlanController';
import PlanFrequencyController from '../controllers/PlanFrequencyController';
import SetupIntentController from '../controllers/SetupIntentController';
import SubscriptionController from '../controllers/SubscriptionController';
import UserController from '../controllers/UserController';

export default {
  addressController: awilix.asClass(AddressController),
  adminController: awilix.asClass(AdminController),
  agreementController: awilix.asClass(AgreementController),
  cardController: awilix.asClass(CardController),
  membershipController: awilix.asClass(MembershipController),
  membershipPriceController: awilix.asClass(MembershipPriceController),
  migrationController: awilix.asClass(MigrationController),
  planController: awilix.asClass(PlanController),
  planFrequencyController: awilix.asClass(PlanFrequencyController),
  setupIntentController: awilix.asClass(SetupIntentController),
  subscriptionController: awilix.asClass(SubscriptionController),
  userController: awilix.asClass(UserController),
};
