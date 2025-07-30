const appInfo = {
    app_id: "debrid_link.dl",
    app_name : "DebridLink Download",
    app_version: "1.0",
    device_name: "Babal's Chrome"
}

const DEBRID_API_DL = "https://debrid-link.com/api/v2/downloader/add";
const DEBRID_KEY = "Bearer rBIO1a-8xyRwzmUEnkOvVWukyXL1tA3zqIBw-e-e_gaYpEzM0HF6Dbj-UPTndJAo";

const FREEBOX_API_BASE = "https://hbaudet.freeboxos.fr:16246/api/latest";
const APP_TOKEN = "LEQhGk2XWdbCJf+v7VuRr+rJFIVXDAusmqF0KG5MKcrJh8DO6vtg3mXOucJ2JPVz";
const ID = "FreeboxDL";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: ID,
    title: "Direct to Freebox",
    contexts: ["link"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    console.log("go debrid!");
    if (info.menuItemId === ID) {
        const originalLink = info.linkUrl;

        try {
            if (originalLink.includes("debrid.link")) {
                await sendToFreebox(originalLink);
            } else {
                const debridUrl = await sendToDebrid(originalLink);
                console.log("Lien débridé :", debridUrl);
                await sendToFreebox(debridUrl);
            }
            console.log(`Lien envoyé à la Freebox !`);
            notify("✅ Succès", `Lien envoyé à la Freebox !\n${originalLink}`);
        } catch (err) {
            console.error("Erreur dans le flux :", err);
            notify("❌ Erreur", err.message || "Échec inattendu.");
        }
    } else {
        console.log("wrong menu item id", info.menuItemId);
    }
});

async function sendToDebrid(link) {
    console.log("sending link ", link);
    const res = await fetch(DEBRID_API_DL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": DEBRID_KEY
        },
        body: JSON.stringify({ url: link })
    });

    console.log("got ", res);
    const data = await res.json();
    console.log("parsed", data);
    if (!data.success) {
        throw new Error(data.error);
    }

    const downloadUrl = data.value?.downloadUrl;
    if (!downloadUrl) {
        throw new Error("Lien de téléchargement invalide");
    }

    return downloadUrl;
}

async function sendToFreebox(link) {
    // await getFreeboxAppToken(); // uncomment to get new app token
    const session_token = await getFreeboxSessionToken();

    console.log("sending ", link, "to freebox");
    const res = await fetch(`${FREEBOX_API_BASE}/downloads/add`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Fbx-App-Auth": session_token
        },
        body: `download_url=${link}`
    });

    console.log(res);
    const data = await res.json();
    console.log(data);
    if (!data.success) {
        throw new Error("Erreur Freebox: " + JSON.stringify(data.msg));
    }
}

async function getFreeboxSessionToken() {
  const challenge = await getFreeboxChallenge();
  const password = await sha1Hmac(challenge, APP_TOKEN);

  const res = await fetch(`${FREEBOX_API_BASE}/login/session/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: appInfo.app_id,
      password: password
    })
  });

  const data = await res.json();
  console.log("get session token :", data);
  if (!data.success) throw new Error("Échec de l'authentification Freebox");
  return data.result.session_token;
}

async function getFreeboxChallenge() {
  const res = await fetch(`${FREEBOX_API_BASE}/login/`);
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

async function getFreeboxAppToken() {
    const res = await fetch(`${FREEBOX_API_BASE}/login/authorize/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appInfo)
    });

    const data = await res.json();
    console.log(data.result.app_token);
    console.log(data.result.track_id);
}

function notify(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title: title,
    message: message,
    priority: 1
  }, function(notificationId) {
    setTimeout(() => {
      chrome.notifications.clear(notificationId);
    }, 3000);
  });
}