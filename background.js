import { sendToFreebox } from './freebox.js';
import { notify, getStoredKeys } from './utils.js';

const DEBRID_API_DL = "https://debrid-link.com/api/v2/downloader/add";
const ID = "FreeboxDL";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: ID,
    title: "Direct to Freebox",
    contexts: ["link"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    const {debridLinkKey} = await getStoredKeys(['debridLinkKey']);
    if (info.menuItemId === ID) {
        const originalLink = info.linkUrl;

        try {
            if (originalLink.includes("debrid.link")) {
                await sendToFreebox(originalLink);
            } else {
                const debridUrl = await sendToDebrid(originalLink, debridLinkKey);
                console.log("Lien débridé :", debridUrl);
                await sendToFreebox(debridUrl);
            }
            notify("✅ Lien envoyé à la Freebox !", `${originalLink}`);
        } catch (err) {
            console.error("Erreur dans le flux :", err);
            notify("❌ Erreur", err.message || "Échec inattendu.");
        }
    } else {
        console.log("wrong menu item id", info.menuItemId);
    }
});

async function sendToDebrid(link, key) {
    const res = await fetch(DEBRID_API_DL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + key
        },
        body: JSON.stringify({ url: link })
    });

    const data = await res.json();
    if (!data.success) {
        throw new Error(data.error);
    }

    const downloadUrl = data.value?.downloadUrl;
    if (!downloadUrl) {
        throw new Error("Lien de téléchargement invalide");
    }

    return downloadUrl;
}