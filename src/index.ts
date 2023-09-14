try {
  require('newrelic');
  // Will throw an error if none of the NEW_RELIC_ env vars are provided. This is fine for local dev.
  // eslint-disable-next-line no-empty
} catch (error) {}
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';

import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../openapi.json';
import addressRoutes from './routes/address';
import adminRoutes from './routes/admin';
import agreementRoutes from './routes/agreement';
import userRoutes from './routes/user';
import cardRoutes from './routes/card';
import membershipRoutes from './routes/membership';
import planFrequencyRoutes from './routes/planFrequency';
import planRoutes from './routes/plan';
import setupIntentRoutes from './routes/setupIntent';
import subscriptionRoutes from './routes/subscription';
import migrationRoutes from './routes/migration';
import errorHandler from './middleware/error/common';

// initialize express server
const app = express();
app.use(express.json());

app.use('/address', addressRoutes);
app.use('/admin', adminRoutes);
app.use('/agreement', agreementRoutes);
app.use('/card', cardRoutes);
app.use('/membership', membershipRoutes);
app.use('/migration', migrationRoutes);
app.use('/plan', planRoutes);
app.use('/plan_frequency', planFrequencyRoutes);
app.use('/setup_intent', setupIntentRoutes);
app.use('/subscription', subscriptionRoutes);
app.use('/user', userRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(errorHandler);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`The server is running on PORT ${PORT}`));
