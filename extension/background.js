/* ENAZIZI WhatsApp Sender — Background Service Worker */

const BASE_URL = "https://enazizi.com";
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

// ─── Version check ───────────────────────────────────────────
async function checkForUpdate() {
  try {
    const resp = await fetch(`${BASE_URL}/extension-meta.json?_=${Date.now()}`);
    if (!resp.ok) return;
    const meta = await resp.json();
    const local = chrome.runtime.getManifest().version;
    const needsUpdate = compareVersions(meta.version, local) > 0;

    await chrome.storage.local.set({
      latestVersion: meta.version,
      downloadUrl: meta.download_url || "/enazizi-whatsapp-extension.zip",
      changelog: meta.changelog || "",
      needsUpdate,
    });

    if (needsUpdate) {
      chrome.action.setBadgeText({ text: "!" });
      chrome.action.setBadgeBackgroundColor({ color: "#EF4444" });
    } else {
      chrome.action.setBadgeText({ text: "" });
    }
  } catch (e) {
    console.warn("[ENAZIZI] Version check failed:", e.message);
  }
}

function compareVersions(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

// Check on install/startup and then every hour
chrome.runtime.onInstalled.addListener(() => checkForUpdate());
chrome.runtime.onStartup.addListener(() => checkForUpdate());
setInterval(checkForUpdate, CHECK_INTERVAL_MS);

// ─── Message queue management ────────────────────────────────
let messageQueue = [];
let isProcessing = false;
let currentIndex = 0;

chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  if (msg.type === "ENAZIZI_PING") {
    const ver = chrome.runtime.getManifest().version;
    sendResponse({ type: "ENAZIZI_PONG", version: ver });
    return true;
  }

  if (msg.type === "ENAZIZI_SEND_QUEUE") {
    messageQueue = msg.payload || [];
    currentIndex = 0;
    isProcessing = true;
    sendResponse({ type: "ENAZIZI_QUEUE_RECEIVED", count: messageQueue.length });
    processNext();
    return true;
  }

  if (msg.type === "ENAZIZI_CANCEL") {
    isProcessing = false;
    messageQueue = [];
    sendResponse({ type: "ENAZIZI_CANCELLED" });
    return true;
  }
});

// Also listen from content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "WHATSAPP_SEND_RESULT") {
    handleSendResult(msg);
    sendResponse({ ok: true });
    return true;
  }
});

async function processNext() {
  if (!isProcessing || currentIndex >= messageQueue.length) {
    isProcessing = false;
    broadcastToENAZIZI({ type: "ENAZIZI_QUEUE_DONE", sent: currentIndex });
    return;
  }

  const item = messageQueue[currentIndex];
  broadcastToENAZIZI({
    type: "ENAZIZI_SENDING",
    index: currentIndex,
    total: messageQueue.length,
    name: item.display_name || "Aluno",
  });

  // Build wa.me URL
  let phone = item.phone.replace(/\D/g, "");
  if (!phone.startsWith("55")) phone = "55" + phone;
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(item.message)}`;

  // Open tab
  const tab = await chrome.tabs.create({ url, active: false });
  // Store context so content script knows what to do
  await chrome.storage.local.set({
    pendingSend: {
      tabId: tab.id,
      userId: item.user_id,
      phone: item.phone,
      index: currentIndex,
    },
  });
}

function handleSendResult(msg) {
  const { success, error } = msg;

  broadcastToENAZIZI({
    type: "ENAZIZI_SEND_STATUS",
    index: currentIndex,
    userId: messageQueue[currentIndex]?.user_id,
    success,
    error: error || null,
  });

  // Close the WhatsApp tab
  chrome.storage.local.get("pendingSend", (data) => {
    if (data.pendingSend?.tabId) {
      chrome.tabs.remove(data.pendingSend.tabId).catch(() => {});
    }
    chrome.storage.local.remove("pendingSend");
  });

  currentIndex++;

  if (!isProcessing) return;

  // Random delay 8-15s before next
  const delaySec = Math.floor(Math.random() * 8) + 8;
  broadcastToENAZIZI({
    type: "ENAZIZI_COUNTDOWN",
    seconds: delaySec,
    nextIndex: currentIndex,
  });

  setTimeout(() => processNext(), delaySec * 1000);
}

// Broadcast to ENAZIZI tabs
async function broadcastToENAZIZI(msg) {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (
        tab.url &&
        (tab.url.includes("enazizi.com") ||
          tab.url.includes("lovable.app") ||
          tab.url.includes("localhost"))
      ) {
        chrome.tabs.sendMessage(tab.id, msg).catch(() => {});
      }
    }
  } catch (e) {
    // ignore
  }
}
