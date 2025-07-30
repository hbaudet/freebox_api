import { notify } from "../utils.js";
import { getFreeboxAppToken } from "../freebox.js";

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(["debridLinkKey", "freeboxToken", "freeboxUrl", "freeboxPort"], (items) => {
    document.getElementById("debridLinkKey").value = items.debridLinkKey || "";
    document.getElementById("freeboxToken").value = items.freeboxToken || "";
    document.getElementById("freeboxUrl").value = items.freeboxUrl || "";
    document.getElementById("freeboxPort").value = items.freeboxPort || "";
  });
});

document.getElementById("save").addEventListener("click", () => {
    save();
});

document.getElementById("getTokenBtn").addEventListener("click", async () => {
    const token = await getFreeboxAppToken(document.getElementById("freeboxLocalUrl").value, 80);

    const statusDiv = document.getElementById("status");
    statusDiv.style.display = "block";
    document.getElementById("token").textContent = token.value;
    document.getElementById("id").textContent = token.id;
});

document.getElementById("statusBtn").addEventListener("click", () => {
    chrome.tabs.create({
        url: document.getElementById("freeboxLocalUrl").value
                + "/api/v1/login/authorize/"
                + document.getElementById("id").textContent
    });
});

document.getElementById("storeToken").addEventListener("click", () => {
    document.getElementById("freeboxToken").value = document.getElementById("token").textContent || "";
    save();
});

function save() {
    const debridLinkKey = document.getElementById("debridLinkKey").value;
    const freeboxToken = document.getElementById("freeboxToken").value;
    const freeboxUrl = document.getElementById("freeboxUrl").value;
    const freeboxPort = document.getElementById("freeboxPort").value;

    chrome.storage.sync.set({ debridLinkKey, freeboxToken, freeboxUrl, freeboxPort }, () => {
        notify("Saved", "Settings stored on Chrome account storage");
    });
}
