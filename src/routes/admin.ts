import express = require('express');
import container from '../container';
import AdminController from '../controllers/AdminController';
import { EVENT_PAUSE, EVENT_ACTIVATE } from '../domain/subscription/constants';
import { SubscriptionEvent } from '../domain/types';

const adminRoutes = express.Router();
const controller = container.resolve<AdminController>('adminController');
adminRoutes.route('/address').post(controller.createAddress);
adminRoutes.route('/user/:id').patch(controller.updateUser);
adminRoutes.route('/subscription/:id/cancellation').post(controller.cancelSubscription);
adminRoutes.route('/subscription/:id/coupon').patch(controller.updateSubscriptionCoupon);
adminRoutes.route('/subscription/:id/plan').patch(controller.updateSubscriptionPlan);
adminRoutes.route('/subscription/:id/weekday').patch(controller.updateSubscriptionDeliveryDay);
adminRoutes
  .route('/user/:id/wow-membership-trial')
  .post(controller.createMembershipSubscriptionTrial);
adminRoutes.route('/user/:user_id/cancel').post(controller.cancelUser);
adminRoutes
  .route('/user/:user_id/subscription/uncancel')
  .post(controller.createSubscriptionFromLastCancelledSubscription);
([EVENT_PAUSE, EVENT_ACTIVATE] as SubscriptionEvent[]).forEach((event: SubscriptionEvent) => {
  adminRoutes.route(`/subscription/:id/${event}`).put(controller.updateSubscriptionState(event));
});
adminRoutes
  .route('/user/:user_id/user-cancellation-selection')
  .get(controller.userCancellationSelection);

export default adminRoutes;
