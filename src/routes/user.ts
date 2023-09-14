import express = require('express');
import container from '../container';
import AddressController from '../controllers/AddressController';
import CardController from '../controllers/CardController';
import SubscriptionController from '../controllers/SubscriptionController';
import UserController from '../controllers/UserController';

const userRoutes = express.Router();
const controller = container.resolve<UserController>('userController');
const addressController = container.resolve<AddressController>('addressController');
const cardController = container.resolve<CardController>('cardController');
const subscriptionController = container.resolve<SubscriptionController>('subscriptionController');

userRoutes.route('/').post(controller.createUser);
userRoutes.route('/:id').get(controller.getUser).patch(controller.updateUser);
userRoutes.route('/:id/address').get(addressController.getUserAddresses);
userRoutes.route('/:id/cancel').post(controller.cancelUser);
userRoutes.route('/:id/anonymize').put(controller.anonymizeUser);
userRoutes.route('/:id/card').get(cardController.getUserCards);
userRoutes.route('/:id/card/sync').patch(cardController.syncUserCards);
userRoutes.route('/:id/subscription').get(subscriptionController.getUserSubscriptions);
userRoutes.route('/firebase-id/:id').get(controller.getUserByFirebaseId);
userRoutes
  .route('/:user_id/subscription/last-cancelled')
  .get(subscriptionController.getLastCancelledSubscription);

userRoutes
  .route('/:id/preferences')
  .post(controller.createPreferences)
  .put(controller.setPreferences)
  .get(controller.getPreferences);
userRoutes.route('/:user_id/account_reactivation').put(controller.accountReactivation);
export default userRoutes;
