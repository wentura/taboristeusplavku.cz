(() => {
  const id = document.querySelector('meta[name="ga4-measurement-id"]')?.content.trim();
  if (!/^G-[A-Z0-9]+$/.test(id || "")) return;

  const key = "kamil_ga4_analytics_consent_v1";
  const footer = document.querySelector("footer") || document.body;
  const settings = document.createElement("button");
  settings.type = "button";
  settings.className = "analytics-settings";
  settings.textContent = "Nastavení cookies";
  settings.addEventListener("click", showBanner);
  footer.appendChild(settings);

  let choice;
  try {
    choice = localStorage.getItem(key);
  } catch {
    choice = null;
  }

  function start() {
    if (window.__kamilGa4Started) return;
    window.__kamilGa4Started = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    window.gtag("consent", "update", { analytics_storage: "granted" });
    window.gtag("js", new Date());
    window.gtag("config", id, { send_page_view: false });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
    window.gtag("event", "page_view", {
      page_location: location.href,
      page_title: document.title,
      page_referrer: document.referrer,
      send_to: id,
    });
  }

  function removeAnalyticsCookies() {
    for (const item of document.cookie.split(";")) {
      const name = item.trim().split("=")[0];
      if (!/^_ga(?:_|$)/.test(name)) continue;
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${location.hostname}; SameSite=Lax`;
    }
  }

  function choose(next) {
    const hadAnalytics = choice === "granted";
    choice = next;
    try { localStorage.setItem(key, next); } catch { /* Storage may be unavailable. */ }
    document.querySelector(".analytics-banner")?.remove();
    settings.hidden = false;
    if (next === "granted") start();
    if (next === "denied" && hadAnalytics) {
      removeAnalyticsCookies();
      location.reload();
    }
  }

  function showBanner() {
    if (document.querySelector(".analytics-banner")) return;
    settings.hidden = true;
    const panel = document.createElement("section");
    panel.className = "analytics-banner";
    panel.setAttribute("aria-label", "Nastavení analytických cookies");
    const message = document.createElement("p");
    message.textContent = "Pomozte nám zjistit, jak lidé web používají. Google Analytics spustíme jen s vaším souhlasem.";
    panel.appendChild(message);
    const buttons = document.createElement("div");
    buttons.className = "analytics-actions";
    for (const [label, next, className] of [
      ["Odmítnout", "denied", "analytics-reject"],
      ["Přijmout analytiku", "granted", "analytics-accept"],
    ]) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = className;
      button.textContent = label;
      button.addEventListener("click", () => choose(next));
      buttons.appendChild(button);
    }
    if (choice !== null) {
      const close = document.createElement("button");
      close.type = "button";
      close.textContent = "Zavřít";
      close.addEventListener("click", () => {
        panel.remove();
        settings.hidden = false;
      });
      buttons.appendChild(close);
    }
    panel.appendChild(buttons);
    document.body.appendChild(panel);
  }

  document.addEventListener("click", (event) => {
    if (choice !== "granted" || !window.gtag) return;
    const link = event.target.closest("a[href]");
    if (!link) return;
    if (link.protocol === "tel:") window.gtag("event", "phone_click");
    if (link.protocol === "mailto:") window.gtag("event", "email_click");
  });

  window.addEventListener("storage", (event) => {
    if (event.key === key) location.reload();
  });

  if (choice === "granted") start();
  if (choice === null) showBanner();
})();
