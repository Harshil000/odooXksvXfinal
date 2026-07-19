import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Beautiful, custom-themed alert popup override
window.alert = function(message) {
  const existingAlert = document.getElementById("custom-theme-alert");
  if (existingAlert) {
    existingAlert.remove();
  }

  const overlay = document.createElement("div");
  overlay.id = "custom-theme-alert";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.75)";
  overlay.style.backdropFilter = "blur(4px)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "999999";
  overlay.style.animation = "customAlertFadeIn 0.2s ease";

  const card = document.createElement("div");
  card.style.background = "#14141a";
  card.style.border = "1px solid #27272a";
  card.style.borderRadius = "12px";
  card.style.padding = "24px";
  card.style.width = "90%";
  card.style.maxWidth = "400px";
  card.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.5)";
  card.style.animation = "customAlertScaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)";
  card.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif";
  card.style.color = "#fff";

  const title = document.createElement("div");
  title.style.display = "flex";
  title.style.alignItems = "center";
  title.style.gap = "10px";
  title.style.marginBottom = "16px";

  const icon = document.createElement("div");
  icon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></svg>`;
  title.appendChild(icon);

  const titleText = document.createElement("strong");
  titleText.innerText = "Notification";
  titleText.style.fontSize = "16px";
  titleText.style.fontWeight = "600";
  titleText.style.color = "#a78bfa";
  title.appendChild(titleText);

  card.appendChild(title);

  const content = document.createElement("p");
  content.innerText = message;
  content.style.fontSize = "14px";
  content.style.lineHeight = "1.5";
  content.style.margin = "0 0 24px 0";
  content.style.color = "#d1d5db";
  card.appendChild(content);

  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.justifyContent = "flex-end";

  const btn = document.createElement("button");
  btn.innerText = "OK";
  btn.style.background = "#8b5cf6";
  btn.style.color = "#fff";
  btn.style.border = "none";
  btn.style.borderRadius = "6px";
  btn.style.padding = "8px 20px";
  btn.style.fontSize = "13px";
  btn.style.fontWeight = "600";
  btn.style.cursor = "pointer";
  btn.style.transition = "background-color 0.15s";
  btn.onmouseenter = () => btn.style.backgroundColor = "#7c3aed";
  btn.onmouseleave = () => btn.style.backgroundColor = "#8b5cf6";

  const closeAlert = () => {
    overlay.style.animation = "customAlertFadeOut 0.15s ease forwards";
    card.style.animation = "customAlertScaleDown 0.15s ease forwards";
    setTimeout(() => {
      overlay.remove();
    }, 150);
  };

  btn.onclick = closeAlert;
  actions.appendChild(btn);
  card.appendChild(actions);
  overlay.appendChild(card);

  overlay.onclick = (e) => {
    if (e.target === overlay) {
      closeAlert();
    }
  };

  if (!document.getElementById("custom-alert-styles")) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "custom-alert-styles";
    styleSheet.innerText = `
      @keyframes customAlertFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes customAlertFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      @keyframes customAlertScaleUp {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      @keyframes customAlertScaleDown {
        from { transform: scale(1); opacity: 1; }
        to { transform: scale(0.95); opacity: 0; }
      }
    `;
    document.head.appendChild(styleSheet);
  }

  document.body.appendChild(overlay);

  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === "Escape") {
      closeAlert();
      document.removeEventListener("keydown", handleKey);
    }
  };
  document.addEventListener("keydown", handleKey);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
