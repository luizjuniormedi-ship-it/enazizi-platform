/* ENAZIZI WhatsApp Sender — Content Script (web.whatsapp.com) */

(function () {
  const MAX_WAIT_MS = 30000; // 30s max wait for send button
  const CHECK_INTERVAL = 500;

  // Only act if we have a pending send
  chrome.storage.local.get("pendingSend", (data) => {
    if (!data.pendingSend) return;
    waitForSendButton();
  });

  function waitForSendButton() {
    const start = Date.now();

    const interval = setInterval(() => {
      if (Date.now() - start > MAX_WAIT_MS) {
        clearInterval(interval);
        reportResult(false, "Timeout: botão de enviar não encontrado");
        return;
      }

      // WhatsApp Web uses data-icon="send" on the send button's span
      const sendIcon =
        document.querySelector('span[data-icon="send"]') ||
        document.querySelector('button[aria-label="Enviar"]') ||
        document.querySelector('button[aria-label="Send"]');

      if (sendIcon) {
        clearInterval(interval);
        const button = sendIcon.closest("button") || sendIcon;

        // Small delay to ensure message is fully loaded
        setTimeout(() => {
          try {
            button.click();
            // Wait a moment then report success
            setTimeout(() => reportResult(true), 2000);
          } catch (e) {
            reportResult(false, "Erro ao clicar: " + e.message);
          }
        }, 1000);
      }
    }, CHECK_INTERVAL);
  }

  function reportResult(success, error) {
    chrome.runtime.sendMessage({
      type: "WHATSAPP_SEND_RESULT",
      success,
      error: error || null,
    });
  }

  // Listen for messages from background (e.g. to relay to ENAZIZI page)
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    // Forward ENAZIZI messages to the page if we're on enazizi.com
    if (msg.type && msg.type.startsWith("ENAZIZI_")) {
      window.postMessage(msg, "*");
    }
  });
})();
