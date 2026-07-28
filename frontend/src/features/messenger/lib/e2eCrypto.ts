/**
 * Client-side E2E for DIRECT chats: ECDH P-256 + AES-GCM.
 * Private keys never leave the device (IndexedDB). Ciphertext is stored
 * server-side prefixed with `§E2E1§` so the backend can show a locked preview.
 *
 * This is not the Signal Protocol — group chats stay plaintext until a
 * multi-device ratchet ships.
 */

export const E2E_PREFIX = "§E2E1§";

const DB_NAME = "svmessenger-e2e";
const STORE = "keys";
const IDENTITY_ID = "identity";

interface StoredIdentity {
  publicJwk: JsonWebKey;
  privateJwk: JsonWebKey;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet(): Promise<StoredIdentity | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(IDENTITY_ID);
    req.onsuccess = () => resolve((req.result as StoredIdentity | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(value: StoredIdentity): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, IDENTITY_ID);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importPublic(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDH", namedCurve: "P-256" }, true, []);
}

async function importPrivate(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]);
}

async function deriveAesKey(privateKey: CryptoKey, publicKey: CryptoKey): Promise<CryptoKey> {
  const bits = await crypto.subtle.deriveBits({ name: "ECDH", public: publicKey }, privateKey, 256);
  return crypto.subtle.importKey("raw", bits, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

/** Ensures a local identity exists and returns its public JWK JSON. */
export async function ensureIdentity(): Promise<string> {
  const existing = await idbGet();
  if (existing) return JSON.stringify(existing.publicJwk);

  const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
    "deriveBits",
  ]);
  const publicJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  const privateJwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  await idbPut({ publicJwk, privateJwk });
  return JSON.stringify(publicJwk);
}

export function isE2ECiphertext(text: string | null | undefined): boolean {
  return Boolean(text?.startsWith(E2E_PREFIX));
}

export async function encryptForPeer(plainText: string, peerPublicJwkJson: string): Promise<string> {
  const identity = await idbGet();
  if (!identity) throw new Error("Липсва локален E2E ключ");

  const privateKey = await importPrivate(identity.privateJwk);
  const peerPublic = await importPublic(JSON.parse(peerPublicJwkJson) as JsonWebKey);
  const aes = await deriveAesKey(privateKey, peerPublic);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aes,
    new TextEncoder().encode(plainText),
  );

  const packed = new Uint8Array(iv.length + cipher.byteLength);
  packed.set(iv, 0);
  packed.set(new Uint8Array(cipher), iv.length);
  return `${E2E_PREFIX}${bytesToBase64(packed)}`;
}

export async function decryptFromPeer(
  cipherText: string,
  peerPublicJwkJson: string,
): Promise<string | null> {
  if (!isE2ECiphertext(cipherText)) return cipherText;
  try {
    const identity = await idbGet();
    if (!identity) return null;

    const privateKey = await importPrivate(identity.privateJwk);
    const peerPublic = await importPublic(JSON.parse(peerPublicJwkJson) as JsonWebKey);
    const aes = await deriveAesKey(privateKey, peerPublic);

    const packed = base64ToBytes(cipherText.slice(E2E_PREFIX.length));
    const iv = packed.slice(0, 12);
    const data = packed.slice(12);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aes, data);
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}
