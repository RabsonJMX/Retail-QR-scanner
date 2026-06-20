import { add, get, getAll, getByIndex, openDatabase, put } from "./db.js";
import { parseQr } from "./qr-rules.js";

const $ = (selector) => document.querySelector(selector);
const elements = {
  storeSelect: $("#store-select"), empty: $("#empty-state"), workspace: $("#workspace"), dialog: $("#store-dialog"),
  storeForm: $("#store-form"), storeId: $("#store-id"), nameInput: $("#store-name-input"), codeInput: $("#store-code-input"),
  addressInput: $("#store-address-input"), contactInput: $("#store-contact-input"), dialogTitle: $("#dialog-title"),
  total: $("#total-count"), today: $("#today-count"), products: $("#product-count"), storeName: $("#store-name"),
  storeMeta: $("#store-meta"), scanList: $("#scan-list"), noRecords: $("#no-records"), reader: $("#reader"),
  cameraButton: $("#camera-button"), cameraStatus: $("#camera-status"), cameraPlaceholder: $("#camera-placeholder"),
  captureButton: $("#capture-button"), imageInput: $("#image-input"),
  feedback: $("#scan-feedback"), manualForm: $("#manual-form"), manualCode: $("#manual-code"),
};

let db;
let catalog;
let stores = [];
let currentStoreId = localStorage.getItem("pixl-current-store") || "";
let scanner = null;
let scanning = false;
let lastDetected = { code: "", at: 0 };

async function init() {
  [db, catalog] = await Promise.all([openDatabase(), fetch("./data/catalog.json").then((response) => response.json())]);
  bindEvents();
  await refreshStores();
}

function bindEvents() {
  $("#new-store-button").addEventListener("click", () => openStoreDialog());
  $("#empty-new-store").addEventListener("click", () => openStoreDialog());
  $("#edit-store-button").addEventListener("click", editCurrentStore);
  $("#cancel-store").addEventListener("click", () => elements.dialog.close());
  elements.storeForm.addEventListener("submit", saveStore);
  elements.storeSelect.addEventListener("change", async () => {
    currentStoreId = elements.storeSelect.value;
    localStorage.setItem("pixl-current-store", currentStoreId);
    await renderCurrentStore();
  });
  elements.cameraButton.addEventListener("click", toggleCamera);
  elements.captureButton.addEventListener("click", () => elements.imageInput.click());
  elements.imageInput.addEventListener("change", scanImage);
  elements.manualForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await handleCode(elements.manualCode.value);
    elements.manualCode.select();
  });
  $("#export-button").addEventListener("click", exportRecords);
  window.addEventListener("pagehide", stopCamera);
}

async function refreshStores() {
  stores = (await getAll(db, "stores")).sort((a, b) => a.name.localeCompare(b.name));
  if (!stores.some((store) => store.id === currentStoreId)) currentStoreId = stores[0]?.id || "";
  elements.storeSelect.innerHTML = stores.length
    ? stores.map((store) => `<option value="${escapeHtml(store.id)}">${escapeHtml(store.name)}</option>`).join("")
    : '<option value="">暂无门店</option>';
  elements.storeSelect.value = currentStoreId;
  elements.empty.hidden = stores.length > 0;
  elements.workspace.hidden = stores.length === 0;
  await renderCurrentStore();
}

function openStoreDialog(store = null) {
  elements.dialogTitle.textContent = store ? "编辑门店" : "新建门店";
  elements.storeId.value = store?.id || "";
  elements.nameInput.value = store?.name || "";
  elements.codeInput.value = store?.code || "";
  elements.addressInput.value = store?.address || "";
  elements.contactInput.value = store?.contact || "";
  elements.dialog.showModal();
  elements.nameInput.focus();
}

async function saveStore(event) {
  event.preventDefault();
  const existing = stores.find((store) => store.id === elements.storeId.value);
  const store = {
    id: existing?.id || crypto.randomUUID(),
    name: elements.nameInput.value.trim(),
    code: elements.codeInput.value.trim(),
    address: elements.addressInput.value.trim(),
    contact: elements.contactInput.value.trim(),
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (!store.name) return;
  await put(db, "stores", store);
  currentStoreId = store.id;
  localStorage.setItem("pixl-current-store", currentStoreId);
  elements.dialog.close();
  await refreshStores();
}

function editCurrentStore() {
  const store = stores.find((item) => item.id === currentStoreId);
  if (store) openStoreDialog(store);
}

async function renderCurrentStore() {
  if (!currentStoreId || !db) return;
  const store = stores.find((item) => item.id === currentStoreId);
  const scans = (await getByIndex(db, "scans", "storeId", currentStoreId)).sort((a, b) => b.scannedAt.localeCompare(a.scannedAt));
  elements.storeName.textContent = store.name;
  elements.storeMeta.textContent = [store.code, store.address, store.contact].filter(Boolean).join(" · ") || "尚未填写门店详情";
  elements.total.textContent = scans.length.toLocaleString("zh-CN");
  const todayKey = new Date().toLocaleDateString("en-CA");
  elements.today.textContent = scans.filter((scan) => new Date(scan.scannedAt).toLocaleDateString("en-CA") === todayKey).length.toLocaleString("zh-CN");
  elements.products.textContent = new Set(scans.map((scan) => scan.productCode)).size;
  elements.scanList.innerHTML = scans.slice(0, 100).map((scan) => `<tr><td>${formatDate(scan.scannedAt)}</td><td><strong>${escapeHtml(scan.productName)}</strong><small>${escapeHtml(scan.productCode)}</small></td><td>${escapeHtml(scan.flavorName)}</td><td>…${escapeHtml(scan.code.slice(-6))}</td></tr>`).join("");
  elements.noRecords.hidden = scans.length > 0;
}

async function toggleCamera() {
  if (scanning) return stopCamera();
  if (!navigator.mediaDevices?.getUserMedia || !window.Html5Qrcode) {
    setFeedback("error", "请使用 Safari、Chrome、Firefox 或 Edge 的最新版本，并通过 HTTPS 打开。", "浏览器不支持相机");
    return;
  }
  try {
    scanner ||= new Html5Qrcode("reader", {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    });
    await scanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: (width, height) => {
          const edge = Math.floor(Math.min(width, height) * 0.72);
          return { width: edge, height: edge };
        },
        aspectRatio: 1,
        disableFlip: false,
      },
      onDecoded,
      () => {},
    );
    scanning = true;
    elements.cameraPlaceholder.hidden = true;
    elements.cameraButton.textContent = "停止扫码";
    elements.cameraStatus.textContent = "正在扫描";
    elements.cameraStatus.classList.add("live");
  } catch (error) {
    console.error(error);
    setFeedback("error", cameraErrorMessage(error), "相机不可用");
    await stopCamera();
  }
}

async function onDecoded(value) {
  if (!value || (value === lastDetected.code && Date.now() - lastDetected.at <= 3000)) return;
  lastDetected = { code: value, at: Date.now() };
  await handleCode(value);
}

async function stopCamera() {
  const wasScanning = scanning;
  scanning = false;
  if (wasScanning && scanner) {
    try { await scanner.stop(); } catch (_) {}
  }
  try { scanner?.clear(); } catch (_) {}
  elements.cameraPlaceholder.hidden = false;
  elements.cameraButton.textContent = "开启相机扫码";
  elements.cameraStatus.textContent = "相机未启动";
  elements.cameraStatus.classList.remove("live");
}

async function scanImage(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (!window.Html5Qrcode) return setFeedback("error", "二维码识别组件未加载。", "无法识别");
  await stopCamera();
  try {
    scanner ||= new Html5Qrcode("reader", {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    });
    elements.cameraPlaceholder.hidden = true;
    elements.cameraStatus.textContent = "正在识别照片";
    const value = await scanner.scanFile(file, true);
    await onDecoded(value);
  } catch (error) {
    setFeedback("error", "照片中没有识别到清晰的二维码，请重新拍摄。", "未识别到二维码");
  } finally {
    try { scanner?.clear(); } catch (_) {}
    elements.cameraPlaceholder.hidden = false;
    elements.cameraStatus.textContent = "相机未启动";
  }
}

function cameraErrorMessage(error) {
  const message = String(error?.message || error || "");
  if (/NotAllowed|Permission|denied/i.test(message)) return "相机权限被拒绝，请在浏览器网站设置中允许相机后重试。";
  if (/NotFound|DevicesNotFound/i.test(message)) return "没有找到可用相机。";
  if (!window.isSecureContext) return "相机需要 HTTPS 安全网址，请通过 GitHub Pages 打开。";
  return "无法开启相机，请关闭其他占用相机的应用后重试。";
}

async function handleCode(rawValue) {
  if (!currentStoreId) return setFeedback("error", "请先选择门店。", "未选择门店");
  const result = parseQr(rawValue, catalog);
  if (!result.valid) {
    setFeedback("error", result.reason, "无效二维码");
    vibrate([100, 60, 100]);
    return;
  }
  const existing = await get(db, "scans", result.value);
  if (existing) {
    const store = stores.find((item) => item.id === existing.storeId);
    setFeedback("duplicate", `已于 ${formatDate(existing.scannedAt)} 计入 ${store?.name || "其他门店"}`, "重复扫码 · 未计数");
    vibrate([60, 50, 60]);
    return;
  }
  try {
    await add(db, "scans", { code: result.value, storeId: currentStoreId, scannedAt: new Date().toISOString(), ...result });
    setFeedback("success", `${result.productName} · ${result.flavorName}`, "计数成功 +1");
    vibrate(80);
    await renderCurrentStore();
  } catch (error) {
    if (error.name === "ConstraintError") setFeedback("duplicate", "此二维码已经记录。", "重复扫码 · 未计数");
    else setFeedback("error", "记录保存失败，请重试。", "保存失败");
  }
}

async function exportRecords() {
  if (!db) return;
  const scans = await getAll(db, "scans");
  const rows = [["门店名称", "门店编号", "扫码时间", "产品码", "产品名称", "口味码", "口味名称", "生产时间", "完整二维码"]];
  for (const scan of scans.sort((a, b) => a.scannedAt.localeCompare(b.scannedAt))) {
    const store = stores.find((item) => item.id === scan.storeId) || {};
    rows.push([store.name, store.code, scan.scannedAt, scan.productCode, scan.productName, scan.flavorCode, scan.flavorName, scan.producedAt, scan.code]);
  }
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
  link.download = `PIXL扫码记录-${new Date().toLocaleDateString("en-CA")}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function setFeedback(type, detail, title) {
  elements.feedback.className = `feedback ${type}`;
  elements.feedback.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span>`;
}
function formatDate(value) { return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]); }
function csvCell(value) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
function vibrate(pattern) { navigator.vibrate?.(pattern); }

init().catch((error) => {
  console.error(error);
  document.body.innerHTML = '<main class="fatal"><h1>应用加载失败</h1><p>请刷新页面，或使用最新版 Chrome 重新打开。</p></main>';
});
