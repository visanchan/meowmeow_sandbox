const path = require("path");
const { chromium } = require("playwright");

const appPath = path.resolve(__dirname, "..", "meowmeow_pos_event.html");
const browserPath =
  process.env.PLAYWRIGHT_BROWSER_PATH ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

function assert(condition, message, details = null) {
  if (!condition) {
    const suffix = details ? `\n${JSON.stringify(details, null, 2)}` : "";
    throw new Error(`${message}${suffix}`);
  }
}

async function main() {
  const browser = await chromium.launch({
    executablePath: browserPath,
    headless: true,
  });
  const page = await browser.newPage();
  const pageErrors = [];
  const browserDialogs = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("dialog", async (dialog) => {
    browserDialogs.push(dialog.message());
    await dialog.dismiss();
  });

  await page.goto(`file:///${appPath.replace(/\\/g, "/")}`);
  await page.waitForSelector("#productGrid", { timeout: 5000 });

  // PIN-gated workflow coverage. Runs against a fresh init before the rest of
  // the smoke test wipes localStorage and bypasses locks via direct calls.
  // Confirms login + Dashboard + Inventory + Correction lock screens reject
  // wrong PINs and accept the documented passcodes.
  const pinFlows = {};

  // Login: overlay auto-opens when no operator is persisted.
  pinFlows.loginAutoOpen = await page.evaluate(() =>
    loginOverlay.classList.contains("open")
  );
  await page.click('#loginNameGrid button[data-login-name="Zamm"]');
  for (const digit of "999") {
    await page.click(`#loginNumpad button[data-login-key="${digit}"]`);
  }
  pinFlows.loginRejectsWrong = await page.evaluate(() => ({
    stillOpen: loginOverlay.classList.contains("open"),
    errorShown: !!state.loginPinErrorText,
    pinCleared: state.loginPin === "",
  }));
  for (const digit of "111") {
    await page.click(`#loginNumpad button[data-login-key="${digit}"]`);
  }
  await page.waitForFunction(() => !loginOverlay.classList.contains("open"));
  pinFlows.loginAcceptsCorrect = await page.evaluate(() => ({
    closed: !loginOverlay.classList.contains("open"),
    selected: state.selectedOperator,
  }));

  // Dashboard lock.
  await page.click("#dashboardAccessBtn");
  await page.waitForSelector("#dashboardLockScreen:not(.hidden)");
  for (const digit of "999") {
    await page.click(`#dashboardNumpad button[data-pin-key="${digit}"]`);
  }
  pinFlows.dashboardRejectsWrong = await page.evaluate(() => ({
    locked: !dashboardLockScreen.classList.contains("hidden"),
    panelHidden: dashboardPanel.classList.contains("hidden"),
    errorShown: dashboardPinError.textContent === "Incorrect passcode",
    pinCleared: state.dashboardPin === "",
  }));
  const sharedPasscode = await page.evaluate(
    () => ACCESS_CONTROL.sharedInternalPasscode
  );
  for (const digit of sharedPasscode) {
    await page.click(`#dashboardNumpad button[data-pin-key="${digit}"]`);
  }
  await page.waitForSelector("#dashboardPanel:not(.hidden)");
  pinFlows.dashboardAcceptsCorrect = await page.evaluate(() => ({
    locked: !dashboardLockScreen.classList.contains("hidden"),
    panelHidden: dashboardPanel.classList.contains("hidden"),
    totalText: dashboardTotalSales.textContent,
    goalScaleText: dashboardGoalScaleEnd.textContent,
    paceText: dashboardPaceNeeded.textContent,
    dashboardText: dashboardPanel.textContent,
    paySplitRendered: dashboardPaySplitTiles.textContent.includes("Cash") &&
      dashboardPaySplitTiles.textContent.includes("Transfer") &&
      dashboardPaySplitTiles.textContent.includes("Card"),
    timelineSteps: dashboardTimelineTrack.querySelectorAll(".v3-timeline-step").length,
    timelineCells: dashboardTimelineRows.querySelectorAll(".v3-timeline-cell").length,
    hourBucketCount: dashboardHourChart.querySelectorAll(".v3-hour-bucket").length,
    hourEmptyNote: dashboardHourPeakNote.textContent,
    hourChartText: dashboardHourChart.textContent,
    topSellersEmptyState: dashboardTopSellers.textContent.includes("No paid items sold yet"),
    lowStockEmptyState:
      dashboardLowStock.textContent.includes("All booth SKUs above their low-stock alert") ||
      dashboardLowStock.textContent.includes("Count Event Start in Stock & Allocation Setup"),
    lowStockTitleHasDay: dashboardLowStockTitle.textContent.includes("Day"),
  }));
  await page.evaluate(() => closeDashboard());

  // Inventory lock (reuses sharedInternalPasscode).
  await page.click("#developerAccessBtn");
  await page.waitForSelector("#inventoryLockScreen:not(.hidden)");
  for (const digit of "999") {
    await page.click(`#inventoryNumpad button[data-inventory-pin-key="${digit}"]`);
  }
  pinFlows.inventoryRejectsWrong = await page.evaluate(() => ({
    locked: !inventoryLockScreen.classList.contains("hidden"),
    panelHidden: inventoryPanel.classList.contains("hidden"),
    errorShown: inventoryPinError.textContent === "Incorrect passcode",
    pinCleared: state.inventoryPin === "",
  }));
  for (const digit of sharedPasscode) {
    await page.click(`#inventoryNumpad button[data-inventory-pin-key="${digit}"]`);
  }
  await page.waitForSelector("#inventoryPanel:not(.hidden)");
  pinFlows.inventoryAcceptsCorrect = await page.evaluate(() => ({
    locked: !inventoryLockScreen.classList.contains("hidden"),
    panelHidden: inventoryPanel.classList.contains("hidden"),
    setupVisible: !!document.getElementById("inventoryControlList"),
  }));

  // Correction lock (nested inside inventory panel; uses correctionPasscode).
  await page.click("#correctionAccessBtn");
  await page.waitForSelector("#correctionLockScreen:not(.hidden)");
  for (const digit of "999") {
    await page.click(`#correctionNumpad button[data-correction-pin-key="${digit}"]`);
  }
  pinFlows.correctionRejectsWrong = await page.evaluate(() => ({
    locked: !correctionLockScreen.classList.contains("hidden"),
    panelHidden: correctionPanel.classList.contains("hidden"),
    errorShown: correctionPinError.textContent === "Incorrect passcode",
    pinCleared: state.correctionPin === "",
  }));
  const correctionPasscode = await page.evaluate(
    () => ACCESS_CONTROL.correctionPasscode
  );
  for (const digit of correctionPasscode) {
    await page.click(`#correctionNumpad button[data-correction-pin-key="${digit}"]`);
  }
  // Correct PIN opens an "I Understand" confirm dialog before unlocking.
  await page.waitForSelector("#confirmCorrectionAccessOverlay.open");
  await page.click("#confirmCorrectionAccessBtn");
  await page.waitForSelector("#correctionPanel:not(.hidden)");
  pinFlows.correctionAcceptsCorrect = await page.evaluate(() => ({
    locked: !correctionLockScreen.classList.contains("hidden"),
    panelHidden: correctionPanel.classList.contains("hidden"),
    voidAuditRendered: !!document.getElementById("voidAuditList"),
  }));
  await page.evaluate(() => {
    closeCorrectionTool();
    closeInventory();
  });

  await page.evaluate(() => {
    localStorage.clear();
    state.sales = [];
    invalidateSalesDerivedData();
    state.voidedSales = [];
    state.preorders = [];
    state.inventory = createDefaultInventory();
    state.globalInventory = createDefaultGlobalInventory();
    const sku = PRODUCTS.find((product) => product.sku !== FREE_GIFT_SKU).sku;
    state.globalInventory.global[sku] = 100;
    state.inventory.days.day1.startingStock[sku] = 10;
    PRODUCTS.forEach((product) => {
      state.inventory.days.day1.eventStartConfirmed[product.sku] = true;
    });
    state.sales = [
      {
        id: "SMOKE-UI-VOID-1",
        billId: "SMOKE-UI-VOID-1",
        datetime: new Date().toISOString(),
        timestamp: Date.now(),
        operatingDay: "day1",
        payment: "cash",
        paymentStatus: "confirmed",
        paymentConfirmed: true,
        operator: "Zamm",
        items: [
          {
            sku,
            name: "Smoke UI SKU",
            category: "Smoke",
            qty: 2,
            basePrice: 100,
            discountPerItem: 0,
            discounted: false,
            finalUnitPrice: 100,
            lineSubtotal: 200,
            discountAmount: 0,
            lineDiscount: 0,
            lineTotal: 200,
          },
        ],
        subtotal: 200,
        discount: 0,
        total: 200,
        correctionHistory: [],
      },
    ];
    state.salesRevision += 1;
    realignInventoryCarryForward("day1");
    openCorrectionTool();
    unlockCorrectionTool();
  });
  await page.waitForSelector('[data-correction-bill="SMOKE-UI-VOID-1"]');
  await page.click('[data-correction-bill="SMOKE-UI-VOID-1"]');
  await page.click("#correctionVoidBillBtn");
  await page.fill("#confirmVoidBillReasonInput", "Automated UI void smoke test");
  await page.click("#confirmVoidBillBtn");
  const uiVoidResult = await page.evaluate(() => {
    const sku = PRODUCTS.find((product) => product.sku !== FREE_GIFT_SKU).sku;
    return {
      overlayOpen: confirmVoidBillOverlay.classList.contains("open"),
      salesAfterVoid: state.sales.length,
      voidedCount: state.voidedSales.length,
      voidReason: state.voidedSales[0]?.reason,
      day2AfterVoid: state.inventory.days.day2.startingStock[sku],
      status: correctionStatusText.textContent,
    };
  });

  const result = await page.evaluate(() => {
    function inputFor(sku, field) {
      return Array.from(
        inventoryControlList.querySelectorAll("[data-stock-input-sku]")
      ).find(
        (input) =>
          input.dataset.stockInputSku === sku &&
          input.dataset.stockInputField === field
      );
    }

    function previewFor(sku, kind) {
      const selector =
        kind === "event" ? "[data-event-preview]" : "[data-warehouse-preview]";
      return Array.from(inventoryControlList.querySelectorAll(selector)).find(
        (node) =>
          (kind === "event"
            ? node.dataset.eventPreview
            : node.dataset.warehousePreview) === sku
      );
    }

    localStorage.clear();
    state.sales = [];
    invalidateSalesDerivedData();
    state.voidedSales = [];
    state.preorders = [];
    state.inventory = createDefaultInventory();
    state.globalInventory = createDefaultGlobalInventory();

    const sku = PRODUCTS.find((product) => product.sku !== FREE_GIFT_SKU).sku;
    state.globalInventory.global[sku] = 100;
    state.inventory.days.day1.startingStock[sku] = 10;
    state.inventory.days.day1.addedStock[sku] = 0;
    state.inventory.days.day1.sampleQty[sku] = 0;
    PRODUCTS.forEach((product) => {
      state.inventory.days.day1.eventStartConfirmed[product.sku] = true;
    });

    const sale = {
      id: "SMOKE-VOID-1",
      billId: "SMOKE-VOID-1",
      datetime: new Date().toISOString(),
      timestamp: Date.now(),
      operatingDay: "day1",
      payment: "cash",
      paymentStatus: "confirmed",
      paymentConfirmed: true,
      operator: "Zamm",
      items: [
        {
          sku,
          name: "Smoke SKU",
          category: "Smoke",
          qty: 2,
          basePrice: 100,
          discountPerItem: 0,
          discounted: false,
          finalUnitPrice: 100,
          lineSubtotal: 200,
          discountAmount: 0,
          lineDiscount: 0,
          lineTotal: 200,
        },
      ],
      subtotal: 200,
      discount: 0,
      total: 200,
      correctionHistory: [],
    };

    state.sales = [sale];
    state.salesRevision += 1;
    realignInventoryCarryForward("day1");
    const day2BeforeVoid = state.inventory.days.day2.startingStock[sku];
    state.selectedOperator = "Zamm";
    state.pendingVoidSale = sale;
    confirmVoidBillReasonInput.value = "Automated local smoke test";
    confirmVoidSale();
    const voided = JSON.parse(
      localStorage.getItem("meowseum_event_voided_sales_v1") || "[]"
    );
    renderVoidAuditList();
    const voidAuditText = voidAuditList.textContent;
    const voidAuditCsv = voidAuditToCsv();
    const voidAuditCsvLines = voidAuditCsv.split(/\r\n/);
    const voidResult = {
      day2BeforeVoid,
      day2AfterVoid: state.inventory.days.day2.startingStock[sku],
      salesAfterVoid: state.sales.length,
      voidedCount: voided.length,
      voidReason: voided[0]?.reason,
      voidedBy: voided[0]?.voidedBy,
      voidHistoryType: voided[0]?.saleSnapshot?.correctionHistory?.at(-1)?.type,
      auditRowShowsBillId: voidAuditText.includes("SMOKE-VOID-1"),
      auditRowShowsReason: voidAuditText.includes("Automated local smoke test"),
      auditRowShowsBy: voidAuditText.includes("By Zamm"),
      exportBtnEnabled: !exportVoidAuditBtn.disabled,
      csvHeader: voidAuditCsvLines[0],
      csvRowCount: voidAuditCsvLines.length - 1,
      csvPlainBillId: voidAuditCsvLines[1]?.startsWith("SMOKE-VOID-1,"),
      csvOmitsSnapshot: !voidAuditCsv.includes("saleSnapshot"),
    };

    state.sales = [];
    invalidateSalesDerivedData();
    state.preorders = [];
    state.inventory = createDefaultInventory();
    state.globalInventory = createDefaultGlobalInventory();
    state.globalInventory.global[sku] = 100;
    state.inventory.days.day1.startingStock[sku] = 10;
    state.inventory.days.day1.addedStock[sku] = 0;
    state.inventory.days.day1.sampleQty[sku] = 0;
    PRODUCTS.forEach((product) => {
      state.inventory.days.day1.eventStartConfirmed[product.sku] = true;
    });
    renderInventoryManagement();

    const emptyTableText = inventoryControlList.textContent;
    const firstTopUpInput = inputFor(sku, "addedToday");
    const initialTopUpInput = firstTopUpInput.value;
    firstTopUpInput.value = "5";
    firstTopUpInput.dispatchEvent(new Event("input", { bubbles: true }));
    const previewAfterFive = previewFor(sku, "event").textContent.trim();
    saveGlobalInventorySetup();
    confirmInventoryAdd();
    const storedAfterFive = state.inventory.days.day1.addedStock[sku];
    const inputAfterFive = inputFor(sku, "addedToday").value;

    inputFor(sku, "addedToday").value = "3";
    saveGlobalInventorySetup();
    confirmInventoryAdd();
    const storedAfterEight = state.inventory.days.day1.addedStock[sku];
    const inputAfterThree = inputFor(sku, "addedToday").value;

    state.sales = [
      {
        id: "SMOKE-SOLD-1",
        billId: "SMOKE-SOLD-1",
        operatingDay: "day1",
        datetime: new Date().toISOString(),
        timestamp: Date.now(),
        payment: "cash",
        paymentStatus: "confirmed",
        operator: "Zamm",
        subtotal: 200,
        discount: 0,
        total: 200,
        items: [
          {
            sku,
            name: "Smoke SKU",
            category: "Smoke",
            qty: 2,
            basePrice: 100,
            lineTotal: 200,
          },
        ],
      },
    ];
    invalidateSalesDerivedData();
    state.preorders = [
      {
        id: "SMOKE-PRE-1",
        sku,
        qty: 4,
        status: "pending",
        fulfillmentType: "reserved_send_later",
        operatingDay: "day1",
        productName: "Smoke SKU",
        customerName: "Smoke",
        phone: "1",
        receiveLocation: "Smoke",
        paymentStatus: "paid_now",
      },
    ];
    renderInventoryManagement();
    const midEventText = inventoryControlList.textContent;

    // Reset passcode gate scenario: confirm dialog blocks until 888 is entered.
    requestResetSavedSales();
    const gateInitial = {
      overlayOpen: els.confirmResetSalesOverlay.classList.contains("open"),
      confirmDisabled: els.confirmResetSalesBtn.disabled,
      errorEmpty: !els.resetPasscodeError.textContent,
    };
    handleResetPasscodeInput("9");
    handleResetPasscodeInput("9");
    handleResetPasscodeInput("9");
    const gateWrong = {
      confirmStillDisabled: els.confirmResetSalesBtn.disabled,
      errorShown: !!els.resetPasscodeError.textContent,
      pinClearedAfterReject: state.resetPin === "",
    };
    handleResetPasscodeInput("8");
    handleResetPasscodeInput("8");
    handleResetPasscodeInput("8");
    const gateCorrect = {
      confirmEnabled: !els.confirmResetSalesBtn.disabled,
      errorClearedAfterAccept: !els.resetPasscodeError.textContent,
      confirmButtonVisible: (() => {
        const rect = els.confirmResetSalesBtn.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= window.innerHeight && rect.width > 0 && rect.height > 0;
      })(),
    };
    closeResetSalesConfirmDialog();
    const gateAfterClose = {
      pinReset: state.resetPin === "",
      overlayClosed: !els.confirmResetSalesOverlay.classList.contains("open"),
    };

    // Reset Data scenario: confirm reset clears sales + void audit + inventory but keeps Send Later queue.
    state.voidedSales = [
      {
        billId: "SMOKE-VOID-RESET",
        voidedAt: new Date().toISOString(),
        voidedBy: "Zamm",
        reason: "Reset cleanup test",
        operatingDay: "day1",
        total: 100,
        itemCount: 1,
        saleSnapshot: { billId: "SMOKE-VOID-RESET" },
      },
    ];
    saveVoidedSales();
    state.inventory.days.day1.addedStock[sku] = 99;
    saveInventory();
    saveSales();
    const beforeReset = {
      salesCount: state.sales.length,
      voidedCount: state.voidedSales.length,
      preorderCount: state.preorders.length,
      addedStock: state.inventory.days.day1.addedStock[sku],
      voidedStorageBefore: localStorage.getItem("meowseum_event_voided_sales_v1"),
    };
    resetSavedSales();
    const afterReset = {
      salesCount: state.sales.length,
      voidedCount: state.voidedSales.length,
      preorderCount: state.preorders.length,
      addedStock: state.inventory.days.day1.addedStock[sku],
      voidedStorageAfter: localStorage.getItem("meowseum_event_voided_sales_v1"),
    };

    // Clear Pending Send Later scenario: use in-app passcode dialog, not browser prompt/confirm.
    state.preorders = [
      {
        id: "SMOKE-PENDING-CLEAR",
        sku,
        qty: 1,
        productName: "Smoke Pending",
        customerName: "Pending customer",
        status: "pending",
        fulfillmentType: "reserved_send_later",
        createdAt: new Date().toISOString(),
        operatingDay: "day1",
      },
      {
        id: "SMOKE-PACKED-KEEP",
        sku,
        qty: 1,
        productName: "Smoke Packed",
        customerName: "Packed customer",
        status: "packed",
        fulfillmentType: "reserved_send_later",
        createdAt: new Date().toISOString(),
        operatingDay: "day1",
      },
    ].map((entry, index) => normalizePreorder(entry, index));
    savePreorders();
    renderPreorders();
    openClearPendingSendLaterDialog();
    const clearPendingInitial = {
      overlayOpen: els.confirmClearPendingOverlay.classList.contains("open"),
      confirmDisabled: els.confirmClearPendingBtn.disabled,
      message: els.confirmClearPendingMessage.textContent,
    };
    handleClearPendingInput("9");
    handleClearPendingInput("9");
    handleClearPendingInput("9");
    const clearPendingWrong = {
      confirmStillDisabled: els.confirmClearPendingBtn.disabled,
      errorShown: !!els.clearPendingError.textContent,
      pinClearedAfterReject: state.clearPendingPin === "",
      pendingStillPresent: state.preorders.some((entry) => entry.id === "SMOKE-PENDING-CLEAR"),
    };
    handleClearPendingInput("8");
    handleClearPendingInput("8");
    handleClearPendingInput("8");
    clearPendingSendLaterOrders();
    const clearPendingAfter = {
      overlayClosed: !els.confirmClearPendingOverlay.classList.contains("open"),
      pendingRemoved: !state.preorders.some((entry) => entry.id === "SMOKE-PENDING-CLEAR"),
      packedKept: state.preorders.some((entry) => entry.id === "SMOKE-PACKED-KEEP"),
      storageKeptPacked: JSON.parse(localStorage.getItem("meowseum_event_preorders_v1") || "[]").some((entry) => entry.id === "SMOKE-PACKED-KEEP"),
    };

    return {
      sku,
      ...voidResult,
      initialTopUpInput,
      noIdleNoise:
        !emptyTableText.includes("No committed send later") &&
        !emptyTableText.includes("Sold 0"),
      hasTopUpLabel: emptyTableText.includes("Top up now"),
      previewAfterFive,
      storedAfterFive,
      inputAfterFive,
      storedAfterEight,
      inputAfterThree,
      showsSold: midEventText.includes("Sold 2"),
      showsCommitted: midEventText.includes("4 committed"),
      resetClearedSales: beforeReset.salesCount > 0 && afterReset.salesCount === 0,
      resetClearedVoidAudit: beforeReset.voidedCount > 0 && afterReset.voidedCount === 0,
      resetClearedVoidStorage: beforeReset.voidedStorageBefore !== null && afterReset.voidedStorageAfter === null,
      resetClearedAddedStock: beforeReset.addedStock > 0 && afterReset.addedStock === 0,
      resetKeptPreorders: afterReset.preorderCount === beforeReset.preorderCount && afterReset.preorderCount > 0,
      resetGateInitialClosed: gateInitial.overlayOpen && gateInitial.confirmDisabled && gateInitial.errorEmpty,
      resetGateRejectsWrong: gateWrong.confirmStillDisabled && gateWrong.errorShown && gateWrong.pinClearedAfterReject,
      resetGateAcceptsCorrect: gateCorrect.confirmEnabled && gateCorrect.errorClearedAfterAccept,
      resetGateConfirmVisible: gateCorrect.confirmButtonVisible,
      resetGateClosedClearsPin: gateAfterClose.pinReset && gateAfterClose.overlayClosed,
      clearPendingDialogOpens: clearPendingInitial.overlayOpen && clearPendingInitial.confirmDisabled && clearPendingInitial.message.includes("1 pending"),
      clearPendingRejectsWrong: clearPendingWrong.confirmStillDisabled && clearPendingWrong.errorShown && clearPendingWrong.pinClearedAfterReject && clearPendingWrong.pendingStillPresent,
      clearPendingClearsPendingOnly: clearPendingAfter.overlayClosed && clearPendingAfter.pendingRemoved && clearPendingAfter.packedKept && clearPendingAfter.storageKeptPacked,
    };
  });

  assert(pageErrors.length === 0, "Page errors were reported", pageErrors);
  assert(browserDialogs.length === 0, "Browser alert/prompt/confirm dialogs should not appear in smoke flows", browserDialogs);
  assert(!uiVoidResult.overlayOpen, "Void confirmation dialog stayed open after UI click", uiVoidResult);
  assert(uiVoidResult.salesAfterVoid === 0, "UI Void Bill click did not remove the sale", uiVoidResult);
  assert(uiVoidResult.voidedCount === 1, "UI Void Bill click did not store audit entry", uiVoidResult);
  assert(
    uiVoidResult.voidReason === "Automated UI void smoke test",
    "UI Void Bill click stored the wrong reason",
    uiVoidResult
  );
  assert(uiVoidResult.day2AfterVoid === 10, "UI Void Bill click did not realign carry-forward", uiVoidResult);
  assert(result.day2BeforeVoid === 8, "Void setup did not reduce Day 2 stock", result);
  assert(result.day2AfterVoid === 10, "Void did not restore Day 2 stock", result);
  assert(result.salesAfterVoid === 0, "Voided sale was not removed", result);
  assert(result.voidedCount === 1, "Void audit was not stored", result);
  assert(
    result.voidReason === "Automated local smoke test" &&
      result.voidedBy === "Zamm" &&
      result.voidHistoryType === "void",
    "Void audit details are incomplete",
    result
  );
  assert(result.auditRowShowsBillId, "Void audit row missing bill id", result);
  assert(result.auditRowShowsReason, "Void audit row missing reason", result);
  assert(result.auditRowShowsBy, "Void audit row missing operator", result);
  assert(result.exportBtnEnabled, "Export Void Audit button stayed disabled with audit data", result);
  assert(
    result.csvHeader === "bill_id,voided_at,voided_by,operating_day,total_thb,item_count,reason",
    "Void audit CSV header is unexpected",
    result
  );
  assert(result.csvRowCount === 1, "Void audit CSV row count mismatch", result);
  assert(result.csvPlainBillId, "Void audit CSV bill id should export as protected text, not an Excel formula cell", result);
  assert(result.csvOmitsSnapshot, "Void audit CSV must not include saleSnapshot", result);
  assert(result.initialTopUpInput === "0", "Top-up input did not start at 0", result);
  assert(result.noIdleNoise, "Idle stock setup helper text is noisy", result);
  assert(result.hasTopUpLabel, "Top-up visual label is missing", result);
  assert(result.previewAfterFive === "15", "Top-up preview did not include delta", result);
  assert(result.storedAfterFive === 5, "First top-up was not stored", result);
  assert(result.inputAfterFive === "0", "Top-up input did not reset after first save", result);
  assert(result.storedAfterEight === 8, "Second top-up did not accumulate", result);
  assert(result.inputAfterThree === "0", "Top-up input did not reset after second save", result);
  assert(result.showsSold, "Nonzero sold detail is hidden", result);
  assert(result.showsCommitted, "Nonzero committed detail is hidden", result);
  assert(result.resetClearedSales, "Reset Data did not clear saved sales", result);
  assert(result.resetClearedVoidAudit, "Reset Data did not clear void audit log", result);
  assert(result.resetClearedVoidStorage, "Reset Data did not remove void audit storage key", result);
  assert(result.resetClearedAddedStock, "Reset Data did not reset per-day inventory", result);
  assert(result.resetKeptPreorders, "Reset Data must keep Send Later queue intact", result);
  assert(result.resetGateInitialClosed, "Reset confirm overlay must open with confirm button disabled and no error", result);
  assert(result.resetGateRejectsWrong, "Wrong reset passcode must keep confirm disabled, show in-app error, and clear PIN", result);
  assert(result.resetGateAcceptsCorrect, "Correct reset passcode must enable confirm button and clear error", result);
  assert(result.resetGateConfirmVisible, "Reset confirm button must stay visible after correct passcode entry", result);
  assert(result.resetGateClosedClearsPin, "Closing reset overlay must clear PIN and hide overlay", result);
  assert(result.clearPendingDialogOpens, "Clear Pending must open an in-app disabled passcode dialog", result);
  assert(result.clearPendingRejectsWrong, "Wrong Clear Pending passcode must show in-app error and keep pending orders", result);
  assert(result.clearPendingClearsPendingOnly, "Correct Clear Pending passcode must remove pending orders only", result);

  // Batch S - app dialogs must close before their parent panels on Escape.
  const appDialogStackFlow = await page.evaluate(() => {
    closeLoginOverlay();
    openPreorderPanel();
    showAppNotice("Smoke notice", { title: "Smoke notice" });
    const noticeOnTop = appNoticeOverlay.contains(
      document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)
    );
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    const noticeResult = {
      noticeOnTop,
      noticeClosed: !appNoticeOverlay.classList.contains("open"),
      parentStayedOpen: preorderOverlay.classList.contains("open"),
    };
    closePreorderPanel();

    openInventoryView();
    openAppPrompt({ title: "Smoke prompt", message: "Testing dialog stack" });
    const promptOnTop = appPromptOverlay.contains(
      document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)
    );
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    const promptResult = {
      promptOnTop,
      promptClosed: !appPromptOverlay.classList.contains("open"),
      parentStayedOpen: inventoryViewOverlay.classList.contains("open"),
    };
    closeInventoryView();

    return { noticeResult, promptResult };
  });

  assert(
    appDialogStackFlow.noticeResult.noticeOnTop &&
      appDialogStackFlow.noticeResult.noticeClosed &&
      appDialogStackFlow.noticeResult.parentStayedOpen,
    "App notice must render above its parent panel and Escape must close only the notice",
    appDialogStackFlow
  );
  assert(
    appDialogStackFlow.promptResult.promptOnTop &&
      appDialogStackFlow.promptResult.promptClosed &&
      appDialogStackFlow.promptResult.parentStayedOpen,
    "App prompt must render above its parent panel and Escape must close only the prompt",
    appDialogStackFlow
  );

  // Batch X - Inventory Flow sample visibility + table readability.
  const inventorySampleFlow = await page.evaluate(() => {
    localStorage.clear();
    state.sales = [];
    invalidateSalesDerivedData();
    state.voidedSales = [];
    state.preorders = [];
    state.cart = [];
    state.inventory = createDefaultInventory();
    state.globalInventory = createDefaultGlobalInventory();
    state.selectedOperator = "Zamm";

    const product = PRODUCTS.find((item) => item.sku !== FREE_GIFT_SKU);
    const sku = product.sku;
    PRODUCTS.forEach((item) => {
      state.inventory.days.day1.eventStartConfirmed[item.sku] = true;
    });
    state.inventory.currentDay = "day1";
    state.inventory.viewDay = "day1";
    state.inventory.days.day1.startingStock[sku] = 10;
    state.inventory.days.day1.addedStock[sku] = 2;
    state.inventory.days.day1.sampleQty[sku] = 1;
    state.sales = [
      {
        id: "SMOKE-SAMPLE-1",
        billId: "SMOKE-SAMPLE-1",
        operatingDay: "day1",
        datetime: new Date().toISOString(),
        timestamp: Date.now(),
        payment: "cash",
        paymentStatus: "confirmed",
        operator: "Zamm",
        subtotal: 300,
        discount: 0,
        total: 300,
        items: [
          {
            sku,
            name: productNameLabel(product),
            category: product.category,
            qty: 3,
            basePrice: 100,
            lineTotal: 300,
          },
        ],
      },
    ];
    invalidateSalesDerivedData();
    renderInventoryView();

    const rowBefore = Array.from(inventoryViewTableBody.querySelectorAll("tr")).find((row) =>
      row.textContent.includes(sku)
    );
    const addedCellBefore = rowBefore?.children[2];
    const remainingBefore = getProductInventorySnapshot("day1", sku).remaining;
    const addedSummaryText = inventoryViewAddedTotal.textContent;
    const remainingCellBefore = rowBefore?.querySelector(".inventory-remaining");

    state.pendingInventoryCorrection = {
      sku,
      productName: productNameLabel(product),
      field: "sampleQty",
      before: 1,
      after: 0,
      reason: "Smoke sample returned to event stock",
      dayId: "day1",
      at: new Date().toISOString(),
      warehouseAfter: 0,
    };
    confirmInventoryCorrection();

    const rowAfter = Array.from(inventoryViewTableBody.querySelectorAll("tr")).find((row) =>
      row.textContent.includes(sku)
    );
    const remainingAfter = getProductInventorySnapshot("day1", sku).remaining;

    return {
      addedSummaryText,
      summaryHasSplit: inventoryViewAddedTotal.classList.contains("split"),
      summaryShowsAddedTwo: addedSummaryText.includes("Added") && addedSummaryText.includes("2"),
      summaryShowsSampleOne: addedSummaryText.includes("Sample") && addedSummaryText.includes("-1"),
      rowShowsSampleChip: !!addedCellBefore?.querySelector(".inventory-sample-chip") &&
        addedCellBefore.textContent.includes("-1 sample"),
      addedValueHighlighted: !!addedCellBefore?.querySelector(".inventory-added-value.inventory-table-number"),
      remainingValueHighlighted: !!remainingCellBefore?.classList.contains("inventory-table-number"),
      remainingBefore,
      sampleAfterCorrection: state.inventory.days.day1.sampleQty[sku],
      rowChipGoneAfterCorrection: !rowAfter?.querySelector(".inventory-sample-chip"),
      remainingAfter,
      summaryAfterCorrection: inventoryViewAddedTotal.textContent,
    };
  });

  assert(inventorySampleFlow.summaryHasSplit, "Inventory Flow Added Stock KPI must render as a split Added/Sample card", inventorySampleFlow);
  assert(inventorySampleFlow.summaryShowsAddedTwo, "Inventory Flow Added Stock KPI must keep the added total visible", inventorySampleFlow);
  assert(inventorySampleFlow.summaryShowsSampleOne, "Inventory Flow Added Stock KPI must show Sample -1", inventorySampleFlow);
  assert(inventorySampleFlow.rowShowsSampleChip, "Inventory Flow row must show -1 sample for the sampled SKU", inventorySampleFlow);
  assert(inventorySampleFlow.addedValueHighlighted, "Inventory Flow Added Stock table value must use the highlighted numeric styling", inventorySampleFlow);
  assert(inventorySampleFlow.remainingValueHighlighted, "Inventory Flow Remaining Stock table value must use the highlighted numeric styling", inventorySampleFlow);
  assert(inventorySampleFlow.remainingBefore === 8, "Sample stock must stay deducted from remaining event stock", inventorySampleFlow);
  assert(inventorySampleFlow.sampleAfterCorrection === 0, "Inventory Correction must save sample quantity back to 0", inventorySampleFlow);
  assert(inventorySampleFlow.rowChipGoneAfterCorrection, "Inventory Flow row sample chip must disappear after sample quantity returns to 0", inventorySampleFlow);
  assert(inventorySampleFlow.remainingAfter === 9, "Returning sample stock to 0 must increase remaining event stock by 1", inventorySampleFlow);
  assert(inventorySampleFlow.summaryAfterCorrection.includes("-0"), "Inventory Flow sample summary must show a quiet -0 state after correction", inventorySampleFlow);

  // PIN-gated workflow assertions.
  assert(pinFlows.loginAutoOpen, "Login overlay must auto-open on fresh init when no operator is persisted", pinFlows);
  assert(
    pinFlows.loginRejectsWrong.stillOpen &&
      pinFlows.loginRejectsWrong.errorShown &&
      pinFlows.loginRejectsWrong.pinCleared,
    "Wrong operator PIN must keep login overlay open, show an error, and clear the entered PIN",
    pinFlows.loginRejectsWrong
  );
  assert(
    pinFlows.loginAcceptsCorrect.closed && pinFlows.loginAcceptsCorrect.selected === "Zamm",
    "Correct operator PIN must close login overlay and persist the selected operator",
    pinFlows.loginAcceptsCorrect
  );
  assert(
    pinFlows.dashboardRejectsWrong.locked &&
      pinFlows.dashboardRejectsWrong.panelHidden &&
      pinFlows.dashboardRejectsWrong.errorShown &&
      pinFlows.dashboardRejectsWrong.pinCleared,
    "Wrong dashboard PIN must keep lock screen visible, hide panel, show error, and clear PIN",
    pinFlows.dashboardRejectsWrong
  );
  assert(
    !pinFlows.dashboardAcceptsCorrect.locked &&
      !pinFlows.dashboardAcceptsCorrect.panelHidden &&
      pinFlows.dashboardAcceptsCorrect.totalText.includes("THB") &&
      pinFlows.dashboardAcceptsCorrect.goalScaleText.includes("THB") &&
      pinFlows.dashboardAcceptsCorrect.paceText.includes("/day") &&
      !pinFlows.dashboardAcceptsCorrect.dashboardText.includes("NaN") &&
      pinFlows.dashboardAcceptsCorrect.paySplitRendered,
    "Correct dashboard PIN must reveal the redesigned panel with THB total, goal pace, and payment split",
    pinFlows.dashboardAcceptsCorrect
  );
  assert(
    pinFlows.dashboardAcceptsCorrect.timelineSteps === 4 &&
      pinFlows.dashboardAcceptsCorrect.timelineCells === 4,
    "V3 4-day timeline must render exactly 4 day steps and 4 day cells",
    pinFlows.dashboardAcceptsCorrect
  );
  assert(
    pinFlows.dashboardAcceptsCorrect.hourBucketCount === 13 &&
      pinFlows.dashboardAcceptsCorrect.hourEmptyNote === "No sales yet" &&
      !pinFlows.dashboardAcceptsCorrect.hourChartText.includes("NaN"),
    "Today By Hour must render 13 empty buckets cleanly with no NaN",
    pinFlows.dashboardAcceptsCorrect
  );
  assert(
    pinFlows.dashboardAcceptsCorrect.topSellersEmptyState,
    "V3 top sellers card must show empty state when there are no paid sales",
    pinFlows.dashboardAcceptsCorrect
  );
  assert(
    pinFlows.dashboardAcceptsCorrect.lowStockEmptyState,
    "V3 low stock card must show empty state when no SKU is at or below its threshold",
    pinFlows.dashboardAcceptsCorrect
  );
  assert(
    pinFlows.dashboardAcceptsCorrect.lowStockTitleHasDay,
    "V3 low stock title must include the active day label",
    pinFlows.dashboardAcceptsCorrect
  );
  assert(
    pinFlows.inventoryRejectsWrong.locked &&
      pinFlows.inventoryRejectsWrong.panelHidden &&
      pinFlows.inventoryRejectsWrong.errorShown &&
      pinFlows.inventoryRejectsWrong.pinCleared,
    "Wrong inventory PIN must keep lock screen visible, hide panel, show error, and clear PIN",
    pinFlows.inventoryRejectsWrong
  );
  assert(
    !pinFlows.inventoryAcceptsCorrect.locked &&
      !pinFlows.inventoryAcceptsCorrect.panelHidden &&
      pinFlows.inventoryAcceptsCorrect.setupVisible,
    "Correct inventory PIN must reveal the inventory panel with stock setup list",
    pinFlows.inventoryAcceptsCorrect
  );
  assert(
    pinFlows.correctionRejectsWrong.locked &&
      pinFlows.correctionRejectsWrong.panelHidden &&
      pinFlows.correctionRejectsWrong.errorShown &&
      pinFlows.correctionRejectsWrong.pinCleared,
    "Wrong correction PIN must keep lock screen visible, hide panel, show error, and clear PIN",
    pinFlows.correctionRejectsWrong
  );
  assert(
    !pinFlows.correctionAcceptsCorrect.locked &&
      !pinFlows.correctionAcceptsCorrect.panelHidden &&
      pinFlows.correctionAcceptsCorrect.voidAuditRendered,
    "Correct correction PIN must reveal the correction panel with void audit list",
    pinFlows.correctionAcceptsCorrect
  );

  // Batch R — Manual Event Start Count.
  // Fresh inventory must not auto-confirm Event Start, addToCart must block
  // until staff count, and saving an Event Start through the setup form must
  // both confirm the SKU and unblock selling.
  const eventStartFlow = await page.evaluate(() => {
    function inputFor(sku, field) {
      return Array.from(
        inventoryControlList.querySelectorAll("[data-stock-input-sku]")
      ).find(
        (input) =>
          input.dataset.stockInputSku === sku &&
          input.dataset.stockInputField === field
      );
    }

    localStorage.clear();
    state.sales = [];
    invalidateSalesDerivedData();
    state.voidedSales = [];
    state.preorders = [];
    state.cart = [];
    state.inventory = createDefaultInventory();
    state.globalInventory = createDefaultGlobalInventory();
    state.selectedOperator = "Zamm";

    const sku = PRODUCTS.find((product) => product.sku !== FREE_GIFT_SKU).sku;
    state.globalInventory.global[sku] = 100;
    state.globalInventory.onlineAllocated[sku] = 0;
    state.globalInventory.eventAllocated[sku] = 0;
    const day1 = state.inventory.days.day1;
    const noneConfirmed = PRODUCTS.every(
      (product) => day1.eventStartConfirmed[product.sku] === false
    );
    const helperBefore = isEventStartConfirmed(sku);

    renderInventoryManagement();
    const setupRowText = inventoryControlList.textContent;
    const inputBefore = inputFor(sku, "eventStarting");
    const inputUnconfirmed = inputBefore.classList.contains("is-unconfirmed");
    const inputEmpty = inputBefore.value === "";
    const placeholderShown = inputBefore.placeholder === "count";

    addToCart(sku);
    const cartBlocked =
      state.cart.length === 0 &&
      cartStockToast.textContent.includes("event start has not been counted");

    // Product-card UI path: unconfirmed cards must look like "Count" not
    // "Sold out", must stay clickable, and clicking must surface the toast.
    state.cart = [];
    cartStockToast.textContent = "";
    renderProducts();
    const cardEl = productGrid.querySelector(`[data-sku="${sku}"]`);
    const cardExists = !!cardEl;
    const cardBlockedAttr = cardEl?.dataset.blocked;
    const cardUnconfirmedAttr = cardEl?.dataset.eventStartUnconfirmed;
    const cardHasUncountedClass = cardEl?.classList.contains("is-uncounted");
    const cardChipText = cardEl?.querySelector(".product-stock")?.textContent.trim();
    const cardChipTitle = cardEl?.querySelector(".product-stock")?.getAttribute("title");
    cardEl?.click();
    const clickToastShown = cartStockToast.textContent.includes(
      "event start has not been counted"
    );
    const cartStillEmpty = state.cart.length === 0;

    inputFor(sku, "eventStarting").value = "12";
    saveGlobalInventorySetup();
    confirmInventoryAdd();

    const confirmedAfterSave = isEventStartConfirmed(sku);
    const startingAfterSave = day1.startingStock[sku];

    state.cart = [];
    addToCart(sku);
    const cartUnblocked = state.cart.length === 1 && state.cart[0].sku === sku;

    return {
      noneConfirmed,
      helperBefore,
      inputUnconfirmed,
      inputEmpty,
      placeholderShown,
      hasCountNeededHint: setupRowText.includes("Count needed"),
      hasNotCountedWarning: setupRowText.includes("Not counted"),
      cartBlocked,
      cardExists,
      cardBlockedAttr,
      cardUnconfirmedAttr,
      cardHasUncountedClass,
      cardChipText,
      cardChipTitle,
      clickToastShown,
      cartStillEmpty,
      confirmedAfterSave,
      startingAfterSave,
      cartUnblocked,
    };
  });

  assert(eventStartFlow.noneConfirmed, "Fresh inventory must default eventStartConfirmed to false for every SKU", eventStartFlow);
  assert(eventStartFlow.helperBefore === false, "isEventStartConfirmed must return false on a fresh day before any save", eventStartFlow);
  assert(eventStartFlow.inputUnconfirmed, "Unconfirmed Event Start input must render with the .is-unconfirmed class", eventStartFlow);
  assert(eventStartFlow.inputEmpty, "Unconfirmed Event Start input must render empty (no value attr)", eventStartFlow);
  assert(eventStartFlow.placeholderShown, "Unconfirmed Event Start input must show the 'count' placeholder", eventStartFlow);
  assert(eventStartFlow.hasCountNeededHint, "Setup row must show 'Count needed' hint for unconfirmed Event Start", eventStartFlow);
  assert(eventStartFlow.hasNotCountedWarning, "Remaining Event cell must warn 'Not counted' for unconfirmed Event Start", eventStartFlow);
  assert(eventStartFlow.cartBlocked, "addToCart must block adds and surface a stock notice when Event Start is unconfirmed", eventStartFlow);
  assert(eventStartFlow.cardExists, "Product card must render for an unconfirmed SKU", eventStartFlow);
  assert(eventStartFlow.cardBlockedAttr === "false", "Unconfirmed card must remain clickable (data-blocked='false') so the click handler can surface the toast", eventStartFlow);
  assert(eventStartFlow.cardUnconfirmedAttr === "true", "Unconfirmed card must expose data-event-start-unconfirmed='true'", eventStartFlow);
  assert(eventStartFlow.cardHasUncountedClass, "Unconfirmed card must carry the .is-uncounted visual hook", eventStartFlow);
  assert(eventStartFlow.cardChipText === "Count", "Unconfirmed card stock chip must read 'Count', not 'Sold out'", eventStartFlow);
  assert(typeof eventStartFlow.cardChipTitle === "string" && eventStartFlow.cardChipTitle.includes("Event Start not counted"), "Unconfirmed card stock chip title must explain the Event Start state", eventStartFlow);
  assert(eventStartFlow.clickToastShown, "Clicking an unconfirmed product card must surface the 'event start has not been counted' toast", eventStartFlow);
  assert(eventStartFlow.cartStillEmpty, "Clicking an unconfirmed product card must not add it to the cart", eventStartFlow);
  assert(eventStartFlow.confirmedAfterSave, "Saving an Event Start through Stock & Allocation Setup must confirm the SKU", eventStartFlow);
  assert(eventStartFlow.startingAfterSave === 12, "Saved Event Start value must be persisted on the day record", eventStartFlow);
  assert(eventStartFlow.cartUnblocked, "addToCart must succeed once Event Start is confirmed for the SKU", eventStartFlow);

  // Batch V — populated V3 dashboard scenario.
  // Seed paid sales across two SKUs and a cash/transfer/card mix; drop one
  // SKU's remaining stock below its threshold so the Low Stock card has work
  // to do. Assert top-seller bars, low-stock pills, day cells, and no NaN.
  const v3DashboardFlow = await page.evaluate(() => {
    localStorage.clear();
    state.sales = [];
    invalidateSalesDerivedData();
    state.voidedSales = [];
    state.preorders = [];
    state.cart = [];
    state.inventory = createDefaultInventory();
    state.globalInventory = createDefaultGlobalInventory();
    state.selectedOperator = "Zamm";

    const paidProducts = PRODUCTS.filter((p) => p.sku !== FREE_GIFT_SKU).slice(0, 2);
    const skuA = paidProducts[0].sku;
    const skuB = paidProducts[1].sku;
    PRODUCTS.forEach((p) => {
      state.inventory.days.day1.eventStartConfirmed[p.sku] = true;
      state.inventory.days.day1.startingStock[p.sku] = 50;
      state.globalInventory.global[p.sku] = 200;
    });
    state.inventory.thresholds[skuA] = 30;
    state.inventory.thresholds[skuB] = 5;

    const makeTodayAt = (hour, minute = 0) => {
      const date = new Date();
      date.setHours(hour, minute, 0, 0);
      return date.toISOString();
    };
    const baseSale = (id, sku, qty, payment, lineTotal, datetime) => ({
      id,
      billId: id,
      datetime,
      timestamp: new Date(datetime).getTime(),
      operatingDay: "day1",
      payment,
      paymentStatus: "confirmed",
      paymentConfirmed: true,
      operator: "Zamm",
      items: [
        {
          sku,
          name: "V3 SKU",
          category: "V3",
          qty,
          basePrice: lineTotal / qty,
          discountPerItem: 0,
          discounted: false,
          finalUnitPrice: lineTotal / qty,
          lineSubtotal: lineTotal,
          discountAmount: 0,
          lineDiscount: 0,
          lineTotal,
        },
      ],
      subtotal: lineTotal,
      discount: 0,
      total: lineTotal,
      correctionHistory: [],
    });

    state.sales = [
      baseSale("V3-CASH-1", skuA, 25, "cash", 12500, makeTodayAt(9, 30)),
      baseSale("V3-CASH-10", skuB, 1, "cash", 100, makeTodayAt(10, 0)),
      baseSale("V3-TRANSFER-1", skuB, 6, "transfer", 4800, makeTodayAt(15, 0)),
      baseSale("V3-CASH-20", skuB, 1, "cash", 100, makeTodayAt(20, 59)),
      baseSale("V3-CARD-1", skuA, 1, "card", 500, makeTodayAt(21, 15)),
    ];
    state.salesRevision += 1;
    invalidateSalesDerivedData();
    renderDashboard();

    const dashText = dashboardPanel.textContent;
    const topRows = dashboardTopSellers.querySelectorAll(".v3-bar-row");
    const lowRows = dashboardLowStock.querySelectorAll(".v3-low-row");
    const firstTopMeta = topRows[0]?.querySelector(".v3-bar-meta strong")?.textContent || "";
    const lowSkuList = Array.from(lowRows).map(
      (row) => row.querySelector(".v3-low-name")?.title?.split(" · ")[1] || ""
    );
    const liveCells = dashboardTimelineRows.querySelectorAll(".v3-timeline-cell.is-live").length;
    const paySplitText = dashboardPaySplitTiles.textContent;
    const hourBuckets = Object.fromEntries(
      Array.from(dashboardHourChart.querySelectorAll(".v3-hour-bucket")).map((bucket) => [
        bucket.dataset.hourBucket,
        {
          total: Number(bucket.dataset.hourTotal || 0),
          receipts: Number(bucket.dataset.hourReceipts || 0),
          isPeak: bucket.classList.contains("is-peak"),
          text: bucket.textContent,
        },
      ])
    );

    return {
      skuA,
      skuB,
      hasNoNaN: !dashText.includes("NaN"),
      topRowsCount: topRows.length,
      firstTopName: topRows[0]?.querySelector(".v3-bar-name")?.textContent || "",
      firstTopMetaContainsQty: firstTopMeta.includes("26 sold"),
      firstTopMetaContainsRevenue: firstTopMeta.includes("THB"),
      lowRowsCount: lowRows.length,
      lowIncludesSkuA: lowSkuList.includes(skuA),
      lowExcludesSkuB: !lowSkuList.includes(skuB),
      liveCellCount: liveCells,
      paySplitMentionsThreeMethods:
        paySplitText.includes("Cash") &&
        paySplitText.includes("Transfer") &&
        paySplitText.includes("Card"),
      hourBucketCount: Object.keys(hourBuckets).length,
      hourPeakNote: dashboardHourPeakNote.textContent,
      before10Total: hourBuckets.before10?.total,
      before10IsPeak: hourBuckets.before10?.isPeak,
      hour10Total: hourBuckets["10"]?.total,
      hour15Total: hourBuckets["15"]?.total,
      hour20Total: hourBuckets["20"]?.total,
      after21Total: hourBuckets.after21?.total,
      after21Receipts: hourBuckets.after21?.receipts,
    };
  });

  assert(v3DashboardFlow.hasNoNaN, "Populated V3 dashboard must not contain NaN anywhere", v3DashboardFlow);
  assert(v3DashboardFlow.topRowsCount >= 1 && v3DashboardFlow.topRowsCount <= 5, "Top sellers must render between 1 and 5 bar rows when paid sales exist", v3DashboardFlow);
  assert(v3DashboardFlow.firstTopMetaContainsQty, "First top-seller row must reflect aggregated paid quantity (skuA = 25 + 1 = 26 sold)", v3DashboardFlow);
  assert(v3DashboardFlow.firstTopMetaContainsRevenue, "Top-seller row must show revenue in THB", v3DashboardFlow);
  assert(v3DashboardFlow.lowRowsCount >= 1, "Low Stock card must render at least one row when a SKU is at or below its threshold", v3DashboardFlow);
  assert(v3DashboardFlow.lowIncludesSkuA, "Low Stock card must list skuA (50 starting - 26 sold = 24 remaining, threshold 30, so isLow=true)", v3DashboardFlow);
  assert(v3DashboardFlow.lowExcludesSkuB, "Low Stock card must exclude skuB (50 starting - 6 sold = 44 remaining, threshold 5, well above)", v3DashboardFlow);
  assert(v3DashboardFlow.liveCellCount === 1, "Exactly one V3 timeline cell must be marked live (the active day)", v3DashboardFlow);
  assert(v3DashboardFlow.paySplitMentionsThreeMethods, "Payment split must mention Cash, Transfer, and Card after a populated mix", v3DashboardFlow);
  assert(v3DashboardFlow.hourBucketCount === 13, "Today By Hour must render the full <10, 10-20, >21 bucket set", v3DashboardFlow);
  assert(v3DashboardFlow.before10Total === 12500 && v3DashboardFlow.before10IsPeak, "Before-10 sales must land in the <10 bucket and highlight as peak when largest", v3DashboardFlow);
  assert(v3DashboardFlow.hour10Total === 100, "10:00 sale must land in the 10 bucket", v3DashboardFlow);
  assert(v3DashboardFlow.hour15Total === 4800, "15:00 sale must land in the 15 bucket", v3DashboardFlow);
  assert(v3DashboardFlow.hour20Total === 100, "20:59 sale must land in the 20 bucket", v3DashboardFlow);
  assert(v3DashboardFlow.after21Total === 500 && v3DashboardFlow.after21Receipts === 1, "21:00+ sale must land in the >21 bucket", v3DashboardFlow);
  assert(v3DashboardFlow.hourPeakNote.includes("peak THB 12.5k @ <10"), "Today By Hour peak note must match the highlighted bucket", v3DashboardFlow);

  await browser.close();
  console.log(`local smoke passed for ${path.basename(appPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
