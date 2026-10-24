import { readFileSync } from 'node:fs';
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
  type Credential,
  type ServiceAccount,
} from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export class AdminCredentialError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'AdminCredentialError';
  }
}

function repairMultilinePrivateKey(jsonStr: string): string {
  const markerStart = '-----BEGIN PRIVATE KEY-----';
  const markerEnd = '-----END PRIVATE KEY-----';
  const i0 = jsonStr.indexOf(markerStart);
  const i1 = jsonStr.indexOf(markerEnd);
  if (i0 < 0 || i1 < 0 || i1 <= i0) return jsonStr;

  const keyBlock = jsonStr.slice(i0, i1 + markerEnd.length);
  if (!keyBlock.includes('\n') && !keyBlock.includes('\r')) return jsonStr;

  const escaped = keyBlock.replace(/\r?\n/g, '\\n');
  return jsonStr.slice(0, i0) + escaped + jsonStr.slice(i1 + markerEnd.length);
}

function parseServiceAccountJson(raw: string): ServiceAccount {
  const trimmed = raw.trim();
  let jsonStr = trimmed;
  if (jsonStr.startsWith("'") && jsonStr.endsWith("'")) {
    jsonStr = jsonStr.slice(1, -1);
  }

  const candidates = [jsonStr, repairMultilinePrivateKey(jsonStr)];
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as ServiceAccount;
    } catch (err) {
      lastError = err;
    }
  }

  throw new AdminCredentialError(
    'JSON de cuenta de servicio inválido en GOOGLE_SERVICE_ACCOUNT_JSON. ' +
      'Usa GOOGLE_APPLICATION_CREDENTIALS con la ruta al archivo .json descargado de Firebase ' +
      '(Firebase Console → Cuentas de servicio → SDK de administración de Firebase).',
    { cause: lastError },
  );
}

function readServiceAccountFromFile(path: string): ServiceAccount {
  try {
    const content = readFileSync(path, 'utf8');
    return JSON.parse(content) as ServiceAccount;
  } catch (err) {
    throw new AdminCredentialError(
      `No se pudo leer la cuenta de servicio en GOOGLE_APPLICATION_CREDENTIALS (${path}).`,
      { cause: err },
    );
  }
}

function resolveProjectId(sa?: ServiceAccount): string | undefined {
  const fromSa = sa?.projectId ?? (sa as { project_id?: string } | undefined)?.project_id;
  const fromEnv = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  return fromSa || fromEnv || undefined;
}

export type AdminCredentialLoadResult = {
  credential: Credential;
  serviceAccount?: ServiceAccount;
};

/**
 * 1) GOOGLE_APPLICATION_CREDENTIALS (archivo)
 * 2) GOOGLE_SERVICE_ACCOUNT_JSON (una línea)
 * 3) Application Default Credentials
 */
export function loadAdminCredential(): AdminCredentialLoadResult {
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (credPath) {
    const serviceAccount = readServiceAccountFromFile(credPath);
    return { credential: cert(serviceAccount), serviceAccount };
  }

  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (saJson) {
    const serviceAccount = parseServiceAccountJson(saJson);
    return { credential: cert(serviceAccount), serviceAccount };
  }

  return { credential: applicationDefault(), serviceAccount: undefined };
}

function ensureAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const { credential, serviceAccount } = loadAdminCredential();
  const projectId = resolveProjectId(serviceAccount);
  if (!projectId) {
    throw new AdminCredentialError(
      'Firebase Admin: define NEXT_PUBLIC_FIREBASE_PROJECT_ID o project_id en la cuenta de servicio.',
    );
  }

  return initializeApp({
    credential,
    projectId,
  });
}

export function getAdminApp(): App {
  return ensureAdminApp();
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp());
}

export function adminFirestoreDisponible(): boolean {
  return (
    Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) ||
    Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim())
  );
}

export function isFirestorePermissionDenied(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = 'code' in err ? err.code : undefined;
  if (code === 7 || code === '7' || code === 'permission-denied') return true;
  const message = 'message' in err ? String(err.message) : '';
  return message.includes('PERMISSION_DENIED') || message.includes('insufficient permissions');
}

export function isAdminCredentialError(err: unknown): boolean {
  if (err instanceof AdminCredentialError || err instanceof SyntaxError) return true;
  if (err instanceof Error && err.cause) return isAdminCredentialError(err.cause);
  const message = err instanceof Error ? err.message : '';
  return (
    message.includes('JSON de cuenta de servicio') ||
    message.includes('GOOGLE_APPLICATION_CREDENTIALS')
  );
}
