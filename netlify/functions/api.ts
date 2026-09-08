import serverless from 'serverless-http';
import { createApiApp } from '../../src/server/app';

let netlifyBlobsModule: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  netlifyBlobsModule = require('@netlify/blobs');
} catch {
  // optional
}

const app = createApiApp();

const serverlessHandler = serverless(app, {
  binary: [
    'image/*',
    'video/*',
    'audio/*',
    'application/octet-stream',
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    '*/*'
  ]
});

export const handler = async (event: any, context: any) => {
  if (event && event.blobs && typeof event.blobs === 'string' && netlifyBlobsModule && typeof netlifyBlobsModule.connectLambda === 'function') {
    try {
      netlifyBlobsModule.connectLambda(event);
    } catch (e) {
      console.warn('Notice: connectLambda error:', e);
    }
  }
  return serverlessHandler(event, context);
};
