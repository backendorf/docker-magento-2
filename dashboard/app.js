/* Custom JS for MagEnv Dashboard */
document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize variables from config.js or defaults
  const prefix = typeof STORE_PREFIX !== "undefined" ? STORE_PREFIX : "magenv";
  const phpVer = typeof PHP_VERSION !== "undefined" ? PHP_VERSION : "—";
  const phpMem = typeof PHP_MEMORY_LIMIT !== "undefined" ? PHP_MEMORY_LIMIT : "—";
  const xdebugVer = typeof XDEBUG_VERSION !== "undefined" ? XDEBUG_VERSION : "—";
  const mysqlVer = typeof MYSQL_VERSION !== "undefined" ? MYSQL_VERSION : "—";
  const adminUser = typeof ADMIN_USER !== "undefined" ? ADMIN_USER : "admin";
  const adminPass = typeof ADMIN_PASSWORD !== "undefined" ? ADMIN_PASSWORD : "—";
  const adminFront = typeof ADMIN_FRONTNAME !== "undefined" ? ADMIN_FRONTNAME : "admin";
  const dbName = typeof MYSQL_DATABASE !== "undefined" ? MYSQL_DATABASE : "—";
  const dbUser = typeof MYSQL_USER !== "undefined" ? MYSQL_USER : "—";
  const dbPass = typeof MYSQL_PASSWORD !== "undefined" ? MYSQL_PASSWORD : "—";
  const baseUrl = typeof MAGENTO_BASE_URL !== "undefined" ? MAGENTO_BASE_URL : `http://${prefix}.localhost/`;

  // Apply store prefix to status text placeholder in header
  const titleEl = document.getElementById("title");
  if (titleEl) titleEl.textContent = prefix;

  // 2. Theme System
  const getTheme = () => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  const updateThemeUI = (theme) => {
    const icon = document.getElementById("theme-icon");
    if (!icon) return;
    if (theme === "dark") {
      icon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="none" stroke="currentColor" stroke-width="2"/>`;
    } else {
      icon.innerHTML = `<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" fill="none" stroke="currentColor" stroke-width="2"/>`;
    }
  };

  // Set initial theme
  const initialTheme = getTheme();
  if (initialTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  updateThemeUI(initialTheme);

  // Toggle theme click handler
  window.toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    const currentTheme = isDark ? "dark" : "light";
    localStorage.setItem("theme", currentTheme);
    updateThemeUI(currentTheme);
    updateAllStatuses();
  };

  // 3. Toast Notifications
  window.showToast = (message) => {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
      <svg class="toast-success-icon" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add("active"), 10);
    
    // Animate out and remove
    setTimeout(() => {
      toast.classList.remove("active");
      setTimeout(() => toast.remove(), 250);
    }, 2000);
  };

  // 4. Copy to Clipboard Utility
  window.copyText = (btn, text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`Copied: ${label}`);

      const isCmdBtn = btn.classList.contains("btn-copy-text");
      const originalHTML = btn.innerHTML;

      if (isCmdBtn) {
        btn.innerHTML = `
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
          <span style="color: var(--color-success)">Copied</span>
        `;
        btn.style.borderColor = "var(--color-success)";
      } else {
        btn.innerHTML = `
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        `;
      }

      setTimeout(() => {
        btn.innerHTML = originalHTML;
        if (isCmdBtn) {
          btn.style.borderColor = "";
        }
      }, 1200);
    });
  };

  // 5. Template Helpers
  const createRow = (label, value, copyValue = null) => {
    const rawCopy = copyValue !== null ? copyValue : value;
    const copyButton = copyValue !== false ? `
      <button onclick="copyText(this, '${rawCopy.replace(/'/g, "\\'")}', '${label}')" 
              class="btn-copy" 
              title="Copy to clipboard">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
      </button>
    ` : "";
    return `
      <div class="modal-row">
        <span class="modal-row-label">${label}</span>
        <div class="modal-row-value">
          <span>${value}</span>
          ${copyButton}
        </div>
      </div>
    `;
  };

  const createTab = (title, rows) => ({ title, content: rows.join("") });

  const renderModalTabs = (tabs, footerHtml = "") => {
    const id = "tabs-" + Math.random().toString(36).slice(2, 9);
    const buttons = tabs.map((t, i) => `
      <button class="modal-tab-btn ${i === 0 ? "active" : ""}" 
              onclick="switchModalTab('${id}', ${i}, this)">
        ${t.title}
      </button>
    `).join("");

    const panels = tabs.map((t, i) => `
      <div class="modal-tab-panel ${i === 0 ? "active" : ""}" data-panel="${id}-${i}">
        ${t.content}
      </div>
    `).join("");

    return `
      <div class="tabs-container" id="${id}">
        <div class="modal-tab-container">${buttons}</div>
        ${panels}
        ${footerHtml}
      </div>
    `;
  };

  const codeSpan = (text) => `<code>${text}</code>`;
  const pillItem = (text) => `<span class="pill-item">${text}</span>`;

  // 6. Services Setup and Card Rendering
  const services = [
    {
      label: "Magento / PHP", title: "Magento", subtitle2: `PHP ${phpVer}`,
      accent: "var(--color-accent)",
      url: baseUrl,
      subtitle: `${prefix}.localhost`,
      logo: `
        <div style="display: flex; align-items: center; gap: 6px;">
          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/magento/magento-original.svg" style="width: 22px; height: 22px;" />
          <span style="color: var(--text-tertiary); font-size: 0.9rem; font-weight: 300;">/</span>
          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg" style="width: 22px; height: 22px;" />
        </div>
      `,
      modal: () => renderModalTabs([
        createTab("URLs", [
          createRow("Store", `<a href="${baseUrl}" target="_blank">${baseUrl}</a>`, baseUrl),
          createRow("Admin", `<a href="${baseUrl}${adminFront}" target="_blank">${baseUrl}${adminFront}</a>`, `${baseUrl}${adminFront}`),
        ]),
        createTab("Credentials", [
          createRow("User", adminUser),
          createRow("Password", adminPass),
        ]),
        createTab("PHP", [
          createRow("PHP", phpVer),
          createRow("memory_limit", phpMem),
          createRow("Xdebug", xdebugVer),
          createRow("Xdebug mode", "off by default"),
        ]),
        createTab("Extensions", [
          `<div class="pill-group">${["pdo_mysql", "gd", "bcmath", "intl", "zip", "sockets", "xsl", "soap", "mysqli", "ftp", "pcntl"].map(pillItem).join("")}</div>`,
        ]),
        createTab("Xdebug", [
          createRow("Toggle Xdebug", `run ${codeSpan("x")} inside ${codeSpan("./magenv php")}`, false),
        ]),
      ], `
        <a href="${baseUrl}" target="_blank" class="btn-modal-action">
          <span>Open Magento</span>
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      `),
    },
    {
      label: "Database", title: "MySQL", subtitle2: "3306", accent: "var(--color-accent)",
      url: null,
      logo: `<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg" style="width: 24px; height: 24px;" />`,
      modal: () => renderModalTabs([
        createTab("Connection", [
          createRow("Host (local)", "localhost"),
          createRow("Host (docker)", "db"),
          createRow("Port", "3306"),
          createRow("Database", dbName),
          createRow("User", dbUser),
          createRow("Password", dbPass),
        ]),
        createTab("Commands", [
          createRow("MySQL shell", "./magenv db"),
          createRow("Import dump", "./magenv import-db"),
          createRow("Dump path", "dumps/import.sql"),
        ]),
      ]),
    },
    {
      label: "Web Server", title: "Nginx", subtitle2: "80", accent: "var(--color-accent)",
      url: null,
      logo: `<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nginx/nginx-original.svg" style="width: 24px; height: 24px;" />`,
      modal: () => renderModalTabs([
        createTab("Hosts", [
          createRow("Dashboard", "localhost"),
          createRow("Store", `${prefix}.localhost`),
          createRow("Mailpit", "mailpit.localhost"),
        ]),
        createTab("Ports", [
          createRow("HTTP", "80"),
        ]),
        createTab("Config", [
          createRow("Nginx Conf", "docker/nginx.default.conf"),
          createRow("Magento Conf", "docker/nginx-magento/"),
        ]),
      ]),
    },
    {
      label: "Search", title: "OpenSearch", subtitle2: "9200", accent: "var(--color-accent)",
      url: "http://localhost:9200",
      subtitle: "localhost:9200",
      logo: `
        <svg width="24" height="24" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#005EB8" opacity="0.15"/>
          <path d="M16 32a16 16 0 0 1 26.5-12.1" stroke="#005EB8" stroke-width="4" stroke-linecap="round" fill="none"/>
          <path d="M48 32a16 16 0 0 1-26.5 12.1" stroke="#57c5f7" stroke-width="4" stroke-linecap="round" fill="none"/>
          <circle cx="44" cy="44" r="5" fill="#005EB8"/>
          <line x1="47.5" y1="47.5" x2="53" y2="53" stroke="#005EB8" stroke-width="3.5" stroke-linecap="round"/>
        </svg>
      `,
      modal: () => renderModalTabs([
        createTab("Connection", [
          createRow("API URL", `<a href="http://localhost:9200" target="_blank">localhost:9200</a>`, "http://localhost:9200"),
          createRow("Port", "9200"),
          createRow("Security", "disabled"),
        ]),
        createTab("Settings", [
          createRow("Java heap", "512m – 512m"),
          createRow("Index prefix", prefix),
        ]),
      ], `
        <a href="http://localhost:9200" target="_blank" class="btn-modal-action">
          <span>Open OpenSearch</span>
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      `),
    },
    {
      label: "Email", title: "Mailpit", subtitle2: "mailpit.localhost", accent: "var(--color-accent)",
      url: "http://mailpit.localhost",
      subtitle: "mailpit.localhost",
      logo: `
        <svg width="24" height="24" viewBox="0 0 64 64" fill="none">
          <rect x="6" y="14" width="52" height="36" rx="5" fill="#6366f1" opacity="0.15" stroke="#6366f1" stroke-width="3"/>
          <polyline points="6,14 32,36 58,14" stroke="#6366f1" stroke-width="3" stroke-linejoin="round" fill="none"/>
        </svg>
      `,
      modal: () => renderModalTabs([
        createTab("Access", [
          createRow("Web UI", `<a href="http://mailpit.localhost" target="_blank">mailpit.localhost</a>`, "http://mailpit.localhost"),
          createRow("Web Port", "8025"),
          createRow("SMTP Port", "1025"),
          createRow("SMTP Host", "mailpit"),
        ]),
        createTab("Settings", [
          createRow("Max messages", "5000"),
          createRow("Auth", "any credentials accepted"),
        ]),
      ], `
        <a href="http://mailpit.localhost" target="_blank" class="btn-modal-action">
          <span>Open Mailpit</span>
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      `),
    },
  ];

  // Render services cards in DOM
  const cardsContainer = document.getElementById("cards");
  if (cardsContainer) {
    cardsContainer.innerHTML = "";
    services.forEach((s, index) => {
      const card = document.createElement("div");
      card.className = "service-card";
      card.id = `card-container-${index}`;
      card.style.setProperty("--card-accent", s.accent);
      card.onclick = () => openServiceModal(index);
      
      const footerHtml = s.url ? `
        <div class="card-footer" style="padding-top: 0; border-top: none;">
          <a href="${s.url}" target="_blank" onclick="event.stopPropagation()" class="btn-open-link full-width">
            <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Open ${s.title}</span>
          </a>
        </div>
      ` : "";

      card.innerHTML = `
        <div class="card-header">
          <div class="card-icon-wrapper">
            ${s.logo}
          </div>
          <span id="card-status-dot-${index}" class="status-dot"></span>
        </div>
        <div class="card-body" style="margin-bottom: 16px;">
          <h3 class="card-title">${s.title}</h3>
        </div>
        ${footerHtml}
      `;
      cardsContainer.appendChild(card);
    });
  }

  // 7. Modal Logic
  const openModal = (headerHtml, bodyHtml) => {
    const modal = document.getElementById("modal");
    const wrapper = document.getElementById("modal-box");
    const header = document.getElementById("modal-header");
    const body = document.getElementById("modal-body");

    if (!modal || !wrapper || !header || !body) return;

    header.innerHTML = headerHtml;
    body.innerHTML = bodyHtml;

    modal.classList.add("active");
    document.addEventListener("keydown", handleEscapeKey);
  };

  window.closeModal = () => {
    const modal = document.getElementById("modal");
    if (modal) modal.classList.remove("active");
    document.removeEventListener("keydown", handleEscapeKey);
  };

  const handleEscapeKey = (e) => {
    if (e.key === "Escape") closeModal();
  };

  const openServiceModal = (index) => {
    const s = services[index];
    const headerHtml = `
      <div class="card-icon-wrapper shrink-0">${s.logo}</div>
      <div style="text-align: left">
        <span class="card-label block">${s.label}</span>
        <h2 class="step-title mt-0.5">${s.title} Settings</h2>
      </div>
    `;
    const bodyHtml = s.modal();
    openModal(headerHtml, bodyHtml);
  };

  // Modal Inside Tab Switcher
  window.switchModalTab = (containerId, index, btn) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Toggle buttons
    container.querySelectorAll(".modal-tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    // Toggle panels
    container.querySelectorAll(".modal-tab-panel").forEach((p, idx) => {
      p.classList.toggle("active", idx === index);
    });
  };

  // 8. Main Tab Bar Switching Logic
  window.switchMainTab = (tabId) => {
    document.querySelectorAll(".tab-content-panel").forEach((p) => p.classList.remove("active"));
    document.querySelectorAll(".tab-nav-btn").forEach((b) => b.classList.remove("active"));
    
    const activePanel = document.getElementById(tabId);
    const activeButton = document.getElementById("btn-" + tabId);
    
    if (activePanel) activePanel.classList.add("active");
    if (activeButton) activeButton.classList.add("active");
  };

  // 9. Quick Commands Rendering
  const howToCommands = [
    ["./magenv install", "Full Magento installation (interactive)", true],
    ["./magenv up", "Start containers & open browser"],
    ["./magenv stop", "Stop containers (data preserved)"],
    ["./magenv down", "Remove containers (volumes preserved)"],
    ["./magenv php", "Shell into the PHP container"],
    ["./magenv db", "MySQL CLI inside DB container"],
    ["./magenv import-db", "Import dumps/import.sql"],
  ];

  const commandsList = document.getElementById("howto");
  if (commandsList) {
    commandsList.innerHTML = howToCommands.map(([cmd, desc, isHigh]) => `
      <div class="command-row">
        <code class="command-string ${isHigh ? "highlight" : ""}">${cmd}</code>
        <span class="command-desc">${desc}</span>
        <button onclick="copyText(this, '${cmd.replace(/'/g, "\\'")}', 'Command')" class="btn-copy" title="Copy command">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
        </button>
      </div>
    `).join("");
  }

  // 10. Guided Installation Rendering
  const installationSteps = [
    {
      step: "01",
      title: "Store prefix",
      desc: "Sets the store URL and database name. E.g. <code>mystore</code> &rarr; <code>mystore.localhost</code>.",
      accent: "#f46f25",
      icon: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"/></svg>`,
    },
    {
      step: "02",
      title: "Distribution",
      desc: "Choose between the official Adobe/Magento repository or Mage-OS community fork.",
      accent: "#e74c3c",
      options: ["Magento (official)", "Mage-OS"],
      icon: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m20.893 13.393-1.135-1.135a2.252 2.252 0 0 1-.421-.585l-1.08-2.16a.414.414 0 0 0-.663-.107.827.827 0 0 1-.812.21l-1.273-.363a.89.89 0 0 0-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 0 1-1.81 1.025 1.055 1.055 0 0 1-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 0 1-1.383-2.46l.007-.042a2.25 2.25 0 0 1 .29-.787l.09-.15a2.25 2.25 0 0 1 2.37-1.048l1.178.236a1.125 1.125 0 0 0 1.302-.795l.208-.73a1.125 1.125 0 0 0-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 0 1-1.591.659h-.18c-.249 0-.487.1-.662.274a.931.931 0 0 1-1.458-1.137l1.411-2.353a2.25 2.25 0 0 0 .286-.76m11.928 9.869A9 9 0 0 0 8.965 3.525m11.928 9.868A9 9 0 1 1 8.965 3.525"/></svg>`,
    },
    {
      step: "03",
      title: "Version",
      desc: "Pin a specific release (e.g. <code>2.4.7</code>) or leave blank to automatically get the latest stable.",
      accent: "#8e44ad",
      icon: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z"/></svg>`,
    },
    {
      step: "04",
      title: "Theme",
      desc: "Start with Hyvä (fast, modern, React-free) or fall back to classic Luma theme.",
      accent: "#16a34a",
      options: ["Hyvä (default)", "Luma"],
      icon: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42"/></svg>`,
    },
    {
      step: "05",
      title: "Sample data",
      desc: "Optionally install Magento's demo catalog to test pages out of the box.",
      accent: "#0891b2",
      options: ["Yes", "No (default)"],
      icon: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"/></svg>`,
    },
  ];

  const installContainer = document.getElementById("install-options");
  if (installContainer) {
    installContainer.innerHTML = installationSteps.map(({ step, title, desc, accent, options, icon }) => {
      const badges = options
        ? `<div class="step-right-badges"><div class="step-badges-container">${options.map(o => `<span class="step-badge">${o}</span>`).join("")}</div></div>`
        : `<div class="step-right-badges"></div>`;
      return `
        <div class="install-step-card">
          <div class="step-left-info">
            <div class="step-icon-wrapper" style="color: ${accent}">
              ${icon}
            </div>
            <div class="step-title-group">
              <span class="step-number">Step ${step}</span>
              <h4 class="step-title">${title}</h4>
            </div>
          </div>
          <p class="step-desc">${desc}</p>
          ${badges}
        </div>
      `;
    }).join("");
  }

  // 11. FAQ Accordion Rendering
  const faqData = [
    {
      q: "Do I need to edit /etc/hosts?",
      a: "No. <code>.localhost</code> resolves to <code>127.0.0.1</code> automatically in all modern browsers &mdash; no host file changes needed.",
    },
    {
      q: "Can I run multiple stores at the same time?",
      a: "Each magenv instance is one store. Clone the repository into a separate folder for each project &mdash; ports don't conflict because each instance runs isolated.",
    },
    {
      q: "How do I change the PHP version?",
      a: "Edit <code>PHP_VERSION</code> in <code>.env</code> (e.g. <code>8.3-fpm</code>), then run <code>./magenv down && ./magenv up</code> to rebuild the PHP container.",
    },
    {
      q: "How do I enable Xdebug?",
      a: "Shell into the PHP container with <code>./magenv php</code> and run <code>x</code>. It toggles between <code>debug</code> and <code>off</code>. Xdebug is off by default to keep performance fast.",
    },
    {
      q: "How do I import a database dump?",
      a: "Place the file at <code>dumps/import.sql</code> and run <code>./magenv import-db</code>. The script imports it directly into the database defined in <code>.env</code>.",
    },
    {
      q: "Where do outgoing emails go?",
      a: "All email is captured by Mailpit. No mail leaves your machine. Access the inbox at <a href='http://mailpit.localhost' target='_blank' style='font-weight: 600;'>mailpit.localhost</a> &mdash; any credentials work.",
    },
    {
      q: "Is 2FA enabled on the admin?",
      a: "No. Two-Factor Authentication (<code>Magento_TwoFactorAuth</code>) is disabled automatically during install so you can log in directly with user and password.",
    },
    {
      q: "What happens to my data when I run ./magenv down?",
      a: "Containers are removed but Docker volumes are preserved, so your database and files survive. Use <code>./magenv up</code> to bring everything back.",
    },
  ];

  const faqContainer = document.getElementById("faq");
  if (faqContainer) {
    faqContainer.innerHTML = faqData.map(({ q, a }, index) => {
      const id = `faq-${index}`;
      return `
        <div class="faq-item" id="${id}-wrapper">
          <button onclick="toggleFaq('${id}')" class="faq-btn">
            <span class="faq-question">${q}</span>
            <svg id="${id}-icon" class="faq-icon" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          <div id="${id}" class="faq-answer-container">
            <div class="faq-answer">${a}</div>
          </div>
        </div>
      `;
    }).join("");
  }

  window.toggleFaq = (id) => {
    const wrapper = document.getElementById(id + "-wrapper");
    if (!wrapper) return;
    
    const isOpen = wrapper.classList.contains("open");
    
    // Close other FAQ items for a cleaner accordion effect (optional, let's just toggle)
    wrapper.classList.toggle("open", !isOpen);
  };

  // 12. Dynamic Status Checks
  const checkService = async (url) => {
    if (!url) return true;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
      await fetch(url, { mode: "no-cors", signal: controller.signal });
      clearTimeout(timeout);
      return true;
    } catch (err) {
      return false; // Connection failed
    }
  };

  const updateHeaderStatus = (isOnline) => {
    const dot = document.getElementById("header-status-dot");
    const label = document.getElementById("header-status-label");
    if (!dot) return;

    if (isOnline) {
      dot.className = "status-dot active";
      if (label) label.textContent = "Online";
      if (titleEl) titleEl.textContent = prefix;
    } else {
      dot.className = "status-dot offline";
      if (label) label.textContent = "Offline";
      if (titleEl) titleEl.textContent = `${prefix} (OFFLINE)`;
    }
  };

  const updateCardStatus = (index, isOnline) => {
    const dot = document.getElementById(`card-status-dot-${index}`);
    if (!dot) return;
    
    if (isOnline) {
      dot.style.backgroundColor = "var(--color-success)";
      dot.style.boxShadow = "0 0 6px var(--color-success)";
    } else {
      dot.style.backgroundColor = "var(--color-error)";
      dot.style.boxShadow = "none";
    }
  };

  const updateAllStatuses = async () => {
    // 1. Magento status
    const magentoOnline = await checkService(baseUrl);
    updateHeaderStatus(magentoOnline);
    updateCardStatus(0, magentoOnline);

    // 2. MySQL (Assumed online if Magento is online)
    updateCardStatus(1, magentoOnline);

    // 3. Nginx
    const nginxOnline = await checkService("/");
    updateCardStatus(2, nginxOnline);

    // 4. OpenSearch
    const opensearchOnline = await checkService("http://localhost:9200/");
    updateCardStatus(3, opensearchOnline);

    // 5. Mailpit
    const mailpitOnline = await checkService("http://mailpit.localhost/");
    updateCardStatus(4, mailpitOnline);
  };

  // Initial execution and recurring checks
  updateAllStatuses();
  setInterval(updateAllStatuses, 5000);
});
