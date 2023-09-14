import express = require('express');
import container from '../container';
import PlanFrequencyController from '../controllers/PlanFrequencyController';

const planFrequencyRoutes = express.Router();
const controller = container.resolve<PlanFrequencyController>('planFrequencyController');

planFrequencyRoutes.route('/').get(controller.getPlanFrequencies);

export default planFrequencyRoutes;
