(function () {
  const ENABLED_KEY = "cipherapp-local-history-enabled";
  const ENTRIES_KEY = "cipherapp-local-history";
  const MAX_ENTRIES = 50;

  function reportError(message) {
    let toast = document.getElementById("historyToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "historyToast";
      toast.className = "history-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.append(toast);
    }
    toast.textContent = message;
    toast.hidden = false;
  }

  function storageError(action, error) {
    const detail = error instanceof Error ? ` ${error.message}` : "";
    reportError(`Local history ${action} failed.${detail}`);
  }

  function isEnabled() {
    try {
      return localStorage.getItem(ENABLED_KEY) === "true";
    } catch (error) {
      storageError("settings could not be read", error);
      return false;
    }
  }

  function readEntries() {
    let stored;
    try {
      stored = localStorage.getItem(ENTRIES_KEY);
    } catch (error) {
      throw new Error(`History could not be read: ${error.message}`);
    }
    if (!stored) return [];
    try {
      const entries = JSON.parse(stored);
      if (!Array.isArray(entries)) throw new Error("Stored history is not a list.");
      return entries;
    } catch (error) {
      throw new Error(`History data is invalid: ${error.message}`);
    }
  }

  function writeEntries(entries) {
    try {
      localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
    } catch (error) {
      throw new Error(`History could not be saved: ${error.message}`);
    }
  }

  function setEnabled(enabled) {
    try {
      localStorage.setItem(ENABLED_KEY, String(enabled));
      renderEntries();
      return true;
    } catch (error) {
      storageError("setting could not be saved", error);
      return false;
    }
  }

  function record(entry) {
    if (!isEnabled()) return false;
    try {
      const entries = readEntries();
      entries.unshift({
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        createdAt: new Date().toISOString(),
      });
      writeEntries(entries.slice(0, MAX_ENTRIES));
      return true;
    } catch (error) {
      reportError(error.message);
      return false;
    }
  }

  function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString();
  }

  function addRecordField(container, label, value) {
    if (value === undefined || value === null || value === "") return;
    const heading = document.createElement("strong");
    const text = document.createElement("pre");
    heading.textContent = label;
    text.textContent =
      typeof value === "string" ? value : JSON.stringify(value, null, 2);
    container.append(heading, text);
  }

  function renderEntries() {
    const enabled = isEnabled();
    const toggle = document.getElementById("historyEnabled");
    const state = document.getElementById("historyState");
    const list = document.getElementById("historyEntries");
    const clearButton = document.getElementById("clearHistory");
    if (!toggle || !state || !list || !clearButton) return;

    toggle.checked = enabled;
    state.textContent = enabled
      ? "History is on. New successful tool runs are saved on this device."
      : "History is off. Existing entries remain until you clear them.";

    try {
      const entries = readEntries();
      list.replaceChildren();
      clearButton.disabled = entries.length === 0;
      if (entries.length === 0) {
        const empty = document.createElement("p");
        empty.className = "history-empty";
        empty.textContent = "No local history yet.";
        list.append(empty);
        return;
      }

      for (const entry of entries) {
        const details = document.createElement("details");
        const summary = document.createElement("summary");
        const content = document.createElement("div");
        const actions = document.createElement("div");
        const removeButton = document.createElement("button");
        details.className = "history-entry";
        summary.textContent = `${entry.tool} · ${entry.action} · ${formatDate(entry.createdAt)}`;
        content.className = "history-entry-content";
        addRecordField(content, "Input", entry.input);
        addRecordField(content, "Result", entry.output);
        addRecordField(content, "Settings", entry.settings);
        actions.className = "history-entry-actions";
        removeButton.className = "link-btn";
        removeButton.type = "button";
        removeButton.textContent = "Delete entry";
        removeButton.addEventListener("click", () => {
          try {
            writeEntries(readEntries().filter((item) => item.id !== entry.id));
            renderEntries();
          } catch (error) {
            setDialogStatus(error.message);
          }
        });
        actions.append(removeButton);
        details.append(summary, content, actions);
        list.append(details);
      }
    } catch (error) {
      list.replaceChildren();
      const message = document.createElement("p");
      message.className = "history-error";
      message.textContent = error.message;
      list.append(message);
      clearButton.disabled = true;
    }
  }

  function setDialogStatus(message) {
    const status = document.getElementById("historyDialogStatus");
    if (status) status.textContent = message;
  }

  function createDialog() {
    const dialog = document.createElement("dialog");
    dialog.className = "history-dialog";
    dialog.id = "localHistoryDialog";
    dialog.setAttribute("aria-labelledby", "historyTitle");
    dialog.innerHTML = `
      <div class="history-dialog-header">
        <div>
          <div class="workspace-kicker">Private to this browser</div>
          <h2 id="historyTitle">Local history</h2>
        </div>
        <button class="link-btn" type="button" data-history-close>Close</button>
      </div>
      <p class="history-disclosure">
        When enabled, up to 50 successful tool runs are stored in this browser.
        Entries can include your inputs and results. History is not encrypted or
        synced. Cipher keys and passphrases, and file contents, are never saved.
      </p>
      <label class="history-toggle">
        <input id="historyEnabled" type="checkbox" />
        <span>Save local history</span>
      </label>
      <p id="historyState" class="history-state"></p>
      <div class="history-actions">
        <button class="link-btn" id="clearHistory" type="button">Clear all history</button>
      </div>
      <p class="history-dialog-status" id="historyDialogStatus" role="status" aria-live="polite"></p>
      <div class="history-list" id="historyEntries"></div>
    `;
    document.body.append(dialog);
    dialog.querySelector("[data-history-close]").addEventListener("click", () => {
      dialog.close();
    });
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.querySelector("#historyEnabled").addEventListener("change", (event) => {
      setDialogStatus("");
      if (!setEnabled(event.target.checked)) {
        event.target.checked = isEnabled();
      } else {
        setDialogStatus(
          event.target.checked
            ? "Local history enabled."
            : "Local history disabled. Existing entries were kept.",
        );
      }
    });
    dialog.querySelector("#clearHistory").addEventListener("click", () => {
      try {
        writeEntries([]);
        setDialogStatus("All local history was cleared.");
        renderEntries();
      } catch (error) {
        setDialogStatus(error.message);
      }
    });
    return dialog;
  }

  function mount() {
    const host = document.querySelector(".tips-overlay");
    const nav = document.querySelector(".tool-nav");
    if (host && nav && !nav.contains(host)) nav.append(host);
    const mountPoint = host || document.querySelector(".topbar");
    if (!mountPoint) return;

    const trigger = document.createElement("button");
    trigger.className = "link-btn history-open";
    trigger.type = "button";
    const icon = document.createElement("i");
    icon.className = "fa-solid fa-clock-rotate-left";
    icon.setAttribute("aria-hidden", "true");
    trigger.append(icon);
    trigger.setAttribute("aria-label", "Open local history");
    trigger.title = "Open local history";
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-controls", "localHistoryDialog");
    const dialog = createDialog();
    if (mountPoint.classList.contains("topbar")) {
      mountPoint.insertBefore(trigger, mountPoint.querySelector("[data-theme-toggle]"));
    } else {
      mountPoint.append(trigger);
    }
    trigger.addEventListener("click", () => {
      setDialogStatus("");
      renderEntries();
      dialog.showModal();
    });
    renderEntries();
  }

  window.CipherAppHistory = { record };
  document.addEventListener("DOMContentLoaded", mount);
})();
