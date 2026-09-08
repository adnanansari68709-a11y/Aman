import serverless from 'serverless-http';
import { createApiApp } from '../../src/server/app';

let netlifyBlobsModule: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  netlifyBlobsModule = require('@netlify/blobs');
} catch {
  // optional
}

function initBlobsEnvironment(event?: any, context?: any) {
  if (!netlifyBlobsModule) return;

  const getHeader = (name: string): string | undefined => {
    if (!event?.headers) return undefined;
    const lower = name.toLowerCase();
    for (const [k, v] of Object.entries(event.headers)) {
      if (k.toLowerCase() === lower && typeof v === 'string') return v;
    }
    return undefined;
  };

  const rawBlobs = event?.blobs || context?.blobs || getHeader('x-nf-blobs') || (context?.clientContext as any)?.blobs;
  let blobsData: { url?: string; token?: string } | null = null;
  if (typeof rawBlobs === 'string') {
    try {
      const decoded = Buffer.from(rawBlobs, 'base64').toString('utf8');
      blobsData = JSON.parse(decoded);
    } catch {}
  } else if (typeof rawBlobs === 'object' && rawBlobs !== null) {
    blobsData = rawBlobs;
  }

  const siteId = getHeader('x-nf-site-id') || process.env.SITE_ID || process.env.NETLIFY_SITE_ID || (context?.clientContext as any)?.site?.id;
  const deployId = getHeader('x-nf-deploy-id') || process.env.DEPLOY_ID || process.env.NETLIFY_DEPLOY_ID;
  const token = blobsData?.token || getHeader('x-nf-token') || process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_AUTH_TOKEN;
  const edgeUrl = blobsData?.url || process.env.NETLIFY_BLOBS_EDGE_URL;

  if (siteId) {
    process.env.NETLIFY_SITE_ID = siteId;
    process.env.SITE_ID = siteId;
  }
  if (token) {
    process.env.NETLIFY_BLOBS_TOKEN = token;
  }
  if (edgeUrl) {
    process.env.NETLIFY_BLOBS_EDGE_URL = edgeUrl;
  }
  if (deployId) {
    process.env.NETLIFY_DEPLOY_ID = deployId;
    process.env.DEPLOY_ID = deployId;
  }

  let blobsPayload = typeof rawBlobs === 'string' ? rawBlobs : null;
  if (!blobsPayload && (token || edgeUrl)) {
    try {
      blobsPayload = Buffer.from(JSON.stringify({ url: edgeUrl || '', token: token || '' })).toString('base64');
    } catch {}
  }

  if (typeof netlifyBlobsModule.connectLambda === 'function' && blobsPayload) {
    try {
      const normalizedEvent = {
        ...event,
        blobs: blobsPayload,
        headers: {
          ...(event?.headers || {}),
          'x-nf-site-id': siteId || '',
          'x-nf-deploy-id': deployId || '',
          'x-nf-token': token || ''
        }
      };
      netlifyBlobsModule.connectLambda(normalizedEvent);
    } catch (e) {
      console.warn('Notice: connectLambda error:', e);
    }
  }

  if (typeof netlifyBlobsModule.setEnvironmentContext === 'function' && (siteId || token)) {
    try {
      netlifyBlobsModule.setEnvironmentContext({
        siteID: siteId,
        deployID: deployId,
        token: token,
        edgeURL: edgeUrl
      });
    } catch {}
  }
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
  initBlobsEnvironment(event, context);
  return serverlessHandler(event, context);
};
