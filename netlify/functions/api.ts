import serverless from 'serverless-http';
import { createApiApp } from '../../src/server/app';

const app = createApiApp();

export const handler = serverless(app);
