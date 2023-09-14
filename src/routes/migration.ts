import express = require('express');
import container from '../container';
import MigrationController from '../controllers/MigrationController';

const migrationRoutes = express.Router();
const controller = container.resolve<MigrationController>('migrationController');

migrationRoutes.route('/user').post(controller.createUser);

export default migrationRoutes;
