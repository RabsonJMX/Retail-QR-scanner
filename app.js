import { add, get, getAll, getByIndex, openDatabase, put } from "./db.js";
import { parseQr } from "./qr-rules.js";
import { calculateBatch, isValidUkPostcode, normalizePostcode } from "./incentive-rules.js";

const $ = (selector) => document.querySelector(selector);
const messages = {
  zh: {
    pageTitle: "门店扫码", guide: "操作指南", export: "导出记录", heroTitle: "每一盒，只计一次。", heroText: "选择门店后扫描产品二维码。有效商品自动入账，重复二维码不会增加计数。",
    currentStore: "当前门店", selectStore: "选择门店", copy: "复制", share: "转发", newStore: "+ 新建门店", emptyTitle: "先创建一家门店", emptyText: "扫码结果会记入当前门店档案。", createStore: "创建门店档案",
    validScans: "有效扫码", today: "今日新增", productTypes: "产品种类", boxes: "盒", types: "类", pointsRebate: "积分与返利", currentBatch: "当前批次", waiting: "等待扫码", batchPoints: "本批积分", pointRule: "分（每盒 1 分）", rebate: "20% 返利", pricedSales: "计价销售额 {amount}", submitBatch: "提交本批并计算返利",
    qrScan: "二维码扫描", ready: "准备扫描", cameraOff: "相机未启动", cameraView: "二维码相机画面", cameraHint: "点击下方按钮开启后置相机", startCamera: "开启相机扫码", stopCamera: "停止扫码", capture: "高清拍照识别", manualSummary: "无法使用相机？手动输入测试", manualPlaceholder: "输入二维码完整内容", validateCount: "验证并计数", cameraQualityTitle: "1cm 小码增强已启用", cameraQualityDetail: "{resolution}{zoom} · 请保持约 10–15cm 距离，并让二维码至少占绿色框的 1/4", enhancingPhoto: "正在增强小尺寸二维码", cameraSelectLabel: "选择摄像头", focusUnavailableTitle: "当前镜头无法近距离对焦", focusUnavailableDetail: "{resolution} · 请切换到超广角/微距镜头，或使用手机及高清拍照识别",
    storeProfile: "门店档案", scanRecords: "扫码记录", edit: "编辑资料", time: "时间", product: "产品", flavor: "口味", qrTail: "二维码尾号", noRecords: "这家门店还没有有效扫码。",
    newStoreTitle: "新建门店", editStoreTitle: "编辑门店", storeName: "门店名称 *", storeNameExample: "例如：Soho Vape Store", postcode: "邮编（选填）", postcodeExample: "例如：SW1A 1AA", postcodeError: "请输入有效的英国邮编，例如 SW1A 1AA。", decisionMaker: "决策人名称（选填）", namePlaceholder: "姓名", contact: "联系方式（选填）", contactPlaceholder: "电话、WhatsApp 或邮箱", cancel: "取消", save: "保存档案", close: "关闭", notProvided: "未填写",
    preScan: "开始扫码前确认", storeCorrect: "店铺信息是否正确？", scanIntoStore: "本次扫码将计入以上店铺。", confirmStart: "确认并开始扫码",
    quickStart: "快速上手", guideIntro: "按照以下步骤完成建店、扫码和结果分享。所有扫码数据只保存在当前手机浏览器。", step1Title: "创建店铺", step1Text: "只需填写店铺名称；英国邮编、决策人名称和联系方式均为选填。填写邮编时会自动校验和格式化。", step2Title: "选择当前门店", step2Text: "扫码前确认顶部显示的是正确门店，所有有效扫码会记入该门店。", step3Title: "允许相机并确认店铺", step3Text: "允许相机权限后，核对弹窗中的店铺名称和邮编，点击确认后才会开始扫码。", step4Title: "对准二维码", step4Text: "让完整二维码位于扫描框内并保持稳定。无法实时扫描时，点击“拍照识别”。", step5Title: "查看识别结果", step6Title: "提交批次", step6Text: "每个有效盒码积 1 分。提交后系统按 8000 KIT £22、8000 POD £15.50 自动计算销售额及 20% 返利。", cameraHelp: "相机无法开启？", cameraHelpText: "请确认通过 HTTPS 网站打开，并在手机的浏览器网站设置中允许相机。关闭其他正在使用相机的应用后重试。", dataHelp: "数据保存在哪里？", dataHelpText: "门店和扫码记录保存在当前浏览器。清除浏览器数据或更换手机后不会自动同步，请定期导出记录。",
    noStores: "暂无门店", decision: "决策人：{name}", noDetails: "尚未填写店铺详情", pendingBoxes: "{count} 盒待提交", latestBatch: "最近提交：{date} · {points} 分 · 20% 返利 {amount}", batchSubmittedTitle: "提交成功 · 返利 {amount}", batchSubmittedDetail: "本批 {points} 分，计价销售额 {sales}", scanning: "正在扫描", identifying: "正在识别照片",
    unsupportedTitle: "浏览器不支持相机", unsupportedDetail: "请使用 Safari、Chrome、Firefox 或 Edge 的最新版本，并通过 HTTPS 打开。", cameraUnavailable: "相机不可用", permissionDenied: "相机权限被拒绝，请在浏览器网站设置中允许相机后重试。", noCamera: "没有找到可用相机。", httpsRequired: "相机需要 HTTPS 安全网址，请通过 GitHub Pages 打开。", cameraFailed: "无法开启相机，请关闭其他占用相机的应用后重试。",
    identifyFailed: "无法识别", componentMissing: "二维码识别组件未加载。", noQrTitle: "未识别到二维码", noQrDetail: "照片中没有识别到清晰的二维码，请重新拍摄。", noStoreTitle: "未选择门店", noStoreDetail: "请先选择门店。", invalidQr: "无效二维码", invalidDetail: "二维码内容不符合产品编码规则。", duplicateTitle: "重复扫码 · 未计数", duplicateDetail: "已于 {date} 计入 {store}", otherStore: "其他门店", successTitle: "计数成功 +1", duplicateSaved: "此二维码已经记录。", saveFailedTitle: "保存失败", saveFailedDetail: "记录保存失败，请重试。", incompleteTitle: "店铺资料不完整", incompleteDetail: "请先填写店铺名称。", copied: "已复制", shared: "已转发",
  },
  en: {
    pageTitle: "Store Scanner", guide: "Guide", export: "Export", heroTitle: "Every box counts once.", heroText: "Select a store and scan product QR codes. Valid products are recorded automatically; duplicate codes are never counted twice.",
    currentStore: "Current store", selectStore: "Select store", copy: "Copy", share: "Share", newStore: "+ New store", emptyTitle: "Create your first store", emptyText: "Scan results will be saved to the current store profile.", createStore: "Create store profile",
    validScans: "Valid scans", today: "Added today", productTypes: "Product types", boxes: "boxes", types: "types", pointsRebate: "Points & rebate", currentBatch: "Current batch", waiting: "Waiting for scans", batchPoints: "Batch points", pointRule: "points (1 per box)", rebate: "20% rebate", pricedSales: "Eligible sales {amount}", submitBatch: "Submit batch and calculate rebate",
    qrScan: "QR scanner", ready: "Ready to scan", cameraOff: "Camera off", cameraView: "QR camera view", cameraHint: "Tap below to open the rear camera", startCamera: "Start camera scan", stopCamera: "Stop scanning", capture: "Scan high-res photo", manualSummary: "Camera unavailable? Enter a test code", manualPlaceholder: "Enter the complete QR code", validateCount: "Validate and count", cameraQualityTitle: "1cm QR enhancement enabled", cameraQualityDetail: "{resolution}{zoom} · Hold 10–15cm away and fill at least one-quarter of the green frame", enhancingPhoto: "Enhancing small QR code", cameraSelectLabel: "Choose camera", focusUnavailableTitle: "This camera cannot focus this close", focusUnavailableDetail: "{resolution} · Switch to an ultra-wide/macro camera, or use a phone or high-resolution photo",
    storeProfile: "Store profile", scanRecords: "Scan records", edit: "Edit details", time: "Time", product: "Product", flavor: "Flavour", qrTail: "QR code ending", noRecords: "No valid scans for this store yet.",
    newStoreTitle: "New store", editStoreTitle: "Edit store", storeName: "Store name *", storeNameExample: "e.g. Soho Vape Store", postcode: "Postcode (optional)", postcodeExample: "e.g. SW1A 1AA", postcodeError: "Enter a valid UK postcode, for example SW1A 1AA.", decisionMaker: "Decision maker (optional)", namePlaceholder: "Name", contact: "Contact details (optional)", contactPlaceholder: "Phone, WhatsApp or email", cancel: "Cancel", save: "Save profile", close: "Close", notProvided: "Not provided",
    preScan: "Confirm before scanning", storeCorrect: "Is this the correct store?", scanIntoStore: "Scans in this session will be assigned to this store.", confirmStart: "Confirm and start scanning",
    quickStart: "Quick start", guideIntro: "Follow these steps to create a store, scan products and share results. All scan data stays in this browser.", step1Title: "Create a store", step1Text: "Only the store name is required. UK postcode, decision maker and contact details are optional. A postcode is validated and formatted when provided.", step2Title: "Select the current store", step2Text: "Check the correct store is selected before scanning. Every valid scan is assigned to it.", step3Title: "Allow camera and confirm", step3Text: "After allowing camera access, verify the store name and postcode, then confirm to start scanning.", step4Title: "Align the QR code", step4Text: "Keep the complete QR code steady inside the frame. Use “Scan photo” if live scanning is unavailable.", step5Title: "Check the result", step6Title: "Submit the batch", step6Text: "Each valid box earns 1 point. Submission calculates eligible sales and a 20% rebate using £22 for 8000 KIT and £15.50 for 8000 POD.", cameraHelp: "Camera not opening?", cameraHelpText: "Open the site over HTTPS and allow camera access in your browser settings. Close other apps using the camera and retry.", dataHelp: "Where is data stored?", dataHelpText: "Store and scan records stay in this browser. They will not sync after clearing browser data or changing device, so export regularly.",
    noStores: "No stores", decision: "Decision maker: {name}", noDetails: "Store details not completed", pendingBoxes: "{count} boxes pending", latestBatch: "Latest: {date} · {points} points · 20% rebate {amount}", batchSubmittedTitle: "Submitted · rebate {amount}", batchSubmittedDetail: "{points} points in this batch; eligible sales {sales}", scanning: "Scanning", identifying: "Reading photo",
    unsupportedTitle: "Camera not supported", unsupportedDetail: "Use the latest Safari, Chrome, Firefox or Edge and open the site over HTTPS.", cameraUnavailable: "Camera unavailable", permissionDenied: "Camera access was denied. Allow it in the browser site settings and retry.", noCamera: "No camera was found.", httpsRequired: "Camera access requires HTTPS. Open the GitHub Pages site.", cameraFailed: "Could not open the camera. Close other apps using it and retry.",
    identifyFailed: "Unable to scan", componentMissing: "The QR scanner did not load.", noQrTitle: "No QR code found", noQrDetail: "No clear QR code was found in the photo. Take another photo and retry.", noStoreTitle: "No store selected", noStoreDetail: "Select a store first.", invalidQr: "Invalid QR code", invalidDetail: "The QR content does not match the product code rules.", duplicateTitle: "Duplicate · not counted", duplicateDetail: "Counted on {date} for {store}", otherStore: "another store", successTitle: "Counted +1", duplicateSaved: "This QR code has already been recorded.", saveFailedTitle: "Save failed", saveFailedDetail: "The record could not be saved. Please retry.", incompleteTitle: "Store details incomplete", incompleteDetail: "Enter the store name first.", copied: "Copied", shared: "Shared",
  },
};
let language = localStorage.getItem("pixl-language") === "en" ? "en" : "zh";
function t(key, values = {}) {
  return (messages[language][key] || key).replace(/\{(\w+)\}/g, (_, name) => values[name] ?? "");
}
const elements = {
  languageButton: $("#language-button"),
  storeSelect: $("#store-select"), empty: $("#empty-state"), workspace: $("#workspace"), dialog: $("#store-dialog"),
  storeForm: $("#store-form"), storeId: $("#store-id"), nameInput: $("#store-name-input"),
  postcodeInput: $("#store-postcode-input"), decisionMakerInput: $("#store-decision-maker-input"),
  contactInput: $("#store-contact-input"), postcodeError: $("#postcode-error"), dialogTitle: $("#dialog-title"),
  total: $("#total-count"), today: $("#today-count"), products: $("#product-count"), storeName: $("#store-name"),
  storeMeta: $("#store-meta"), scanList: $("#scan-list"), noRecords: $("#no-records"), reader: $("#reader"),
  copyButton: $("#copy-store-button"), shareButton: $("#share-store-button"),
  cameraButton: $("#camera-button"), cameraStatus: $("#camera-status"), cameraPlaceholder: $("#camera-placeholder"),
  captureButton: $("#capture-button"), imageInput: $("#image-input"),
  cameraPicker: $("#camera-picker"), cameraSelect: $("#camera-select"),
  feedback: $("#scan-feedback"), manualForm: $("#manual-form"), manualCode: $("#manual-code"),
  confirmDialog: $("#store-confirm-dialog"), confirmStoreName: $("#confirm-store-name"), confirmStorePostcode: $("#confirm-store-postcode"),
  batchStatus: $("#batch-status"), batchPoints: $("#batch-points"), batchKitCount: $("#batch-kit-count"),
  batchPodCount: $("#batch-pod-count"), batchRebate: $("#batch-rebate"), batchSales: $("#batch-sales"),
  submitBatchButton: $("#submit-batch-button"), lastBatchSummary: $("#last-batch-summary"),
};

let db;
let catalog;
let stores = [];
let currentStoreId = localStorage.getItem("pixl-current-store") || "";
let scanner = null;
let detailScanner = null;
let cameraDevices = [];
let selectedCameraId = localStorage.getItem("pixl-camera-id") || "";
let scanning = false;
let detailScanTimer = 0;
let detailScanBusy = false;
let lastDetected = { code: "", at: 0 };
let currentReportText = "";

async function init() {
  [db, catalog] = await Promise.all([openDatabase(), fetch("./data/catalog.json").then((response) => response.json())]);
  bindEvents();
  applyLanguage(false);
  await refreshStores();
}

function bindEvents() {
  elements.languageButton.addEventListener("click", async () => {
    language = language === "zh" ? "en" : "zh";
    localStorage.setItem("pixl-language", language);
    await applyLanguage();
  });
  $("#guide-button").addEventListener("click", openGuide);
  $("#guide-close").addEventListener("click", closeGuide);
  $("#guide-overlay").addEventListener("click", closeGuide);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeGuide(); });
  $("#new-store-button").addEventListener("click", () => openStoreDialog());
  $("#empty-new-store").addEventListener("click", () => openStoreDialog());
  $("#edit-store-button").addEventListener("click", editCurrentStore);
  elements.copyButton.addEventListener("click", copyCurrentStore);
  elements.shareButton.addEventListener("click", shareCurrentStore);
  $("#cancel-store").addEventListener("click", () => elements.dialog.close());
  elements.storeForm.addEventListener("submit", saveStore);
  elements.postcodeInput.addEventListener("input", () => { elements.postcodeError.hidden = true; });
  elements.postcodeInput.addEventListener("blur", () => { elements.postcodeInput.value = normalizePostcode(elements.postcodeInput.value); });
  elements.submitBatchButton.addEventListener("click", submitCurrentBatch);
  elements.storeSelect.addEventListener("change", async () => {
    currentStoreId = elements.storeSelect.value;
    localStorage.setItem("pixl-current-store", currentStoreId);
    await renderCurrentStore();
  });
  elements.cameraButton.addEventListener("click", toggleCamera);
  elements.captureButton.addEventListener("click", () => elements.imageInput.click());
  elements.imageInput.addEventListener("change", scanImage);
  elements.cameraSelect.addEventListener("change", changeCamera);
  elements.manualForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await handleCode(elements.manualCode.value);
    elements.manualCode.select();
  });
  $("#export-button").addEventListener("click", exportRecords);
  window.addEventListener("pagehide", stopCamera);
}

function openGuide() {
  const sidebar = $("#guide-sidebar");
  const overlay = $("#guide-overlay");
  sidebar.classList.add("is-open");
  overlay.classList.add("is-open");
  sidebar.setAttribute("aria-hidden", "false");
  overlay.setAttribute("aria-hidden", "false");
  $("#guide-button").setAttribute("aria-expanded", "true");
  document.body.classList.add("guide-open");
  setTimeout(() => $("#guide-close").focus(), 220);
}

async function applyLanguage(rerender = true) {
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en-GB";
  document.title = t("pageTitle");
  elements.languageButton.textContent = language === "zh" ? "EN" : "中文";
  elements.languageButton.setAttribute("aria-label", language === "zh" ? "Switch to English" : "切换到中文");
  $(".empty-icon").textContent = language === "zh" ? "店" : "S";
  const textMap = [
    ["#guide-button", "guide"], ["#export-button", "export"], [".hero h1", "heroTitle"], [".hero p:last-child", "heroText"],
    [".store-selector .label", "currentStore"], ["#copy-store-button", "copy"], ["#share-store-button", "share"], ["#new-store-button", "newStore"],
    ["#empty-state h2", "emptyTitle"], ["#empty-state p", "emptyText"], ["#empty-new-store", "createStore"],
    [".stats-grid .stat:nth-child(1) span", "validScans"], [".stats-grid .stat:nth-child(2) span", "today"], [".stats-grid .stat:nth-child(3) span", "productTypes"],
    [".stats-grid .stat:nth-child(1) small", "boxes"], [".stats-grid .stat:nth-child(2) small", "boxes"], [".stats-grid .stat:nth-child(3) small", "types"],
    [".batch-card .section-heading .label", "pointsRebate"], [".batch-card .section-heading h2", "currentBatch"], [".batch-grid>div:nth-child(1) span", "batchPoints"], [".batch-grid>div:nth-child(1) small", "pointRule"], [".rebate-total span", "rebate"], ["#submit-batch-button", "submitBatch"],
    [".scanner-card .section-heading .label", "qrScan"], ["#scanner-title", "ready"], [".camera-placeholder p", "cameraHint"], ["#capture-button", "capture"], ["#camera-picker span", "cameraSelectLabel"], [".manual-entry summary", "manualSummary"], ["#manual-form button", "validateCount"],
    [".records-card .section-heading .label", "storeProfile"], ["#edit-store-button", "edit"], ["table th:nth-child(1)", "time"], ["table th:nth-child(2)", "product"], ["table th:nth-child(3)", "flavor"], ["table th:nth-child(4)", "qrTail"], ["#no-records", "noRecords"],
    ["#postcode-error", "postcodeError"], ["#cancel-store", "cancel"], ["#store-form .dialog-actions .primary-button", "save"],
    ["#store-confirm-dialog .label", "preScan"], ["#store-confirm-dialog h2", "storeCorrect"], ["#store-confirm-dialog .confirm-hint", "scanIntoStore"], ["#store-confirm-dialog .quiet-button", "cancel"], ["#store-confirm-dialog .primary-button", "confirmStart"],
    ["#guide-sidebar .guide-header .label", "quickStart"], ["#guide-title", "guide"], [".guide-intro", "guideIntro"],
    [".guide-steps li:nth-child(1) strong", "step1Title"], [".guide-steps li:nth-child(1) p", "step1Text"], [".guide-steps li:nth-child(2) strong", "step2Title"], [".guide-steps li:nth-child(2) p", "step2Text"], [".guide-steps li:nth-child(3) strong", "step3Title"], [".guide-steps li:nth-child(3) p", "step3Text"], [".guide-steps li:nth-child(4) strong", "step4Title"], [".guide-steps li:nth-child(4) p", "step4Text"], [".guide-steps li:nth-child(5) strong", "step5Title"], [".guide-steps li:nth-child(6) strong", "step6Title"], [".guide-steps li:nth-child(6) p", "step6Text"],
    [".guide-note:nth-of-type(1) h3", "cameraHelp"], [".guide-note:nth-of-type(1) p", "cameraHelpText"], [".guide-note:nth-of-type(2) h3", "dataHelp"], [".guide-note:nth-of-type(2) p", "dataHelpText"],
  ];
  for (const [selector, key] of textMap) {
    const node = $(selector);
    if (node) node.textContent = t(key);
  }
  const fieldMap = [
    ["store-name-input", "storeName", "storeNameExample"], ["store-postcode-input", "postcode", "postcodeExample"], ["store-decision-maker-input", "decisionMaker", "namePlaceholder"], ["store-contact-input", "contact", "contactPlaceholder"],
  ];
  for (const [id, labelKey, placeholderKey] of fieldMap) {
    const input = $(`#${id}`);
    input.closest("label").firstChild.textContent = t(labelKey);
    input.placeholder = t(placeholderKey);
  }
  elements.manualCode.placeholder = t("manualPlaceholder");
  elements.storeSelect.setAttribute("aria-label", t("selectStore"));
  elements.reader.setAttribute("aria-label", t("cameraView"));
  $("#guide-close").setAttribute("aria-label", `${t("close")} ${t("guide")}`);
  $("#store-form .close-button").setAttribute("aria-label", t("close"));
  const resultGuide = $(".result-guide");
  if (resultGuide) resultGuide.innerHTML = language === "zh"
    ? '<span class="result-success">计数成功</span><span>有效商品 +1</span><span class="result-duplicate">重复扫码</span><span>不会重复计数</span><span class="result-error">无效二维码</span><span>编码不符合规则</span>'
    : '<span class="result-success">Counted</span><span>Valid product +1</span><span class="result-duplicate">Duplicate</span><span>Not counted twice</span><span class="result-error">Invalid QR</span><span>Code does not match the rules</span>';
  elements.dialogTitle.textContent = elements.storeId.value ? t("editStoreTitle") : t("newStoreTitle");
  elements.cameraButton.textContent = scanning ? t("stopCamera") : t("startCamera");
  elements.cameraStatus.textContent = scanning ? t("scanning") : t("cameraOff");
  if (rerender || elements.feedback.classList.contains("neutral")) {
    elements.feedback.className = "feedback neutral";
    elements.feedback.textContent = t("waiting");
  }
  if (rerender) await refreshStores();
}

function closeGuide() {
  const sidebar = $("#guide-sidebar");
  const overlay = $("#guide-overlay");
  sidebar.classList.remove("is-open");
  overlay.classList.remove("is-open");
  sidebar.setAttribute("aria-hidden", "true");
  overlay.setAttribute("aria-hidden", "true");
  $("#guide-button").setAttribute("aria-expanded", "false");
  document.body.classList.remove("guide-open");
}

async function refreshStores() {
  stores = (await getAll(db, "stores")).sort((a, b) => a.name.localeCompare(b.name));
  if (!stores.some((store) => store.id === currentStoreId)) currentStoreId = stores[0]?.id || "";
  elements.storeSelect.innerHTML = stores.length
    ? stores.map((store) => `<option value="${escapeHtml(store.id)}">${escapeHtml(publicText(store.name))}</option>`).join("")
    : `<option value="">${t("noStores")}</option>`;
  elements.storeSelect.value = currentStoreId;
  elements.empty.hidden = stores.length > 0;
  elements.workspace.hidden = stores.length === 0;
  await renderCurrentStore();
}

function openStoreDialog(store = null) {
  elements.dialogTitle.textContent = store ? t("editStoreTitle") : t("newStoreTitle");
  elements.storeId.value = store?.id || "";
  elements.nameInput.value = store?.name || "";
  elements.postcodeInput.value = store?.postcode || "";
  elements.decisionMakerInput.value = store?.decisionMaker || "";
  elements.contactInput.value = store?.contact || "";
  elements.postcodeError.hidden = true;
  elements.dialog.showModal();
  elements.nameInput.focus();
}

async function saveStore(event) {
  event.preventDefault();
  const postcode = normalizePostcode(elements.postcodeInput.value);
  if (postcode && !isValidUkPostcode(postcode)) {
    elements.postcodeError.hidden = false;
    elements.postcodeInput.setCustomValidity(t("postcodeError"));
    elements.postcodeInput.reportValidity();
    return;
  }
  elements.postcodeInput.setCustomValidity("");
  const existing = stores.find((store) => store.id === elements.storeId.value);
  const store = {
    id: existing?.id || crypto.randomUUID(),
    name: elements.nameInput.value.trim(),
    postcode,
    decisionMaker: elements.decisionMakerInput.value.trim(),
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
  const batches = (await getByIndex(db, "batches", "storeId", currentStoreId)).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  elements.storeName.textContent = publicText(store.name);
  elements.storeMeta.textContent = [store.postcode, store.decisionMaker && t("decision", { name: store.decisionMaker }), store.contact].map(publicText).filter(Boolean).join(" · ") || t("noDetails");
  elements.total.textContent = scans.length.toLocaleString(language === "zh" ? "zh-CN" : "en-GB");
  const todayKey = new Date().toLocaleDateString("en-CA");
  elements.today.textContent = scans.filter((scan) => new Date(scan.scannedAt).toLocaleDateString("en-CA") === todayKey).length.toLocaleString(language === "zh" ? "zh-CN" : "en-GB");
  elements.products.textContent = new Set(scans.map((scan) => scan.productCode)).size;
  elements.scanList.innerHTML = scans.slice(0, 100).map((scan) => `<tr><td>${formatDate(scan.scannedAt)}</td><td><strong>${escapeHtml(publicText(scan.productName))}</strong><small>${escapeHtml(scan.productCode)}</small></td><td>${escapeHtml(scan.flavorName)}</td><td>…${escapeHtml(scan.code.slice(-6))}</td></tr>`).join("");
  elements.noRecords.hidden = scans.length > 0;
  renderBatch(scans, batches);
  currentReportText = createStoreReport(store, scans, batches);
}

function getActiveBatchId() {
  if (!currentStoreId) return "";
  const key = `pixl-active-batch-${currentStoreId}`;
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function renderBatch(scans, batches) {
  const activeId = localStorage.getItem(`pixl-active-batch-${currentStoreId}`);
  const currentScans = activeId ? scans.filter((scan) => scan.batchId === activeId) : [];
  const totals = calculateBatch(currentScans);
  elements.batchPoints.textContent = totals.points;
  elements.batchKitCount.textContent = totals.kitCount;
  elements.batchPodCount.textContent = totals.podCount;
  elements.batchSales.textContent = t("pricedSales", { amount: formatMoney(totals.salesPence) });
  elements.batchRebate.textContent = formatMoney(totals.rebatePence);
  elements.batchStatus.textContent = totals.points ? t("pendingBoxes", { count: totals.points }) : t("waiting");
  elements.submitBatchButton.disabled = totals.points === 0;
  const latest = batches[0];
  elements.lastBatchSummary.hidden = !latest;
  if (latest) elements.lastBatchSummary.textContent = t("latestBatch", { date: formatDate(latest.submittedAt), points: latest.points, amount: formatMoney(latest.rebatePence) });
}

async function submitCurrentBatch() {
  if (scanning) await stopCamera();
  const batchId = localStorage.getItem(`pixl-active-batch-${currentStoreId}`);
  if (!batchId) return;
  const scans = await getByIndex(db, "scans", "batchId", batchId);
  if (!scans.length) return;
  const totals = calculateBatch(scans);
  await add(db, "batches", { id: batchId, storeId: currentStoreId, submittedAt: new Date().toISOString(), ...totals });
  localStorage.removeItem(`pixl-active-batch-${currentStoreId}`);
  setFeedback("success", t("batchSubmittedDetail", { points: totals.points, sales: formatMoney(totals.salesPence) }), t("batchSubmittedTitle", { amount: formatMoney(totals.rebatePence) }));
  await renderCurrentStore();
}

async function toggleCamera() {
  if (scanning) return stopCamera();
  if (!navigator.mediaDevices?.getUserMedia || !window.Html5Qrcode) {
    setFeedback("error", t("unsupportedDetail"), t("unsupportedTitle"));
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: cameraConstraints(), audio: false });
    stream.getTracks().forEach((track) => track.stop());
    await loadCameraDevices();
    if (!(await confirmCurrentStore())) return;
    await startCameraSession();
  } catch (error) {
    console.error(error);
    setFeedback("error", cameraErrorMessage(error), t("cameraUnavailable"));
    await stopCamera();
  }
}

async function startCameraSession() {
  scanner ||= createScanner();
  const cameraTarget = selectedCameraId || { facingMode: "environment" };
  await scanner.start(
      cameraTarget,
      {
        fps: 15,
        videoConstraints: cameraConstraints(selectedCameraId),
        qrbox: (width, height) => {
          const edge = Math.floor(Math.min(width, height) * 0.82);
          return { width: edge, height: edge };
        },
        disableFlip: false,
      },
      onDecoded,
      () => {},
    );
    scanning = true;
    elements.cameraPlaceholder.hidden = true;
    elements.cameraButton.textContent = t("stopCamera");
    elements.cameraStatus.textContent = t("scanning");
    elements.cameraStatus.classList.add("live");
    await optimizeActiveCamera();
    startDetailScanning();
}

async function loadCameraDevices() {
  try {
    cameraDevices = await Html5Qrcode.getCameras();
  } catch (_) {
    cameraDevices = [];
  }
  if (!cameraDevices.some((camera) => camera.id === selectedCameraId)) {
    selectedCameraId = chooseBestCamera(cameraDevices)?.id || "";
  }
  renderCameraPicker();
}

function chooseBestCamera(cameras) {
  return [...cameras].sort((left, right) => cameraScore(right.label) - cameraScore(left.label))[0];
}

function cameraScore(label = "") {
  const name = label.toLowerCase();
  if (/ultra.?wide|macro|0[.,]5|超广角|微距/.test(name)) return 100;
  if (/back|rear|environment|后置/.test(name)) return 60;
  if (/front|user|facetime|前置/.test(name)) return 10;
  return 30;
}

function renderCameraPicker() {
  elements.cameraSelect.replaceChildren(...cameraDevices.map((camera, index) => {
    const option = document.createElement("option");
    option.value = camera.id;
    option.textContent = camera.label || `${t("cameraSelectLabel")} ${index + 1}`;
    option.selected = camera.id === selectedCameraId;
    return option;
  }));
  elements.cameraPicker.hidden = cameraDevices.length < 2;
}

async function changeCamera() {
  selectedCameraId = elements.cameraSelect.value;
  localStorage.setItem("pixl-camera-id", selectedCameraId);
  if (!scanning) return;
  await stopCamera();
  try {
    await startCameraSession();
  } catch (error) {
    console.error(error);
    setFeedback("error", cameraErrorMessage(error), t("cameraUnavailable"));
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
  stopDetailScanning();
  if (wasScanning && scanner) {
    try { await scanner.stop(); } catch (_) {}
  }
  try { scanner?.clear(); } catch (_) {}
  elements.cameraPlaceholder.hidden = false;
  elements.cameraButton.textContent = t("startCamera");
  elements.cameraStatus.textContent = t("cameraOff");
  elements.cameraStatus.classList.remove("live");
}

async function scanImage(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (!window.Html5Qrcode) return setFeedback("error", t("componentMissing"), t("identifyFailed"));
  await stopCamera();
  try {
    scanner ||= createScanner();
    elements.cameraPlaceholder.hidden = true;
    elements.cameraStatus.textContent = t("identifying");
    const value = await scanFileWithEnhancement(file);
    await onDecoded(value);
  } catch (error) {
    setFeedback("error", t("noQrDetail"), t("noQrTitle"));
  } finally {
    try { scanner?.clear(); } catch (_) {}
    elements.cameraPlaceholder.hidden = false;
    elements.cameraStatus.textContent = t("cameraOff");
  }
}

async function scanFileWithEnhancement(file) {
  try {
    return await scanner.scanFile(file, true);
  } catch (originalError) {
    elements.cameraStatus.textContent = t("enhancingPhoto");
    const variants = await createScanVariants(file);
    for (const variant of variants) {
      if (variant.value) return variant.value;
      try {
        return await scanner.scanFile(variant.file, false);
      } catch (_) {}
    }
    throw originalError;
  }
}

async function createScanVariants(file) {
  if (!window.createImageBitmap) return [];
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch (_) {
    try { bitmap = await createImageBitmap(file); } catch (_) { return []; }
  }
  const variants = [];
  const minEdge = Math.min(bitmap.width, bitmap.height);
  const configs = [
    { scale: 0.72, contrast: false },
    { scale: 0.5, contrast: true },
    { scale: 0.34, contrast: true },
  ];
  for (const config of configs) {
    const cropEdge = Math.max(160, Math.floor(minEdge * config.scale));
    const sourceX = Math.floor((bitmap.width - cropEdge) / 2);
    const sourceY = Math.floor((bitmap.height - cropEdge) / 2);
    const targetEdge = Math.min(1800, Math.max(1000, cropEdge * 3));
    const canvas = document.createElement("canvas");
    canvas.width = targetEdge;
    canvas.height = targetEdge;
    const context = canvas.getContext("2d", { willReadFrequently: config.contrast });
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, sourceX, sourceY, cropEdge, cropEdge, 0, 0, targetEdge, targetEdge);
    if (config.contrast) enhanceCanvasContrast(context, targetEdge);
    const value = decodeCanvasWithJsQr(context, targetEdge);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (blob) variants.push({ file: new File([blob], `qr-enhanced-${config.scale}.png`, { type: "image/png" }), value });
  }
  bitmap.close?.();
  return variants;
}

function enhanceCanvasContrast(context, edge) {
  const image = context.getImageData(0, 0, edge, edge);
  const pixels = image.data;
  for (let index = 0; index < pixels.length; index += 4) {
    const gray = pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114;
    const contrasted = Math.max(0, Math.min(255, (gray - 128) * 1.65 + 128));
    pixels[index] = pixels[index + 1] = pixels[index + 2] = contrasted;
  }
  context.putImageData(image, 0, 0);
}

function cameraErrorMessage(error) {
  const message = String(error?.message || error || "");
  if (/NotAllowed|Permission|denied/i.test(message)) return t("permissionDenied");
  if (/NotFound|DevicesNotFound/i.test(message)) return t("noCamera");
  if (!window.isSecureContext) return t("httpsRequired");
  return t("cameraFailed");
}

async function handleCode(rawValue) {
  if (!currentStoreId) return setFeedback("error", t("noStoreDetail"), t("noStoreTitle"));
  const result = parseQr(rawValue, catalog);
  if (!result.valid) {
    setFeedback("error", language === "zh" ? result.reason : t("invalidDetail"), t("invalidQr"));
    vibrate([100, 60, 100]);
    return;
  }
  const existing = await get(db, "scans", result.value);
  if (existing) {
    const store = stores.find((item) => item.id === existing.storeId);
    setFeedback("duplicate", t("duplicateDetail", { date: formatDate(existing.scannedAt), store: store?.name || t("otherStore") }), t("duplicateTitle"));
    vibrate([60, 50, 60]);
    return;
  }
  try {
    await add(db, "scans", { code: result.value, storeId: currentStoreId, batchId: getActiveBatchId(), scannedAt: new Date().toISOString(), ...result });
    setFeedback("success", `${publicText(result.productName)} · ${publicText(result.flavorName)}`, t("successTitle"));
    vibrate(80);
    await renderCurrentStore();
  } catch (error) {
    if (error.name === "ConstraintError") setFeedback("duplicate", t("duplicateSaved"), t("duplicateTitle"));
    else setFeedback("error", t("saveFailedDetail"), t("saveFailedTitle"));
  }
}

function createStoreReport(store, scans, batches) {
  const todayKey = new Date().toLocaleDateString("en-CA");
  const todayCount = scans.filter((scan) => new Date(scan.scannedAt).toLocaleDateString("en-CA") === todayKey).length;
  const summary = new Map();
  for (const scan of scans) {
    const key = `${publicText(scan.productName)} · ${publicText(scan.flavorName)}`;
    summary.set(key, (summary.get(key) || 0) + 1);
  }
  const productLines = [...summary.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => `- ${name}: ${count} ${language === "zh" ? "盒" : "boxes"}`);
  const recentLines = scans.slice(0, 20).map((scan) =>
    `- ${formatShareDate(scan.scannedAt)} | ${publicText(scan.productName)} · ${publicText(scan.flavorName)} | ${language === "zh" ? "尾号" : "ending"}…${scan.code.slice(-6)}`,
  );
  const submittedPoints = batches.reduce((sum, batch) => sum + batch.points, 0);
  const submittedRebatePence = batches.reduce((sum, batch) => sum + batch.rebatePence, 0);
  const labels = language === "zh" ? {
    title: "门店扫码报告", generated: "生成时间", store: "门店", postcode: "邮编", decision: "决策人", contact: "联系方式", total: "累计有效扫码", today: "今日新增", types: "产品种类", batches: "已提交批次", points: "已提交积分", rebate: "累计20%返利", products: "产品与口味统计：", recent: "最近扫码（最多20条）：", none: "- 暂无扫码", box: "盒", type: "类", batch: "批", point: "分",
  } : {
    title: "Store scan report", generated: "Generated", store: "Store", postcode: "Postcode", decision: "Decision maker", contact: "Contact", total: "Total valid scans", today: "Added today", types: "Product types", batches: "Submitted batches", points: "Submitted points", rebate: "Total 20% rebate", products: "Products and flavours:", recent: "Recent scans (up to 20):", none: "- No scans", box: " boxes", type: " types", batch: " batches", point: " points",
  };
  return [
    labels.title,
    `${labels.generated}：${new Date().toLocaleString(language === "zh" ? "zh-CN" : "en-GB")}`,
    "",
    `${labels.store}：${publicText(store.name)}`,
    store.postcode && `${labels.postcode}：${publicText(store.postcode)}`,
    store.decisionMaker && `${labels.decision}：${publicText(store.decisionMaker)}`,
    store.contact && `${labels.contact}：${publicText(store.contact)}`,
    "",
    `${labels.total}：${scans.length}${labels.box}`,
    `${labels.today}：${todayCount}${labels.box}`,
    `${labels.types}：${new Set(scans.map((scan) => scan.productCode)).size}${labels.type}`,
    `${labels.batches}：${batches.length}${labels.batch}`,
    `${labels.points}：${submittedPoints}${labels.point}`,
    `${labels.rebate}：${formatMoney(submittedRebatePence)}`,
    "",
    labels.products,
    ...(productLines.length ? productLines : [labels.none]),
    "",
    labels.recent,
    ...(recentLines.length ? recentLines : [labels.none]),
  ].filter((line) => line !== "").join("\n").replace(/\n{3,}/g, "\n\n");
}

function confirmCurrentStore() {
  const store = stores.find((item) => item.id === currentStoreId);
  if (!store?.name) {
    setFeedback("error", t("incompleteDetail"), t("incompleteTitle"));
    return Promise.resolve(false);
  }
  elements.confirmStoreName.textContent = publicText(store.name);
  elements.confirmStorePostcode.textContent = store.postcode ? normalizePostcode(store.postcode) : t("notProvided");
  elements.confirmDialog.showModal();
  return new Promise((resolve) => {
    elements.confirmDialog.addEventListener("close", () => resolve(elements.confirmDialog.returnValue === "confirm"), { once: true });
  });
}

async function copyCurrentStore() {
  if (!currentReportText) return;
  await copyText(currentReportText);
  flashActionButton(elements.copyButton, t("copied"));
}

async function shareCurrentStore() {
  if (!currentReportText) return;
  const store = stores.find((item) => item.id === currentStoreId);
  if (navigator.share) {
    try {
      await navigator.share({ title: language === "zh" ? `${publicText(store?.name) || "门店"}扫码报告` : `${publicText(store?.name) || "Store"} scan report`, text: currentReportText });
      flashActionButton(elements.shareButton, t("shared"));
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }
  await copyText(currentReportText);
  flashActionButton(elements.shareButton, t("copied"));
  window.location.href = `https://wa.me/?text=${encodeURIComponent(currentReportText)}`;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (_) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
}

function createScanner() {
  return new Html5Qrcode("reader", {
    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    experimentalFeatures: { useBarCodeDetectorIfSupported: true },
    verbose: false,
  });
}

function createDetailScanner() {
  return new Html5Qrcode("detail-reader", {
    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    experimentalFeatures: { useBarCodeDetectorIfSupported: true },
    verbose: false,
  });
}

function startDetailScanning() {
  stopDetailScanning();
  detailScanTimer = window.setInterval(scanEnhancedVideoFrame, 800);
}

function stopDetailScanning() {
  window.clearInterval(detailScanTimer);
  detailScanTimer = 0;
  detailScanBusy = false;
  try { detailScanner?.clear(); } catch (_) {}
}

async function scanEnhancedVideoFrame() {
  if (!scanning || detailScanBusy || document.hidden) return;
  const video = elements.reader.querySelector("video");
  if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth) return;
  detailScanBusy = true;
  try {
    detailScanner ||= createDetailScanner();
    const variants = await createVideoFrameVariants(video);
    for (const variant of variants) {
      if (!scanning) break;
      if (variant.value) {
        await onDecoded(variant.value);
        break;
      }
      try {
        const value = await detailScanner.scanFile(variant.file, false);
        await onDecoded(value);
        break;
      } catch (_) {}
    }
  } finally {
    detailScanBusy = false;
  }
}

async function createVideoFrameVariants(video) {
  const minEdge = Math.min(video.videoWidth, video.videoHeight);
  const cropEdge = Math.floor(minEdge * 0.86);
  const sourceX = Math.floor((video.videoWidth - cropEdge) / 2);
  const sourceY = Math.floor((video.videoHeight - cropEdge) / 2);
  const targetEdge = Math.min(1600, Math.max(1200, cropEdge * 2));
  const modes = ["normal", "sharpen", "threshold"];
  const variants = [];
  for (const mode of modes) {
    const canvas = document.createElement("canvas");
    canvas.width = targetEdge;
    canvas.height = targetEdge;
    const context = canvas.getContext("2d", { willReadFrequently: mode !== "normal" });
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(video, sourceX, sourceY, cropEdge, cropEdge, 0, 0, targetEdge, targetEdge);
    if (mode === "sharpen") sharpenQrCanvas(context, targetEdge);
    if (mode === "threshold") thresholdQrCanvas(context, targetEdge);
    const value = decodeCanvasWithJsQr(context, targetEdge);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (blob) variants.push({ file: new File([blob], `qr-live-${mode}.png`, { type: "image/png" }), value });
  }
  return variants;
}

function sharpenQrCanvas(context, edge) {
  const image = context.getImageData(0, 0, edge, edge);
  const pixels = image.data;
  const copy = new Uint8ClampedArray(pixels);
  const row = edge * 4;
  for (let y = 1; y < edge - 1; y += 1) {
    for (let x = 1; x < edge - 1; x += 1) {
      const index = y * row + x * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        const value = copy[index + channel] * 5
          - copy[index - 4 + channel] - copy[index + 4 + channel]
          - copy[index - row + channel] - copy[index + row + channel];
        pixels[index + channel] = Math.max(0, Math.min(255, value));
      }
    }
  }
  context.putImageData(image, 0, 0);
}

function thresholdQrCanvas(context, edge) {
  const image = context.getImageData(0, 0, edge, edge);
  const pixels = image.data;
  const histogram = new Uint32Array(256);
  for (let index = 0; index < pixels.length; index += 4) {
    const gray = Math.round(pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114);
    histogram[gray] += 1;
  }
  const threshold = otsuThreshold(histogram, edge * edge);
  for (let index = 0; index < pixels.length; index += 4) {
    const gray = pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114;
    const value = gray >= threshold ? 255 : 0;
    pixels[index] = pixels[index + 1] = pixels[index + 2] = value;
  }
  context.putImageData(image, 0, 0);
}

function otsuThreshold(histogram, total) {
  let sum = 0;
  for (let level = 0; level < histogram.length; level += 1) sum += level * histogram[level];
  let backgroundWeight = 0;
  let backgroundSum = 0;
  let bestVariance = -1;
  let bestThreshold = 128;
  for (let level = 0; level < histogram.length; level += 1) {
    backgroundWeight += histogram[level];
    if (!backgroundWeight) continue;
    const foregroundWeight = total - backgroundWeight;
    if (!foregroundWeight) break;
    backgroundSum += level * histogram[level];
    const backgroundMean = backgroundSum / backgroundWeight;
    const foregroundMean = (sum - backgroundSum) / foregroundWeight;
    const variance = backgroundWeight * foregroundWeight * (backgroundMean - foregroundMean) ** 2;
    if (variance > bestVariance) {
      bestVariance = variance;
      bestThreshold = level;
    }
  }
  return bestThreshold;
}

function decodeCanvasWithJsQr(context, edge) {
  if (typeof window.jsQR !== "function") return "";
  try {
    const image = context.getImageData(0, 0, edge, edge);
    return window.jsQR(image.data, edge, edge, { inversionAttempts: "attemptBoth" })?.data || "";
  } catch (_) {
    return "";
  }
}

function cameraConstraints(deviceId = "") {
  const constraints = {
    width: { ideal: 2560 },
    height: { ideal: 1440 },
    frameRate: { ideal: 30, max: 30 },
  };
  if (deviceId) constraints.deviceId = { exact: deviceId };
  else constraints.facingMode = { ideal: "environment" };
  return constraints;
}

async function optimizeActiveCamera() {
  const video = elements.reader.querySelector("video");
  const track = video?.srcObject?.getVideoTracks?.()[0];
  if (!track) return;
  const capabilities = track.getCapabilities?.() || {};
  const advanced = {};
  if (Array.isArray(capabilities.focusMode) && capabilities.focusMode.includes("continuous")) {
    advanced.focusMode = "continuous";
  }
  if (capabilities.zoom && Number.isFinite(capabilities.zoom.min) && Number.isFinite(capabilities.zoom.max)) {
    advanced.zoom = Math.min(capabilities.zoom.max, Math.max(capabilities.zoom.min, 2));
  }
  if (Object.keys(advanced).length) {
    try { await track.applyConstraints({ advanced: [advanced] }); } catch (_) {}
  }
  const settings = track.getSettings?.() || {};
  const resolution = settings.width && settings.height ? `${settings.width}×${settings.height}` : "HD";
  const zoom = settings.zoom && settings.zoom > 1 ? ` · ${Number(settings.zoom).toFixed(1)}×` : "";
  const hasFocusControl = Array.isArray(capabilities.focusMode) && capabilities.focusMode.length > 0;
  if (!hasFocusControl) {
    setFeedback("duplicate", t("focusUnavailableDetail", { resolution }), t("focusUnavailableTitle"));
  } else {
    setFeedback("neutral", t("cameraQualityDetail", { resolution, zoom }), t("cameraQualityTitle"));
  }
}

function flashActionButton(button, label) {
  const original = button.textContent;
  button.textContent = label;
  button.classList.add("done");
  setTimeout(() => {
    button.textContent = original;
    button.classList.remove("done");
  }, 1500);
}

function formatShareDate(value) {
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-GB", {
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

async function exportRecords() {
  if (!db) return;
  const scans = await getAll(db, "scans");
  const batches = await getAll(db, "batches");
  const submittedBatchIds = new Set(batches.map((batch) => batch.id));
  const rows = [language === "zh"
    ? ["店铺名称", "邮编", "决策人", "联系方式", "批次编号", "批次状态", "扫码时间", "产品码", "产品名称", "口味码", "口味名称", "单盒金额(GBP)", "20%返利(GBP)", "生产时间", "完整二维码"]
    : ["Store name", "Postcode", "Decision maker", "Contact", "Batch ID", "Batch status", "Scanned at", "Product code", "Product name", "Flavour code", "Flavour name", "Unit price (GBP)", "20% rebate (GBP)", "Produced at", "Full QR code"]];
  for (const scan of scans.sort((a, b) => a.scannedAt.localeCompare(b.scannedAt))) {
    const store = stores.find((item) => item.id === scan.storeId) || {};
    const price = scan.productCode === "P8W03" ? 22 : scan.productCode === "P8T03" ? 15.5 : 0;
    rows.push([publicText(store.name), store.postcode, publicText(store.decisionMaker), publicText(store.contact), scan.batchId, submittedBatchIds.has(scan.batchId) ? (language === "zh" ? "已提交" : "Submitted") : t("currentBatch"), scan.scannedAt, scan.productCode, publicText(scan.productName), scan.flavorCode, publicText(scan.flavorName), price, price * 0.2, scan.producedAt, scan.code]);
  }
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
  link.download = `${language === "zh" ? "扫码记录" : "scan-records"}-${new Date().toLocaleDateString("en-CA")}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function setFeedback(type, detail, title) {
  elements.feedback.className = `feedback ${type}`;
  elements.feedback.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span>`;
}
function formatDate(value) { return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-GB", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
function formatMoney(pence) { return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100); }
function publicText(value) { return String(value ?? "").replace(/PIXL/gi, "").replace(/\s{2,}/g, " ").trim(); }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]); }
function csvCell(value) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
function vibrate(pattern) { navigator.vibrate?.(pattern); }

init().catch((error) => {
  console.error(error);
  document.body.innerHTML = language === "zh" ? '<main class="fatal"><h1>应用加载失败</h1><p>请刷新页面，或使用最新版 Chrome 重新打开。</p></main>' : '<main class="fatal"><h1>App failed to load</h1><p>Refresh the page or reopen it in the latest Chrome.</p></main>';
});
