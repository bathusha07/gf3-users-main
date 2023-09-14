import express = require('express');
import container from '../container';
import MembershipController from '../controllers/MembershipController';
import MembershipPriceController from '../controllers/MembershipPriceController';

const membershipRoutes = express.Router();
const membershipController = container.resolve<MembershipController>('membershipController');
const membershipPriceController = container.resolve<MembershipPriceController>(
  'membershipPriceController',
);

membershipRoutes.route('/').get(membershipController.getMemberships);
membershipRoutes.route('/:id').get(membershipController.getMembership);
membershipRoutes.route('/:id/prices').get(membershipPriceController.getMembershipPrices);

export default membershipRoutes;
