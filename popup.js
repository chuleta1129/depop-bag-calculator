const $ = (id) => document.getElementById(id);

let items = [];
let lastScanUrl = "";
const money = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number.isFinite(n) ? n : 0,
  );
const numeric = (id) => {
  const n = Number.parseFloat($(id).value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

async function saveState() {
  try {
    await chrome.storage.local.set({ depopCalcState: { items, lastScanUrl } });
  } catch (_) {}
}
async function restoreState() {
  try {
    const saved = (await chrome.storage.local.get("depopCalcState"))
      .depopCalcState;
    if (!saved) return;
    if (Array.isArray(saved.items)) items = saved.items;

    lastScanUrl = saved.lastScanUrl || "";
  } catch (_) {}
  renderItems();
  calculate();
}
function renderItems() {
  const wrap = $("items");
  $("items-heading").textContent = `Your items (${items.length})`;
  $("rescan").textContent = items.length
    ? "Scan again"
    : "Scan bag";
  wrap.replaceChildren();
  if (!items.length) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "No items scanned yet.";
    wrap.append(p);
    return;
  }
  for (const item of items) {
    const row = document.createElement("div");
    row.className = "item";
    const name = document.createElement("div");
    name.className = "item-name";
    if (item.url) {
      const a = document.createElement("a");
      a.className = "link";
      a.href = item.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = item.name || "Depop item";
      name.append(a);
    } else name.textContent = item.name || "Depop item";
    const small = document.createElement("small");
    small.textContent = "Detected listing price";
    name.append(small);
    const price = document.createElement("div");
    price.className = "price";
    price.textContent = money(item.price);
    row.append(name, price);
    wrap.append(row);
  }
}
function calculate() {
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0),
    0,
  );
  // Apply the fee and tax formula to each item individually.
  const fees = items.reduce((sum, item) => {
    const price = Math.max(0, Number(item.price) || 0);
    return sum + price * 0.05 + 0.7;
  }, 0);
  const tax = items.reduce((sum, item) => {
    const price = Math.max(0, Number(item.price) || 0);
    const fee = price * 0.05 + 0.7;
    return sum + (price + fee) * 0.105;
  }, 0);
  const total = subtotal + fees + tax;
  $("subtotal").textContent = money(subtotal);
  $("fees-total").textContent = money(fees);
  $("tax-total").textContent = money(tax);
  $("grand-total").textContent = money(total);
  saveState();
}
async function scan() {
  const button = $("rescan");
  button.disabled = true;
  $("status").textContent = "Scanning visible items on the active Depop tab…";
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (
      !tab?.id ||
      !tab.url ||
      !/^https:\/\/(www\.)?depop\.com\//i.test(tab.url)
    ) {
      $("status").textContent =
        "Open your Depop bag in this tab, make sure the items are visible, then try again.";
      return;
    }
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const priceRe = /(?:US\s*)?\$\s?(\d{1,5}(?:,\d{3})*(?:\.\d{1,2})?)/;
        const seen = new Set(),
          found = [];
        const anchors = [...document.querySelectorAll("a[href]")];
        for (const a of anchors) {
          let u;
          try {
            u = new URL(a.href);
          } catch {
            continue;
          }
          if (
            !/(^|\.)depop\.com$/i.test(u.hostname) ||
            !/\/products?\//i.test(u.pathname)
          )
            continue;
          const href = u.href.split("?")[0];
          if (seen.has(href)) continue;
          let node = a,
            bestText = "";
          for (let i = 0; i < 4 && node; i++, node = node.parentElement) {
            const t = (node.innerText || "").replace(/\s+/g, " ").trim();
            if (t && priceRe.test(t)) {
              bestText = t;
              break;
            }
          }
          const match = bestText.match(priceRe);
          if (!match) continue;
          const price = Number(match[1].replace(/,/g, ""));
          if (!Number.isFinite(price) || price <= 0 || price > 100000) continue;
          let name = (a.innerText || a.getAttribute("aria-label") || "")
            .replace(/\s+/g, " ")
            .trim();
          name = name.split(/\$\s?\d/)[0].trim();
          if (!name || name.length < 2 || name.length > 160) {
            name =
              bestText.replace(match[0], "").trim().slice(0, 120) ||
              "Depop item";
          }
          found.push({ name, price, url: href });
          seen.add(href);
        }
        return { items: found, url: location.href };
      },
    });
    const data = results?.[0]?.result;
    const found = Array.isArray(data?.items) ? data.items : [];
    if (!found.length) {
      $("status").textContent =
        "No item prices detected. Keep the bag items visible and try again. If Depop's current layout hides listing prices, the reader may need an adjustment.";
      return;
    }
    items = found;
    lastScanUrl = data.url || tab.url;
    renderItems();
    calculate();
    $("status").textContent =
      `Found ${items.length} item${items.length === 1 ? "" : "s"}. The subtotal and estimated total are updated below.`;
  } catch (err) {
    $("status").textContent =
      "Could not scan this page: " + (err?.message || String(err));
  } finally {
    button.disabled = false;
  }
}
$("rescan").addEventListener("click", scan);
$("clear").addEventListener("click", async () => {
  items = [];
  lastScanUrl = "";
  renderItems();
  calculate();
  $("status").textContent = "Items cleared.";
  await saveState();
});

restoreState();
