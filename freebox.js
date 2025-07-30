import { getStoredKeys } from './utils.js';

const appInfo = {
    app_id: "debrid_link.dl",
    app_name : "DebridLink Download",
    app_version: "1.0",
    device_name: "Babal's Chrome"
}

const FREEBOX_API_BASE = "/api/latest"

export async function sendToFreebox(link) {
    const { freeboxUrl, freeboxPort } = await getStoredKeys(['freeboxUrl','freeboxPort']);
    const api_path = `${freeboxUrl}:${freeboxPort}${FREEBOX_API_BASE}`

    const session_token = await getFreeboxSessionToken(api_path);

    const res = await fetch(`${api_path}/downloads/add`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Fbx-App-Auth": session_token
        },
        body: `download_url=${link}`
    });

    const data = await res.json();
    if (!data.success) {
        throw new Error("Erreur Freebox: " + JSON.stringify(data.msg));
    }
}

async function getFreeboxSessionToken(api_url) {
    const challenge = await getFreeboxChallenge(api_url);
    const {freeboxToken} = await getStoredKeys(['freeboxToken']);
    const password = await sha1Hmac(challenge, freeboxToken);

    const res = await fetch(`${api_url}/login/session/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        app_id: appInfo.app_id,
        password: password
        })
    });

    const data = await res.json();
    if (!data.success) throw new Error("Échec de l'authentification Freebox");
    return data.result.session_token;
}

async function getFreeboxChallenge(api_url) {
  const res = await fetch(`${api_url}/login/`);
  const data = await res.json();
  if (!data.success) throw new Error("Erreur de challenge Freebox");
  return data.result.challenge;
}

async function sha1Hmac(message, key) {
  const enc = new TextEncoder();
  const keyData = enc.encode(key);
  const msgData = enc.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function getFreeboxAppToken(url, port) {
    const res = await fetch(`${url}:${port}${FREEBOX_API_BASE}/login/authorize/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appInfo)
    });

    const data = await res.json();
    return {value: data.result.app_token, id: data.result.track_id};
}