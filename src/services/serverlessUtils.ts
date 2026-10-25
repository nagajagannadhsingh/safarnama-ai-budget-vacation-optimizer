/**
 * SAFARNAMA AI — Serverless Utility Helpers
 * Production-grade request handling, CORS, response normalization, and error isolation for Vercel
 */

export interface ApiResponse<T = any> {
  success: boolean;
  code?: string;
  message?: string;
  data?: T;
  [key: string]: any;
}

export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

export function enableCors(req: any, res: any): boolean {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return true; // Request handled
  }
  return false;
}

export function sendJson(res: any, statusCode: number, data: any, requestId?: string): void {
  const reqId = requestId || generateRequestId();
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Request-Id', reqId);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  const payload = {
    ...data,
    requestId: reqId
  };

  if (typeof res.json === 'function') {
    res.json(payload);
  } else {
    res.end(JSON.stringify(payload));
  }
}

export function sendError(
  res: any,
  statusCode: number,
  code: string,
  message: string,
  extra?: Record<string, any>
): void {
  const reqId = generateRequestId();
  const safeMessage = message.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]');

  sendJson(
    res,
    statusCode,
    {
      success: false,
      status: statusCode,
      code,
      error: safeMessage,
      message: safeMessage,
      ...(extra || {})
    },
    reqId
  );
}

export async function getRequestBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  // Stream reader fallback for raw Node HTTP requests
  return new Promise((resolve) => {
    let bodyStr = '';
    req.on('data', (chunk: any) => {
      bodyStr += chunk;
      // Protect against payload abuse (max 2MB)
      if (bodyStr.length > 2 * 1024 * 1024) {
        req.destroy();
        resolve({});
      }
    });
    req.on('end', () => {
      try {
        resolve(bodyStr ? JSON.parse(bodyStr) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export function getQueryParam(req: any, param: string): string {
  if (req.query && typeof req.query[param] === 'string') {
    return req.query[param].trim();
  }
  if (req.url && req.url.includes('?')) {
    try {
      const parsed = new URL(req.url, 'http://localhost');
      return (parsed.searchParams.get(param) || '').trim();
    } catch {
      return '';
    }
  }
  return '';
}
