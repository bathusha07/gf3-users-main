import express = require('express');
import container from '../container';
import PlanController from '../controllers/PlanController';

const controller = container.resolve<PlanController>('planController');

const planRoutes = express.Router();
planRoutes.route('/').get(controller.getPlans);

export default planRoutes;
