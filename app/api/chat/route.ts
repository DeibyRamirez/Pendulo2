// app/api/chat/route.ts

import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebaseAdmin";
import { MODEL_CONFIG, PHYSICS_SYSTEM_PROMPT } from "@/lib/physics-context";
import { NextResponse } from "next/server";

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: IncomingMessage[];
}

// ─── Autenticación (Firebase Admin) ───
function obtenerAuthAdmin() {
  return getAuth(getAdminApp());
}

async function obtenerUidAutenticado(request: Request): Promise<string | null> {
  const encabezado = request.headers.get("authorization") ?? "";
  const token = encabezado.startsWith("Bearer ") ? encabezado.slice(7).trim() : "";
  if (!token) return null;
  try {
    const decodificado = await obtenerAuthAdmin().verifyIdToken(token);
    return decodificado.uid;
  } catch (err) {
    console.error("verifyIdToken falló:", err);
    return null;
  }
}

// ─── Límite en memoria por usuario (solo por instancia) ───
const LIMITE_MENSAJES = 20;
const VENTANA_LIMITE_MS = 10 * 60 * 1000;
const MAX_LONGITUD_MENSAJE = 2000;
const MAX_MENSAJES_HISTORIAL = 20;

const marcasPorUsuario = new Map<string, number[]>();

function superaLimite(uid: string): boolean {
  const ahora = Date.now();
  const vigentes = (marcasPorUsuario.get(uid) ?? []).filter(
    (marca) => ahora - marca < VENTANA_LIMITE_MS
  );
  if (vigentes.length >= LIMITE_MENSAJES) {
    marcasPorUsuario.set(uid, vigentes);
    return true;
  }
  vigentes.push(ahora);
  marcasPorUsuario.set(uid, vigentes);
  return false;
}

// ─── Access Token ───
async function getAccessToken(): Promise<string> {
  const metadataUrl =
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token";

  try {
    const res = await fetch(metadataUrl, {
      headers: { "Metadata-Flavor": "Google" },
      signal: AbortSignal.timeout(1000),
    });
    if (res.ok) {
      const data = await res.json();
      return data.access_token as string;
    }
  } catch {
    // No estamos en GCP
  }

  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!saJson) {
    throw new Error(
      "No se encontró credencial. Configura GOOGLE_SERVICE_ACCOUNT_JSON o usa ADC en GCP."
    );
  }

  let sa;
  try {
    sa = JSON.parse(saJson);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON no es un JSON válido (debe ir en una sola línea).");
  }
  return await getTokenFromServiceAccount(sa);
}

// ─── JWT firmado con la clave privada del Service Account ───
async function getTokenFromServiceAccount(sa: {
  client_email: string;
  private_key: string;
  token_uri?: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const tokenUri = sa.token_uri ?? "https://oauth2.googleapis.com/token";

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: sa.client_email,
    sub: sa.client_email,
    aud: tokenUri,
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/cloud-platform",
  };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const signingInput = `${encode(header)}.${encode(payload)}`;

  const pemBody = sa.private_key
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");

  const keyData = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const jwt =
    signingInput +
    "." +
    btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const tokenRes = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Error obteniendo token: ${err}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token as string;
}

// ─── URL de Vertex según ubicación ───
function construirVertexUrl(projectId: string, location: string, modelId: string): string {
  const host =
    location === "global"
      ? "aiplatform.googleapis.com"
      : `${location}-aiplatform.googleapis.com`;
  return (
    `https://${host}/v1/projects/${projectId}/locations/${location}/` +
    `publishers/google/models/${modelId}:generateContent`
  );
}

// ─── POST /api/chat ───
export async function POST(request: Request) {
  try {
    const uid = await obtenerUidAutenticado(request);
    if (!uid) {
      return NextResponse.json(
        { error: "No autenticado. Inicia sesión para usar el asistente." },
        { status: 401 }
      );
    }

    const body: RequestBody = await request.json();
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: "El campo 'messages' es obligatorio y debe ser un array no vacío." },
        { status: 400 }
      );
    }

    if (body.messages.length > MAX_MENSAJES_HISTORIAL) {
      return NextResponse.json(
        { error: `El historial no puede superar ${MAX_MENSAJES_HISTORIAL} mensajes.` },
        { status: 400 }
      );
    }

    const mensajeInvalido = body.messages.some(
      (msg) =>
        typeof msg?.content !== "string" ||
        msg.content.trim().length === 0 ||
        msg.content.length > MAX_LONGITUD_MENSAJE
    );
    if (mensajeInvalido) {
      return NextResponse.json(
        { error: `Cada mensaje debe ser texto de máximo ${MAX_LONGITUD_MENSAJE} caracteres.` },
        { status: 400 }
      );
    }

    if (superaLimite(uid)) {
      return NextResponse.json(
        {
          error: `Has alcanzado el límite de ${LIMITE_MENSAJES} mensajes cada 10 minutos. Intenta de nuevo más tarde.`,
        },
        { status: 429 }
      );
    }

    const projectId = process.env.VERTEX_PROJECT_ID;
    const location = process.env.VERTEX_LOCATION ?? "global";

    if (!projectId) {
      return NextResponse.json(
        { error: "VERTEX_PROJECT_ID no está configurado." },
        { status: 500 }
      );
    }

    const accessToken = await getAccessToken();

    const contents = body.messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const vertexPayload = {
      systemInstruction: { parts: [{ text: PHYSICS_SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        maxOutputTokens: MODEL_CONFIG.maxOutputTokens,
        temperature: MODEL_CONFIG.temperature,
        topP: MODEL_CONFIG.topP,
        topK: MODEL_CONFIG.topK,
      },
    };

    const modelId = MODEL_CONFIG.model; // "gemini-3.5-flash-lite"
    const vertexUrl = construirVertexUrl(projectId, location, modelId);

    const vertexRes = await fetch(vertexUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(vertexPayload),
    });

    if (!vertexRes.ok) {
      // Leer como texto: Vertex puede responder HTML (404) en vez de JSON
      const raw = await vertexRes.text();
      let mensaje = `Error HTTP ${vertexRes.status}`;
      try {
        mensaje = JSON.parse(raw)?.error?.message ?? mensaje;
      } catch {
        // respuesta no JSON
      }
      console.error("Error en Vertex AI:", vertexRes.status, vertexUrl, raw.slice(0, 500));
      return NextResponse.json({ error: mensaje }, { status: vertexRes.status });
    }

    const vertexData = await vertexRes.json();
    const text: string =
      vertexData.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? "")
        .join("") || "Lo siento, no pude generar una respuesta.";

    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error("Error en /api/chat:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno del servidor." },
      { status: 500 }
    );
  }
}