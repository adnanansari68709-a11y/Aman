import serverless from 'serverless-http';
import { createApiApp } from '../../src/server/app';

const app = createApiApp();

export const handler = serverless(app, {
  binary: [
    'image/*',
    'video/*',
    'audio/*',
    'application/octet-stream',
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed'
  ]
});
