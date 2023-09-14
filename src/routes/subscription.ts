import express = require('express');
import container from '../container';
import SubscriptionController from '../controllers/SubscriptionController';
import { VALID_EVENTS as VALID_SUBSCRIPTION_EVENTS } from '../domain/subscription/constants';
import { SubscriptionEvent } from '../domain/types';

const controller = container.resolve<SubscriptionController>('subscriptionController');

const subscriptionRoutes = express.Router();

subscriptionRoutes
  .route('/:id/cancellation')
  .get(controller.getCancellationSelections)
  .post(controller.cancelSubscription);

subscriptionRoutes
  .route('/cancellation_reason')
  .get(controller.getCancellationReasons)
  .post(controller.createCancellationReason);

subscriptionRoutes
  .route('/cancellation_reason/:id')
  .put(controller.updateCancellationReason)
  .delete(controller.deleteCancellationReason);

subscriptionRoutes.route('/:id').get(controller.getSubscription);
subscriptionRoutes.route('/:id/membership').get(controller.getSubscriptionMembership);
subscriptionRoutes.route('/').post(controller.createSubscription);
subscriptionRoutes.route('/curate').post(controller.curateScheduledSubscriptions);
subscriptionRoutes.route('/renew').post(controller.checkSubscriptionsDueForRenewal);
subscriptionRoutes.route('/:id/plan').patch(controller.updateSubscriptionPlan);
subscriptionRoutes.route('/:id/weekday').patch(controller.updateSubscriptionDeliveryDay);
subscriptionRoutes.route('/:id/schedule').patch(controller.updateSubscriptionDeliverySchedule);
subscriptionRoutes.route('/:id/trial').patch(controller.extendSubscriptionTrial);

VALID_SUBSCRIPTION_EVENTS.forEach((event: SubscriptionEvent) => {
  subscriptionRoutes
    .route(`/:subscriptionId/${event}`)
    .put(controller.updateSubscriptionState(event));
});

export default subscriptionRoutes;
