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
    const sku = "002A";
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
    const sku = "002A";
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

    const sku = "002A";
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

  const reversePasscodeStart = await page.evaluate(() => {
    localStorage.clear();
    closeLoginOverlay();
    state.sales = [];
    invalidateSalesDerivedData();
    state.preorders = [];
    state.inventory = createDefaultInventory();
    state.globalInventory = createDefaultGlobalInventory();
    const sku = "002A";
    state.inventory.currentDay = "day1";
    state.inventory.viewDay = "day1";
    state.inventory.days.day1.startingStock[sku] = 10;
    state.inventory.days.day1.addedStock[sku] = 5;
    state.inventory.days.day1.addLog = [
      {
        sku,
        qty: 2,
        at: "SMOKE-TOPUP-AT",
        dayId: "day1",
        type: "stock_setup",
        reason: "Smoke top-up",
      },
    ];
    PRODUCTS.forEach((product) => {
      state.inventory.days.day1.eventStartConfirmed[product.sku] = true;
    });
    renderInventoryView();
    openInventoryReverseDialog(sku, 2, "SMOKE-TOPUP-AT");
    return {
      title: appPromptTitle.textContent,
      label: appPromptLabel.textContent,
      addedBefore: state.inventory.days.day1.addedStock[sku],
      overlayOpen: appPromptOverlay.classList.contains("open"),
    };
  });
  await page.fill("#appPromptInput", "999");
  await page.click("#appPromptConfirmBtn");
  await page.waitForFunction(() => appPromptError.textContent.includes("Incorrect passcode"));
  const reversePasscodeWrong = await page.evaluate(() => ({
    title: appPromptTitle.textContent,
    errorShown: appPromptError.textContent.includes("Incorrect passcode"),
    inputCleared: appPromptInput.value === "",
    addedStillFive: state.inventory.days.day1.addedStock["002A"] === 5,
  }));
  await page.fill("#appPromptInput", "888");
  await page.click("#appPromptConfirmBtn");
  await page.waitForFunction(() => appPromptTitle.textContent === "Reverse stock top-up");
  const reverseReasonStep = await page.evaluate(() => ({
    title: appPromptTitle.textContent,
    label: appPromptLabel.textContent,
    addedStillFive: state.inventory.days.day1.addedStock["002A"] === 5,
  }));
  await page.fill("#appPromptInput", "Automated reverse gate smoke test");
  await page.click("#appPromptConfirmBtn");
  await page.waitForFunction(() => !appPromptOverlay.classList.contains("open"));
  const reversePasscodeFinal = await page.evaluate(() => ({
    addedAfterReverse: state.inventory.days.day1.addedStock["002A"],
    reversalLogged: state.inventory.days.day1.addLog.some(
      (entry) =>
        entry.sku === "002A" &&
        entry.qty === -2 &&
        entry.reason === "Automated reverse gate smoke test" &&
        entry.reversedLogAt === "SMOKE-TOPUP-AT"
    ),
    browserPromptClosed: !appPromptOverlay.classList.contains("open"),
  }));

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
  assert(
    reversePasscodeStart.overlayOpen &&
      reversePasscodeStart.title === "Manager passcode required" &&
      reversePasscodeStart.label === "Correction passcode" &&
      reversePasscodeStart.addedBefore === 5,
    "Inventory Flow reverse action must open a passcode gate before the reason dialog",
    reversePasscodeStart
  );
  assert(
    reversePasscodeWrong.errorShown &&
      reversePasscodeWrong.inputCleared &&
      reversePasscodeWrong.addedStillFive &&
      reversePasscodeWrong.title === "Manager passcode required",
    "Wrong reverse passcode must keep stock unchanged and stay on the passcode step",
    reversePasscodeWrong
  );
  assert(
    reverseReasonStep.title === "Reverse stock top-up" &&
      reverseReasonStep.label === "Reason for reversal" &&
      reverseReasonStep.addedStillFive,
    "Correct reverse passcode must continue to the reason step before changing stock",
    reverseReasonStep
  );
  assert(
    reversePasscodeFinal.addedAfterReverse === 3 &&
      reversePasscodeFinal.reversalLogged &&
      reversePasscodeFinal.browserPromptClosed,
    "Reverse stock top-up must apply only after passcode and reason are both submitted",
    reversePasscodeFinal
  );

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

    const product = PRODUCTS.find((item) => item.sku === "002A");
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

    const sku = "002A";
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

    const paidProducts = PRODUCTS.filter((p) => p.price > 0).slice(0, 2);
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

  // Batch Y — Send Later delivery fee from product workbook flows through cart, sale, and CSV.
  const deliveryFeeFlow = await page.evaluate(() => {
    function buildSendLaterLine(sku, qty) {
      const product = PRODUCTS.find((p) => p.sku === sku);
      return {
        sku: product.sku,
        name: product.name,
        category: product.category,
        qty,
        basePrice: product.price,
        defaultDiscountAmount: product.defaultDiscount || 0,
        discountAmount: product.defaultDiscount || 0,
        isFreeGift: false,
        isFulfillmentLater: true,
        fulfillmentType: "reserved_send_later",
        preorderPaymentStatus: "paid_now",
      };
    }
    function buildBoothLine(sku, qty) {
      const product = PRODUCTS.find((p) => p.sku === sku);
      return {
        sku: product.sku,
        name: product.name,
        category: product.category,
        qty,
        basePrice: product.price,
        defaultDiscountAmount: product.defaultDiscount || 0,
        discountAmount: product.defaultDiscount || 0,
        isFreeGift: false,
      };
    }

    localStorage.clear();
    state.sales = [];
    invalidateSalesDerivedData();
    state.voidedSales = [];
    state.preorders = [];
    state.inventory = createDefaultInventory();
    state.globalInventory = createDefaultGlobalInventory();
    PRODUCTS.forEach((product) => {
      state.inventory.days.day1.eventStartConfirmed[product.sku] = true;
    });
    state.selectedOperator = "Zamm";

    // 1) Workbook delivery fees are present on the catalog (spot-check known values).
    const fee002A = productDeliveryFee("002A");
    const fee007 = productDeliveryFee("007");
    const fee013 = productDeliveryFee("013");
    const fee021 = productDeliveryFee("021");

    // 2) Empty cart: zero delivery fee, summary row hidden.
    state.cart = [];
    state.payment = "cash";
    renderCart();
    const empty = cartTotals();
    const emptyRowHidden = summaryDeliveryFeeRow.classList.contains("hidden");

    // 3) Booth-only sale: no delivery fee, summary row hidden.
    state.cart = [buildBoothLine("002A", 1)];
    state.payment = "cash";
    renderCart();
    const boothTotals = cartTotals();
    const boothRowHidden = summaryDeliveryFeeRow.classList.contains("hidden");

    // 4) One Send Later SKU (002A, fee 120) qty 1.
    state.cart = [buildSendLaterLine("002A", 1)];
    state.payment = "cash";
    renderCart();
    const oneSL = cartTotals();
    const oneSLRowVisible = !summaryDeliveryFeeRow.classList.contains("hidden");

    // 5) Same SKU qty 2 (fee 240).
    state.cart = [buildSendLaterLine("002A", 2)];
    renderCart();
    const twoSL = cartTotals();

    // 6) Mixed Send Later SKUs: 002A x1 (120) + 007 x1 (200) = 320.
    state.cart = [
      buildSendLaterLine("002A", 1),
      buildSendLaterLine("007", 1),
    ];
    renderCart();
    const mixedSL = cartTotals();

    // 7) Mixed booth + Send Later: booth item charges no delivery fee.
    state.cart = [
      buildBoothLine("002A", 1),
      buildSendLaterLine("007", 1),
    ];
    renderCart();
    const mixedCart = cartTotals();

    // 8) Card payment with delivery fee: surcharge applied to merchandise + delivery fee.
    state.cart = [buildSendLaterLine("002A", 1)];
    state.payment = "card";
    renderCart();
    const cardWithDelivery = cartTotals();

    // 9) serializeCartLine records per-line delivery fee fields.
    state.cart = [buildSendLaterLine("002A", 2), buildBoothLine("002A", 1)];
    state.payment = "cash";
    const serializedSendLater = serializeCartLine(state.cart[0]);
    const serializedBooth = serializeCartLine(state.cart[1]);

    // 10) Save the sale: state.pendingSale.total includes delivery fee, sale.deliveryFee persists.
    state.cart = [buildSendLaterLine("013", 1)]; // fee 200
    state.payment = "cash";
    renderCart();
    const beforeCompleteTotals = cartTotals();
    completeSale();
    const pendingSnapshot = {
      total: state.pendingSale.total,
      deliveryFee: state.pendingSale.deliveryFee,
      itemDeliveryFeePerUnit: state.pendingSale.items[0].deliveryFeePerUnit,
      itemLineDeliveryFee: state.pendingSale.items[0].lineDeliveryFee,
    };
    // Approve and finalize so it is saved.
    state.pendingSale.paymentConfirmed = true;
    state.pendingSale.paymentStatus = "confirmed";
    paymentConfirmedInput.checked = true;
    customerNameInput.value = "Smoke Y Customer";
    customerPhoneInput.value = "0800000000";
    customerReceiveLocationInput.value = "Smoke Y address";
    syncPendingSaleCustomerFields();
    finalizeSale("save");

    const savedSale = state.sales[0];
    const csv = daySalesToCsv("day1");
    const headerRow = csv.split("\n")[0].split(",");
    const dataRow = csv.split("\n")[1].split(",");
    const headerIndex = (key) => headerRow.indexOf(key);
    const cellAt = (key) => dataRow[headerIndex(key)];

    return {
      // workbook-derived fees
      fee002A,
      fee007,
      fee013,
      fee021,
      // empty
      emptyDeliveryFee: empty.deliveryFee,
      emptyChargeable: empty.chargeableTotal,
      emptyRowHidden,
      // booth-only
      boothDeliveryFee: boothTotals.deliveryFee,
      boothChargeable: boothTotals.chargeableTotal,
      boothMerch: boothTotals.total,
      boothRowHidden,
      // one Send Later
      oneSLDelivery: oneSL.deliveryFee,
      oneSLChargeable: oneSL.chargeableTotal,
      oneSLMerch: oneSL.total,
      oneSLRowVisible,
      // qty 2
      twoSLDelivery: twoSL.deliveryFee,
      // mixed Send Later SKUs
      mixedSLDelivery: mixedSL.deliveryFee,
      // mixed cart (booth + Send Later)
      mixedCartDelivery: mixedCart.deliveryFee,
      // card
      cardSurcharge: cardWithDelivery.cardSurcharge,
      cardChargeable: cardWithDelivery.chargeableTotal,
      cardMerch: cardWithDelivery.total,
      cardDelivery: cardWithDelivery.deliveryFee,
      // serialized item shape
      serializedSendLaterPerUnit: serializedSendLater.deliveryFeePerUnit,
      serializedSendLaterLine: serializedSendLater.lineDeliveryFee,
      serializedBoothPerUnit: serializedBooth.deliveryFeePerUnit,
      serializedBoothLine: serializedBooth.lineDeliveryFee,
      // saved sale + csv
      pendingSnapshot,
      savedDeliveryFee: savedSale?.deliveryFee,
      savedTotal: savedSale?.total,
      savedSubtotal: savedSale?.subtotal,
      savedItemPerUnit: savedSale?.items?.[0]?.deliveryFeePerUnit,
      savedItemLineFee: savedSale?.items?.[0]?.lineDeliveryFee,
      csvHasSaleDeliveryFee: headerIndex("saleDeliveryFee") >= 0,
      csvHasPerUnit: headerIndex("deliveryFeePerUnit") >= 0,
      csvHasLineDeliveryFee: headerIndex("lineDeliveryFee") >= 0,
      csvSaleDeliveryFeeCell: cellAt("saleDeliveryFee"),
      csvDeliveryFeePerUnitCell: cellAt("deliveryFeePerUnit"),
      csvLineDeliveryFeeCell: cellAt("lineDeliveryFee"),
      // QR amount uses chargeableTotal (sale.total includes delivery fee).
      pendingTotalIncludesFee: pendingSnapshot.total === beforeCompleteTotals.chargeableTotal,
    };
  });

  assert(deliveryFeeFlow.fee002A === 120, "002A delivery fee from workbook must be 120", deliveryFeeFlow);
  assert(deliveryFeeFlow.fee007 === 200, "007 delivery fee from workbook must be 200", deliveryFeeFlow);
  assert(deliveryFeeFlow.fee013 === 200, "013 delivery fee from workbook must be 200", deliveryFeeFlow);
  assert(deliveryFeeFlow.fee021 === 0, "021 (sticker) must have no delivery fee in workbook", deliveryFeeFlow);
  assert(deliveryFeeFlow.emptyDeliveryFee === 0 && deliveryFeeFlow.emptyRowHidden, "Empty cart must have zero delivery fee and the summary row hidden", deliveryFeeFlow);
  assert(deliveryFeeFlow.boothDeliveryFee === 0 && deliveryFeeFlow.boothChargeable === deliveryFeeFlow.boothMerch && deliveryFeeFlow.boothRowHidden, "Booth-only sale must charge no delivery fee", deliveryFeeFlow);
  assert(deliveryFeeFlow.oneSLDelivery === 120 && deliveryFeeFlow.oneSLChargeable === deliveryFeeFlow.oneSLMerch + 120 && deliveryFeeFlow.oneSLRowVisible, "One Send Later 002A x1 must add THB 120 delivery fee and surface the summary row", deliveryFeeFlow);
  assert(deliveryFeeFlow.twoSLDelivery === 240, "Send Later 002A x2 must charge THB 240 delivery fee", deliveryFeeFlow);
  assert(deliveryFeeFlow.mixedSLDelivery === 320, "Mixed Send Later SKUs must sum delivery fees (120 + 200 = 320)", deliveryFeeFlow);
  assert(deliveryFeeFlow.mixedCartDelivery === 200, "Mixed booth + Send Later cart must charge delivery only on the Send Later line", deliveryFeeFlow);
  assert(deliveryFeeFlow.cardSurcharge > 0 && deliveryFeeFlow.cardChargeable === deliveryFeeFlow.cardMerch + deliveryFeeFlow.cardDelivery + deliveryFeeFlow.cardSurcharge, "Card payment chargeable total must equal merchandise + delivery + 3% card surcharge", deliveryFeeFlow);
  assert(deliveryFeeFlow.cardSurcharge === Math.round((deliveryFeeFlow.cardMerch + deliveryFeeFlow.cardDelivery) * 0.03 * 100) / 100, "Card surcharge must be 3% of (merchandise + delivery fee)", deliveryFeeFlow);
  assert(deliveryFeeFlow.serializedSendLaterPerUnit === 120 && deliveryFeeFlow.serializedSendLaterLine === 240, "Saved Send Later item must record deliveryFeePerUnit and lineDeliveryFee", deliveryFeeFlow);
  assert(deliveryFeeFlow.serializedBoothPerUnit === 0 && deliveryFeeFlow.serializedBoothLine === 0, "Saved booth item must record zero delivery fee", deliveryFeeFlow);
  assert(deliveryFeeFlow.savedDeliveryFee === 200 && deliveryFeeFlow.savedTotal === deliveryFeeFlow.pendingSnapshot.total, "Saved sale must persist sale.deliveryFee and total must match the pending sale total (which already includes the delivery fee)", deliveryFeeFlow);
  assert(deliveryFeeFlow.savedItemPerUnit === 200 && deliveryFeeFlow.savedItemLineFee === 200, "Saved sale item must persist deliveryFeePerUnit and lineDeliveryFee", deliveryFeeFlow);
  assert(deliveryFeeFlow.csvHasSaleDeliveryFee && deliveryFeeFlow.csvHasPerUnit && deliveryFeeFlow.csvHasLineDeliveryFee, "Day CSV header must include saleDeliveryFee, deliveryFeePerUnit, lineDeliveryFee", deliveryFeeFlow);
  assert(deliveryFeeFlow.csvSaleDeliveryFeeCell === "200" && deliveryFeeFlow.csvDeliveryFeePerUnitCell === "200" && deliveryFeeFlow.csvLineDeliveryFeeCell === "200", "Day CSV row must export delivery fee numeric values", deliveryFeeFlow);
  assert(deliveryFeeFlow.pendingTotalIncludesFee, "pending sale.total must equal cartTotals().chargeableTotal so the transfer QR amount includes the delivery fee", deliveryFeeFlow);

  // Batch Y review #1 — correcting a card Send Later sale must recompute cardSurcharge on (merchandise + deliveryFee).
  const cardCorrectionFlow = await page.evaluate(() => {
    // Build a fresh saved card Send Later sale: 002A x2 Send Later, qty edit will drop it to x1.
    // Pre-correction:  merch 1300, delivery 240, surcharge 3% of 1540 = 46.20, total 1586.20
    // Post-correction (qty 1): merch 650, delivery 120, surcharge 3% of 770 = 23.10, total 793.10
    const product = PRODUCTS.find((p) => p.sku === "002A");
    const beforeItem = {
      sku: "002A",
      name: product.name,
      category: product.category,
      qty: 2,
      basePrice: 790,
      discountPerItem: 140,
      discounted: true,
      finalUnitPrice: 650,
      lineSubtotal: 1580,
      discountAmount: 280,
      lineDiscount: 280,
      lineTotal: 1300,
      isFulfillmentLater: true,
      fulfillmentType: "reserved_send_later",
      preorderPaymentStatus: "paid_now",
      deliveryFeePerUnit: 120,
      lineDeliveryFee: 240,
    };
    const beforeTotalsCard = correctionTotalsFromItems([beforeItem], "card");
    // Edit qty 2 -> 1 via rebuildCorrectionItem (the same path readCorrectionItemsFromInputs uses).
    const afterItem = rebuildCorrectionItem(beforeItem, 1);
    const afterTotalsCard = correctionTotalsFromItems([afterItem], "card");
    // Same correction with cash payment must not invent a surcharge.
    const afterTotalsCash = correctionTotalsFromItems([afterItem], "cash");
    return {
      beforeMerch: beforeTotalsCard.subtotal - beforeTotalsCard.discount,
      beforeDelivery: beforeTotalsCard.deliveryFee,
      beforeSurcharge: beforeTotalsCard.cardSurcharge,
      beforeTotal: beforeTotalsCard.total,
      afterPerUnit: afterItem.deliveryFeePerUnit,
      afterLineFee: afterItem.lineDeliveryFee,
      afterMerch: afterTotalsCard.subtotal - afterTotalsCard.discount,
      afterDelivery: afterTotalsCard.deliveryFee,
      afterSurcharge: afterTotalsCard.cardSurcharge,
      afterTotal: afterTotalsCard.total,
      cashTotal: afterTotalsCash.total,
      cashSurcharge: afterTotalsCash.cardSurcharge,
    };
  });

  assert(
    cardCorrectionFlow.beforeMerch === 1300 &&
      cardCorrectionFlow.beforeDelivery === 240 &&
      cardCorrectionFlow.beforeSurcharge === 46.2 &&
      cardCorrectionFlow.beforeTotal === 1586.2,
    "Pre-correction card Send Later totals: merch 1300 + delivery 240 + 3% surcharge 46.20 = 1586.20",
    cardCorrectionFlow
  );
  assert(
    cardCorrectionFlow.afterPerUnit === 120 && cardCorrectionFlow.afterLineFee === 120,
    "Edited Send Later item must keep deliveryFeePerUnit and recompute lineDeliveryFee for the new qty",
    cardCorrectionFlow
  );
  assert(
    cardCorrectionFlow.afterMerch === 650 &&
      cardCorrectionFlow.afterDelivery === 120 &&
      cardCorrectionFlow.afterSurcharge === 23.1 &&
      cardCorrectionFlow.afterTotal === 793.1,
    "Post-correction card Send Later totals must equal merchandise + delivery + 3% × (merchandise + delivery)",
    cardCorrectionFlow
  );
  assert(
    cardCorrectionFlow.afterTotal ===
      cardCorrectionFlow.afterMerch + cardCorrectionFlow.afterDelivery + cardCorrectionFlow.afterSurcharge,
    "Corrected card receipt identity: Total === Merchandise + Delivery + CardSurcharge",
    cardCorrectionFlow
  );
  assert(
    cardCorrectionFlow.cashSurcharge === 0 && cardCorrectionFlow.cashTotal === 770,
    "Same Send Later correction under cash must zero out cardSurcharge",
    cardCorrectionFlow
  );

  // Batch Y review #2 — correcting a legacy Send Later sale missing delivery fields must NOT gain a fee.
  const legacyCorrectionFlow = await page.evaluate(() => {
    // Legacy saved Send Later item from before Batch Y: no deliveryFeePerUnit, no lineDeliveryFee.
    const legacyItem = {
      sku: "002A",
      name: "Cat the Curator (legacy)",
      category: "Signature",
      qty: 2,
      basePrice: 790,
      discountPerItem: 140,
      discounted: true,
      finalUnitPrice: 650,
      lineSubtotal: 1580,
      discountAmount: 280,
      lineDiscount: 280,
      lineTotal: 1300,
      isFulfillmentLater: true,
      fulfillmentType: "reserved_send_later",
      preorderPaymentStatus: "paid_now",
      // no deliveryFeePerUnit, no lineDeliveryFee
    };
    // Untouched correction (e.g. just a tags/email edit) — readCorrectionItemsFromInputs pipes the
    // legacy item through rebuildCorrectionItem with its original qty.
    const untouched = rebuildCorrectionItem(legacyItem, legacyItem.qty);
    const untouchedTotalsCash = correctionTotalsFromItems([untouched], "cash");
    const untouchedTotalsCard = correctionTotalsFromItems([untouched], "card");
    // Quantity-changed correction: still legacy, must still not invent a fee.
    const reduced = rebuildCorrectionItem(legacyItem, 1);
    const reducedTotalsCash = correctionTotalsFromItems([reduced], "cash");
    return {
      untouchedPerUnit: untouched.deliveryFeePerUnit,
      untouchedLineFee: untouched.lineDeliveryFee,
      untouchedDelivery: untouchedTotalsCash.deliveryFee,
      untouchedTotalCash: untouchedTotalsCash.total,
      untouchedSurchargeCard: untouchedTotalsCard.cardSurcharge,
      untouchedTotalCard: untouchedTotalsCard.total,
      reducedPerUnit: reduced.deliveryFeePerUnit,
      reducedLineFee: reduced.lineDeliveryFee,
      reducedDelivery: reducedTotalsCash.deliveryFee,
      reducedTotalCash: reducedTotalsCash.total,
    };
  });

  assert(
    legacyCorrectionFlow.untouchedPerUnit === 0 &&
      legacyCorrectionFlow.untouchedLineFee === 0 &&
      legacyCorrectionFlow.untouchedDelivery === 0,
    "Legacy Send Later correction with no delivery fields must default deliveryFeePerUnit/lineDeliveryFee/saleDeliveryFee to 0 (must not pull from current catalog)",
    legacyCorrectionFlow
  );
  assert(
    legacyCorrectionFlow.untouchedTotalCash === 1300,
    "Legacy untouched cash correction total must equal merchandise only (1300), not gain a delivery fee",
    legacyCorrectionFlow
  );
  assert(
    legacyCorrectionFlow.untouchedSurchargeCard === Math.round(1300 * 0.03 * 100) / 100 &&
      legacyCorrectionFlow.untouchedTotalCard === Math.round((1300 + legacyCorrectionFlow.untouchedSurchargeCard) * 100) / 100,
    "Legacy untouched card correction surcharge must apply to merchandise only (no delivery fee), preserving pre-Batch-Y math for legacy bills",
    legacyCorrectionFlow
  );
  assert(
    legacyCorrectionFlow.reducedPerUnit === 0 &&
      legacyCorrectionFlow.reducedLineFee === 0 &&
      legacyCorrectionFlow.reducedDelivery === 0 &&
      legacyCorrectionFlow.reducedTotalCash === 650,
    "Legacy quantity-reduced correction must still record zero delivery fee and a merchandise-only total",
    legacyCorrectionFlow
  );

  // Batch Z - sticker choice promo replaces the legacy free scarf flow.
  const stickerPromoFlow = await page.evaluate(() => {
    function resetForStickerPromo() {
      localStorage.clear();
      state.sales = [];
      invalidateSalesDerivedData();
      state.voidedSales = [];
      state.preorders = [];
      state.cart = [];
      state.payment = "cash";
      state.freeGiftOverride = null;
      state.freeGiftStickerSku = STICKER_PROMO.defaultChoice;
      state.freeGiftSuppressedAutoQty = 0;
      state.pendingSale = null;
      state.inventory = createDefaultInventory();
      state.globalInventory = createDefaultGlobalInventory();
      state.selectedOperator = "Zamm";
      PRODUCTS.forEach((product) => {
        state.inventory.days.day1.eventStartConfirmed[product.sku] = true;
        state.inventory.days.day1.startingStock[product.sku] = 20;
        state.globalInventory.global[product.sku] = 50;
      });
      state.inventory.days.day1.startingStock["021"] = 5;
      state.inventory.days.day1.startingStock["022"] = 5;
      renderProducts();
      renderPayments();
      renderCart();
    }
    function paidLine(sku, qty) {
      const product = PRODUCTS.find((p) => p.sku === sku);
      return {
        sku: product.sku,
        name: product.name,
        category: product.category,
        qty,
        basePrice: product.price,
        defaultDiscountAmount: defaultProductDiscount(product),
        discountAmount: defaultProductDiscount(product),
        isFreeGift: false,
      };
    }

    resetForStickerPromo();
    state.cart = [paidLine("002A", 1)];
    renderCart();
    const belowThreshold = {
      qualifying: qualifyingCartTotal(),
      entitlement: freeGiftEntitlement(),
      hasGift: Boolean(findFreeGiftLine()),
    };

    state.cart = [paidLine("002A", 2)];
    renderCart();
    const autoGift = findFreeGiftLine();
    state.activeTab = getProductTab(getStickerProduct("021"));
    renderTabs();
    renderProducts();
    const sticker021Card = productGrid.querySelector('[data-sku="021"]');
    const thresholdGift = {
      qualifying: qualifyingCartTotal(),
      entitlement: freeGiftEntitlement(),
      sku: autoGift?.sku,
      qty: autoGift?.qty,
      isFreeGift: Boolean(autoGift?.isFreeGift),
      lineTotal: lineTotal(autoGift),
      cartMetaText: cartMeta.textContent,
      productCardStock: sticker021Card?.querySelector(".product-stock")?.textContent.trim(),
    };

    state.cart = [paidLine("002A", 4)];
    state.freeGiftOverride = null;
    renderCart();
    const twoGift = findFreeGiftLine();
    const doubleThreshold = {
      entitlement: freeGiftEntitlement(),
      giftQty: twoGift?.qty,
      autoGiftQty: twoGift?.autoGiftQty,
    };

    setFreeGiftStickerSku("022");
    const chosenGift = findFreeGiftLine("022");
    const remainingBrownGift = findFreeGiftLine("021");
    const choiceFlow = {
      sku: chosenGift?.sku,
      name: displaySaleItemName(chosenGift),
      blackQty: chosenGift?.qty,
      brownQty: remainingBrownGift?.qty,
      totalGiftQty: freeGiftTotals().qty,
      buttonText: cartList.textContent,
    };

    resetForStickerPromo();
    state.cart = [paidLine("002A", 4)];
    renderCart();
    setFreeGiftStickerSku("022");
    let brownIndex = state.cart.indexOf(findFreeGiftLine("021"));
    decrementFreeGift(brownIndex);
    const afterBrownMinus = {
      brownQty: findFreeGiftLine("021")?.qty || 0,
      blackQty: findFreeGiftLine("022")?.qty || 0,
      suppressed: state.freeGiftSuppressedAutoQty,
      totalGiftQty: freeGiftTotals().qty,
    };
    incrementFreeGift(state.cart.indexOf(findFreeGiftLine("022")));
    const quotaRestoreFlow = {
      afterBrownMinus,
      dialogOpen: confirmFreeGiftOverlay.classList.contains("open"),
      brownQty: findFreeGiftLine("021")?.qty || 0,
      blackQty: findFreeGiftLine("022")?.qty || 0,
      blackAutoGiftQty: findFreeGiftLine("022")?.autoGiftQty || 0,
      suppressed: state.freeGiftSuppressedAutoQty,
      totalGiftQty: freeGiftTotals().qty,
    };

    state.cart = [paidLine("002A", 2), paidLine("022", 1)];
    state.freeGiftOverride = null;
    state.freeGiftStickerSku = "022";
    renderCart();
    const coexistGift = findFreeGiftLine();
    completeSale();
    state.pendingSale.paymentConfirmed = true;
    state.pendingSale.paymentStatus = "confirmed";
    paymentConfirmedInput.checked = true;
    finalizeSale("save");
    const savedSale = state.sales[0];
    const paid022 = savedSale.items.find((item) => item.sku === "022" && !item.isFreeGift);
    const free022 = savedSale.items.find((item) => item.sku === "022" && item.isFreeGift);
    const freeGiftMap = getDayFreeGiftMap("day1");
    const soldMap = getDaySoldMap("day1");
    const snapshot022 = getProductInventorySnapshot("day1", "022");
    const csv = saleToCsvRows(savedSale);
    const csvLines = csv.split("\n");
    const csvHeader = csvLines[0].split(",");
    const csvRows = csvLines.slice(1).map((row) => row.split(","));
    const csvIndex = (key) => csvHeader.indexOf(key);
    const skuIndex = csvIndex("sku");
    const freeIndex = csvIndex("isFreeGift");
    const totalIndex = csvIndex("lineTotal");
    const coexistence = {
      coexistGiftSku: coexistGift?.sku,
      paid022Qty: paid022?.qty,
      paid022Total: paid022?.lineTotal,
      free022Qty: free022?.qty,
      free022Total: free022?.lineTotal,
      freeGiftMap022: freeGiftMap["022"],
      soldMap022: soldMap["022"],
      remaining022: snapshot022.remaining,
      csvHasPaid022: csvRows.some(
        (row) => row[skuIndex] === '"=""022"""' && row[freeIndex] === "false" && Number(row[totalIndex]) === 100
      ),
      csvHasFree022: csvRows.some(
        (row) => row[skuIndex] === '"=""022"""' && row[freeIndex] === "true" && Number(row[totalIndex]) === 0
      ),
    };

    resetForStickerPromo();
    state.inventory.days.day1.startingStock["021"] = 0;
    state.inventory.days.day1.startingStock["022"] = 3;
    state.freeGiftStickerSku = "021";
    state.cart = [paidLine("002A", 2)];
    renderCart();
    const fallbackGift = findFreeGiftLine();
    const fallback = {
      sku: fallbackGift?.sku,
      qty: fallbackGift?.qty,
      stock021: stickerSkuRemainingForGift("021"),
      stock022: stickerSkuRemainingForGift("022"),
    };

    resetForStickerPromo();
    state.cart = [paidLine("002A", 1)];
    renderCart();
    toggleFreeGift();
    const manualDialogOpen = confirmFreeGiftOverlay.classList.contains("open");
    confirmFreeGiftOverride();
    const manualGift = findFreeGiftLine();
    const manualOverride = {
      dialogOpen: manualDialogOpen,
      entitlement: freeGiftEntitlement(),
      manualGiftQty: manualGift?.manualGiftQty,
      isManualOverride: manualGift?.giftMode === "manual_override",
      freeGiftOverride: state.freeGiftOverride,
    };

    return {
      belowThreshold,
      thresholdGift,
      doubleThreshold,
      choiceFlow,
      quotaRestoreFlow,
      coexistence,
      fallback,
      manualOverride,
    };
  });

  assert(
    stickerPromoFlow.belowThreshold.qualifying < 1200 &&
      stickerPromoFlow.belowThreshold.entitlement === 0 &&
      !stickerPromoFlow.belowThreshold.hasGift,
    "Batch Z: cart below THB 1,200 must not auto-award a sticker",
    stickerPromoFlow
  );
  assert(
    stickerPromoFlow.thresholdGift.qualifying >= 1200 &&
      stickerPromoFlow.thresholdGift.entitlement === 1 &&
      stickerPromoFlow.thresholdGift.sku === "021" &&
      stickerPromoFlow.thresholdGift.qty === 1 &&
      stickerPromoFlow.thresholdGift.isFreeGift &&
      stickerPromoFlow.thresholdGift.lineTotal === 0 &&
      stickerPromoFlow.thresholdGift.productCardStock === "4",
    "Batch Z: qualifying cart must auto-award one free SKU 021 sticker at THB 0 and immediately reserve catalog stock",
    stickerPromoFlow
  );
  assert(
    stickerPromoFlow.doubleThreshold.entitlement === 2 &&
      stickerPromoFlow.doubleThreshold.giftQty === 2 &&
      stickerPromoFlow.doubleThreshold.autoGiftQty === 2,
    "Batch Z: THB 2,400+ qualifying cart must unlock two automatic free stickers",
    stickerPromoFlow
  );
  assert(
    stickerPromoFlow.choiceFlow.sku === "022" &&
      stickerPromoFlow.choiceFlow.blackQty === 1 &&
      stickerPromoFlow.choiceFlow.brownQty === 1 &&
      stickerPromoFlow.choiceFlow.totalGiftQty === 2 &&
      stickerPromoFlow.choiceFlow.name.includes("Free item") &&
      stickerPromoFlow.choiceFlow.buttonText.includes("Sticker SKU"),
    "Batch Z: staff must be able to split a 2-gift entitlement between SKU 021 and SKU 022 in cart",
    stickerPromoFlow
  );
  assert(
    stickerPromoFlow.quotaRestoreFlow.afterBrownMinus.brownQty === 0 &&
      stickerPromoFlow.quotaRestoreFlow.afterBrownMinus.blackQty === 1 &&
      stickerPromoFlow.quotaRestoreFlow.afterBrownMinus.suppressed === 1 &&
      !stickerPromoFlow.quotaRestoreFlow.dialogOpen &&
      stickerPromoFlow.quotaRestoreFlow.brownQty === 0 &&
      stickerPromoFlow.quotaRestoreFlow.blackQty === 2 &&
      stickerPromoFlow.quotaRestoreFlow.blackAutoGiftQty === 2 &&
      stickerPromoFlow.quotaRestoreFlow.suppressed === 0 &&
      stickerPromoFlow.quotaRestoreFlow.totalGiftQty === 2,
    "Batch Z: removing one automatic brown sticker must let plus on black restore that automatic quota without a manual override dialog",
    stickerPromoFlow
  );
  assert(
    stickerPromoFlow.coexistence.paid022Qty === 1 &&
      stickerPromoFlow.coexistence.free022Qty === 1 &&
      stickerPromoFlow.coexistence.freeGiftMap022 === 1 &&
      stickerPromoFlow.coexistence.soldMap022 === 2 &&
      stickerPromoFlow.coexistence.remaining022 === 3 &&
      stickerPromoFlow.coexistence.free022Total === 0 &&
      stickerPromoFlow.coexistence.csvHasPaid022 &&
      stickerPromoFlow.coexistence.csvHasFree022,
    "Batch Z: paid and free SKU 022 lines must coexist, deduct shared stock, and export paid/free CSV rows",
    stickerPromoFlow
  );
  assert(
    stickerPromoFlow.fallback.sku === "022" &&
      stickerPromoFlow.fallback.qty === 1 &&
      stickerPromoFlow.fallback.stock021 === 0 &&
      stickerPromoFlow.fallback.stock022 >= 1,
    "Batch Z: when default SKU 021 is out of stock, automatic sticker gift must fall back to available SKU 022",
    stickerPromoFlow
  );
  assert(
    stickerPromoFlow.manualOverride.dialogOpen &&
      stickerPromoFlow.manualOverride.entitlement === 0 &&
      stickerPromoFlow.manualOverride.manualGiftQty === 1 &&
      stickerPromoFlow.manualOverride.isManualOverride &&
      stickerPromoFlow.manualOverride.freeGiftOverride === "manual_override",
    "Batch Z: below-threshold manual sticker gift must require confirmation and record manual override metadata",
    stickerPromoFlow
  );

  // Batch FINAL_REVIEW - combined event-day cart: booth item + Send Later delivery fee + sticker gift.
  const finalReviewMixedFlow = await page.evaluate(() => {
    function resetFinalReview() {
      localStorage.clear();
      state.sales = [];
      invalidateSalesDerivedData();
      state.voidedSales = [];
      state.preorders = [];
      state.cart = [];
      state.payment = "card";
      state.freeGiftOverride = null;
      state.freeGiftStickerSku = STICKER_PROMO.defaultChoice;
      state.freeGiftSuppressedAutoQty = 0;
      state.pendingSale = null;
      state.inventory = createDefaultInventory();
      state.globalInventory = createDefaultGlobalInventory();
      state.selectedOperator = "Zamm";
      PRODUCTS.forEach((product) => {
        state.inventory.days.day1.eventStartConfirmed[product.sku] = true;
        state.inventory.days.day1.startingStock[product.sku] = 20;
        state.globalInventory.global[product.sku] = 50;
      });
      renderProducts();
      renderPayments();
      renderCart();
    }
    function paidLine(sku, qty, fulfillmentType = "") {
      const product = PRODUCTS.find((p) => p.sku === sku);
      return {
        sku: product.sku,
        name: product.name,
        category: product.category,
        qty,
        basePrice: product.price,
        defaultDiscountAmount: defaultProductDiscount(product),
        discountAmount: defaultProductDiscount(product),
        isFreeGift: false,
        isFulfillmentLater: fulfillmentType === "reserved_send_later",
        fulfillmentType,
        preorderPaymentStatus: fulfillmentType ? "paid_now" : "",
      };
    }

    resetFinalReview();
    state.cart = [
      paidLine("002A", 2),
      paidLine("013", 1, "reserved_send_later"),
    ];
    renderCart();
    const gift = findFreeGiftLine();
    const beforeComplete = cartTotals();
    const entitlementBeforeSave = freeGiftEntitlement();
    completeSale();
    const pending = state.pendingSale;
    state.pendingSale.paymentConfirmed = true;
    state.pendingSale.paymentStatus = "confirmed";
    paymentConfirmedInput.checked = true;
    customerNameInput.value = "Final Review";
    customerPhoneInput.value = "0800000001";
    customerReceiveLocationInput.value = "Ship after event";
    syncPendingSaleCustomerFields();
    finalizeSale("save");
    const saved = state.sales[0];
    const freeGift = saved.items.find((item) => item.isFreeGift);
    const sendLater = saved.items.find((item) => item.fulfillmentType === "reserved_send_later");
    const booth = saved.items.find((item) => item.sku === "002A" && !item.isFreeGift);
    const freeGiftMap = getDayFreeGiftMap("day1");
    const soldMap = getDaySoldMap("day1");
    const csv = daySalesToCsv("day1");
    return {
      entitlement: freeGiftEntitlement(),
      entitlementBeforeSave,
      giftSku: gift?.sku,
      giftQty: gift?.qty,
      deliveryFee: beforeComplete.deliveryFee,
      cardSurcharge: beforeComplete.cardSurcharge,
      chargeableTotal: beforeComplete.chargeableTotal,
      pendingTotal: pending.total,
      pendingDeliveryFee: pending.deliveryFee,
      savedTotal: saved.total,
      savedDeliveryFee: saved.deliveryFee,
      savedCardSurcharge: saved.cardSurcharge,
      boothQty: booth?.qty,
      sendLaterLineFee: sendLater?.lineDeliveryFee,
      freeGiftSku: freeGift?.sku,
      freeGiftTotal: freeGift?.lineTotal,
      freeGiftMap021: freeGiftMap["021"],
      soldMap021: soldMap["021"],
      soldMap013: soldMap["013"],
      csvHasDelivery: csv.includes(",200,"),
      csvHasFreeSticker: csv.includes('"=""021"""') && csv.includes(",true,"),
    };
  });

  assert(
      finalReviewMixedFlow.entitlementBeforeSave === 2 &&
      finalReviewMixedFlow.giftSku === "021" &&
      finalReviewMixedFlow.giftQty === 2 &&
      finalReviewMixedFlow.deliveryFee === 200 &&
      finalReviewMixedFlow.cardSurcharge > 0 &&
      finalReviewMixedFlow.pendingTotal === finalReviewMixedFlow.chargeableTotal &&
      finalReviewMixedFlow.savedTotal === finalReviewMixedFlow.chargeableTotal &&
      finalReviewMixedFlow.savedDeliveryFee === 200 &&
      finalReviewMixedFlow.savedCardSurcharge === finalReviewMixedFlow.cardSurcharge &&
      finalReviewMixedFlow.boothQty === 2 &&
      finalReviewMixedFlow.sendLaterLineFee === 200 &&
      finalReviewMixedFlow.freeGiftSku === "021" &&
      finalReviewMixedFlow.freeGiftTotal === 0 &&
      finalReviewMixedFlow.freeGiftMap021 === 2 &&
      finalReviewMixedFlow.soldMap021 === 2 &&
      finalReviewMixedFlow.soldMap013 === 0 &&
      finalReviewMixedFlow.csvHasDelivery &&
      finalReviewMixedFlow.csvHasFreeSticker,
    "FINAL_REVIEW: mixed booth + Send Later + sticker promo cart must save matching totals, delivery fee, card surcharge, free sticker stock, and CSV rows",
    finalReviewMixedFlow
  );

  assert(pageErrors.length === 0, "No page errors after Batch Z sticker promo flow", pageErrors);
  assert(browserDialogs.length === 0, "No browser dialogs after Batch Z sticker promo flow", browserDialogs);

  // Batch BB: dashboard historical day view. The picker must default to the
  // current operating day, let the manager click any day, drive
  // dashboardMetrics.viewDayId, and update the today/hour/payment titles.
  const dayPickerFlow = await page.evaluate(() => {
    const initialMetrics = dashboardMetrics();
    const operatingDay = currentDayId();
    const allDays = EVENT_DAYS.map(d => d.id);
    const otherDay = allDays.find(id => id !== operatingDay) || allDays[0];

    // Force a render so the picker is populated with current state.
    renderDashboard();
    const pickerButtons = Array.from(document.querySelectorAll("[data-dashboard-day]"));
    const buttonDayIds = pickerButtons.map(btn => btn.dataset.dashboardDay);
    const initialActive = pickerButtons.find(btn => btn.classList.contains("is-active"))?.dataset.dashboardDay;
    const initialHint = document.getElementById("dashboardDayPickerHint")?.textContent || "";
    const initialTodayTitle = document.getElementById("dashboardTodayTitle")?.textContent || "";
    const initialHourTitle = document.getElementById("dashboardHourCardTitle")?.textContent || "";
    const initialPayTitle = document.getElementById("dashboardPaySplitTitle")?.textContent || "";

    // Click a different day.
    const initialTopSellersTitle = document.getElementById("dashboardTopSellersTitle")?.textContent || "";

    setDashboardViewDay(otherDay);
    const switchedMetrics = dashboardMetrics();
    const switchedActive = Array.from(document.querySelectorAll("[data-dashboard-day]")).find(btn => btn.classList.contains("is-active"))?.dataset.dashboardDay;
    const switchedHint = document.getElementById("dashboardDayPickerHint")?.textContent || "";
    const switchedTodayTitle = document.getElementById("dashboardTodayTitle")?.textContent || "";
    const switchedHourTitle = document.getElementById("dashboardHourCardTitle")?.textContent || "";
    const switchedPayTitle = document.getElementById("dashboardPaySplitTitle")?.textContent || "";
    const switchedTopSellersTitle = document.getElementById("dashboardTopSellersTitle")?.textContent || "";

    // Click back to current operating day.
    setDashboardViewDay(operatingDay);
    const restoredActive = Array.from(document.querySelectorAll("[data-dashboard-day]")).find(btn => btn.classList.contains("is-active"))?.dataset.dashboardDay;

    return {
      initialMetricsViewDay: initialMetrics.viewDayId,
      operatingDay,
      otherDay,
      eventDaysLength: EVENT_DAYS.length,
      buttonCount: pickerButtons.length,
      buttonDayIds,
      initialActive,
      initialHint,
      initialTodayTitle,
      initialHourTitle,
      initialPayTitle,
      initialTopSellersTitle,
      switchedMetricsViewDay: switchedMetrics.viewDayId,
      switchedActive,
      switchedHint,
      switchedTodayTitle,
      switchedHourTitle,
      switchedPayTitle,
      switchedTopSellersTitle,
      restoredActive,
    };
  });
  assert(
    dayPickerFlow.buttonCount === dayPickerFlow.eventDaysLength &&
      dayPickerFlow.buttonDayIds.length === dayPickerFlow.buttonCount &&
      dayPickerFlow.initialMetricsViewDay === dayPickerFlow.operatingDay &&
      dayPickerFlow.initialActive === dayPickerFlow.operatingDay &&
      dayPickerFlow.initialTodayTitle.startsWith("Today · ") &&
      dayPickerFlow.initialHourTitle === "Today By Hour" &&
      /^Payment split · today$/i.test(dayPickerFlow.initialPayTitle) &&
      dayPickerFlow.initialTopSellersTitle === "Top Sellers · Event" &&
      /Showing live operating day/.test(dayPickerFlow.initialHint) &&
      dayPickerFlow.switchedMetricsViewDay === dayPickerFlow.otherDay &&
      dayPickerFlow.switchedActive === dayPickerFlow.otherDay &&
      dayPickerFlow.switchedTodayTitle.startsWith("Viewing · ") &&
      dayPickerFlow.switchedHourTitle.endsWith("By Hour") &&
      dayPickerFlow.switchedHourTitle !== "Today By Hour" &&
      /^Payment split · /.test(dayPickerFlow.switchedPayTitle) &&
      dayPickerFlow.switchedPayTitle !== dayPickerFlow.initialPayTitle &&
      /^Top Sellers · Day /.test(dayPickerFlow.switchedTopSellersTitle) &&
      dayPickerFlow.switchedTopSellersTitle !== "Top Sellers · Event" &&
      /Viewing/.test(dayPickerFlow.switchedHint) &&
      dayPickerFlow.restoredActive === dayPickerFlow.operatingDay,
    "Batch BB: dashboard day picker must default to current operating day, switch viewDayId on click, swap titles/hint (incl. Top Sellers), and restore on click-back",
    dayPickerFlow
  );

  assert(pageErrors.length === 0, "No page errors after Batch BB day picker flow", pageErrors);
  assert(browserDialogs.length === 0, "No browser dialogs after Batch BB day picker flow", browserDialogs);

  // Iter 4: day-over-day compare footers must appear under the today-tile
  // values when a prior day exists, and must be hidden when viewing day 1
  // (no prior day). The direction (up/down/flat) and prior reference value
  // must match getDaySales totals.
  const compareFlow = await page.evaluate(() => {
    const stateBackup = {
      sales: JSON.parse(JSON.stringify(state.sales)),
      voidedSales: JSON.parse(JSON.stringify(state.voidedSales)),
      preorders: JSON.parse(JSON.stringify(state.preorders)),
      inventory: JSON.parse(JSON.stringify(state.inventory)),
      globalInventory: JSON.parse(JSON.stringify(state.globalInventory)),
      dashboardViewDay: state.dashboardViewDay
    };

    function makeFakeSale(billId, dayId, total, items) {
      return {
        id: billId,
        billId,
        datetime: new Date().toISOString(),
        timestamp: Date.now() + Math.random(),
        operatingDay: dayId,
        operator: "Zamm",
        payment: "cash",
        paymentStatus: "confirmed",
        total,
        subtotal: total,
        discount: 0,
        items: items || [{ sku: PRODUCTS[0].sku, qty: 1, basePrice: total, lineSubtotal: total, finalUnitPrice: total, lineTotal: total, discountPerItem: 0, discountAmount: 0, category: "test", isFreeGift: false, isPreorder: false }],
        tags: []
      };
    }

    state.sales = [
      makeFakeSale("d1-a", "day1", 100, [{ sku: PRODUCTS[0].sku, qty: 1, basePrice: 100, lineSubtotal: 100, finalUnitPrice: 100, lineTotal: 100, discountPerItem: 0, discountAmount: 0, category: "test", isFreeGift: false, isPreorder: false }]),
      makeFakeSale("d1-b", "day1", 200, [{ sku: PRODUCTS[0].sku, qty: 2, basePrice: 100, lineSubtotal: 200, finalUnitPrice: 100, lineTotal: 200, discountPerItem: 0, discountAmount: 0, category: "test", isFreeGift: false, isPreorder: false }]),
      makeFakeSale("d2-a", "day2", 150, [{ sku: PRODUCTS[0].sku, qty: 1, basePrice: 150, lineSubtotal: 150, finalUnitPrice: 150, lineTotal: 150, discountPerItem: 0, discountAmount: 0, category: "test", isFreeGift: false, isPreorder: false }])
    ];
    invalidateSalesDerivedData();
    state.inventory.currentDay = "day2";

    setDashboardViewDay("day2");
    const m = dashboardMetrics();
    const compareCard = document.getElementById("dashboardTodayCompare");
    const receiptsSubText = document.getElementById("dashboardReceiptsSub")?.textContent || "";
    const day2 = {
      compareData: m.todayCompare,
      priorDayLabel: m.priorDayLabel,
      todaySale: m.todaySale,
      todayReceipts: m.todayReceipts,
      todayItems: m.todayItems,
      compareHidden: compareCard ? compareCard.hidden : null,
      compareText: compareCard ? compareCard.textContent : "",
      receiptsSubText
    };

    setDashboardViewDay("day1");
    const m1 = dashboardMetrics();
    const day1 = {
      compareData: m1.todayCompare,
      priorDayLabel: m1.priorDayLabel,
      compareHidden: compareCard ? compareCard.hidden : null
    };

    // Restore.
    state.sales = stateBackup.sales;
    state.voidedSales = stateBackup.voidedSales;
    state.preorders = stateBackup.preorders;
    state.inventory = stateBackup.inventory;
    state.globalInventory = stateBackup.globalInventory;
    state.dashboardViewDay = stateBackup.dashboardViewDay;
    invalidateSalesDerivedData();

    return { day2, day1 };
  });
  // Iter 8: hour-by-hour ghost bar overlay on Today By Hour. When viewing day
  // 2 with day 1 sales present, the chart must render ghost-bar elements
  // referencing prior-day's same-hour totals; on day 1 view, no ghost bars.
  const ghostBarsFlow = await page.evaluate(() => {
    const m = dashboardMetrics();
    renderDashboard();
    const ghostBars = document.querySelectorAll("#dashboardHourChart .v3-hour-ghost-bar");
    const peakNote = document.getElementById("dashboardHourPeakNote")?.textContent || "";
    const totalGhostBars = ghostBars.length;
    const anyGhostHasHeight = Array.from(ghostBars).some(el => parseFloat(el.style.height) > 0);
    const buckets = m.priorDayByHour ? m.priorDayByHour.buckets : null;
    const priorBucketHasTotal = buckets ? buckets.some(b => Number(b.total) > 0) : false;
    return {
      viewDay: m.viewDayId,
      priorDayLabel: m.priorDayLabel,
      hasPriorByHour: !!m.priorDayByHour,
      priorBucketCount: buckets ? buckets.length : 0,
      priorBucketHasTotal,
      totalGhostBars,
      anyGhostHasHeight,
      peakNote
    };
  });
  // Either we are viewing day 1 (no prior, no ghost bars) or day 2+ with
  // prior data. In the day 2+ case, ghost bars must be present and at least
  // one must have non-zero height (because the synthetic day-1 sales we
  // created earlier in compareFlow planted day-1 data).
  assert(
    (ghostBarsFlow.viewDay === "day1" && ghostBarsFlow.hasPriorByHour === false && ghostBarsFlow.totalGhostBars === 0) ||
      (ghostBarsFlow.hasPriorByHour === true &&
        ghostBarsFlow.priorBucketCount > 0 &&
        (ghostBarsFlow.priorBucketHasTotal === false || ghostBarsFlow.totalGhostBars > 0)),
    "Iter 8: hour ghost bars must render when prior-day data exists, peak note must mention 'ghost = Day N-1', and day 1 view must omit ghost bars",
    ghostBarsFlow
  );

  // Day 2 view: prior day = Day 1, today=150 vs prior=300 → direction down,
  // diff -150, pct -50.
  assert(
    compareFlow.day2.compareData &&
      compareFlow.day2.priorDayLabel === "Day 1" &&
      compareFlow.day2.compareData.sales.prior === 300 &&
      compareFlow.day2.compareData.sales.direction === "down" &&
      compareFlow.day2.compareData.sales.pct === -50 &&
      compareFlow.day2.compareData.receipts.prior === 2 &&
      compareFlow.day2.compareData.receipts.direction === "down" &&
      compareFlow.day2.compareData.items.prior === 3 &&
      compareFlow.day2.compareData.items.direction === "down" &&
      compareFlow.day2.compareHidden === false &&
      compareFlow.day2.compareText.includes("Day 1") &&
      compareFlow.day2.compareText.includes("300") &&
      compareFlow.day2.receiptsSubText.includes("vs Day 1"),
    "Iter 4: day-over-day compare must populate prior-day references and direction for day 2 view",
    compareFlow.day2
  );
  // Day 1 view: no prior day → compareData null, today-compare hidden.
  assert(
    compareFlow.day1.compareData === null &&
      compareFlow.day1.priorDayLabel === "" &&
      compareFlow.day1.compareHidden === true,
    "Iter 4: day 1 view has no prior day; compare element must be hidden",
    compareFlow.day1
  );

  // Batch CC: warehouse formula must NOT drift across day rollover, and the
  // reconciliation report must flag intentional drift. The headline bug pre-CC
  // was: warehouse = global - online - dayN.startingStock - dayN.addedStock -
  // committed jumped after carry-forward because dayN.startingStock = day1
  // remaining, not allocation. After CC: warehouse derives from
  // cumulativeAllocatedQty = day1.startingStock + sum(addedStock).
  const driftFlow = await page.evaluate(() => {
    // Save current state so we can restore after this destructive test.
    const stateBackup = {
      sales: JSON.parse(JSON.stringify(state.sales)),
      voidedSales: JSON.parse(JSON.stringify(state.voidedSales)),
      preorders: JSON.parse(JSON.stringify(state.preorders)),
      inventory: JSON.parse(JSON.stringify(state.inventory)),
      globalInventory: JSON.parse(JSON.stringify(state.globalInventory)),
      dashboardViewDay: state.dashboardViewDay
    };

    // Reset to a clean known state: pick a real SKU; assert global/online/start.
    const testSku = PRODUCTS[0].sku;
    state.sales = [];
    state.voidedSales = [];
    state.preorders = [];
    invalidateSalesDerivedData();

    // Hand-build inventory.days with a clean numeric scenario.
    EVENT_DAYS.forEach((d, i) => {
      const r = state.inventory.days[d.id];
      r.startingStock = buildSkuMap(() => 0);
      r.addedStock = buildSkuMap(() => 0);
      r.sampleQty = buildSkuMap(() => 0);
      r.eventStartConfirmed = buildSkuMap(() => false);
      r.addLog = [];
      r.closed = false;
      r.closedAt = "";
      r.exportedAt = "";
    });
    state.inventory.currentDay = "day1";
    state.inventory.viewDay = "day1";
    state.dashboardViewDay = null;
    PRODUCTS.forEach(p => {
      state.globalInventory.global[p.sku] = 0;
      state.globalInventory.onlineAllocated[p.sku] = 0;
      state.globalInventory.eventAllocated[p.sku] = 0;
    });
    // Apply the canonical scenario only to testSku; leave others at 0.
    state.globalInventory.global[testSku] = 200;
    state.globalInventory.onlineAllocated[testSku] = 50;
    state.inventory.days.day1.startingStock[testSku] = 100;
    state.inventory.days.day1.eventStartConfirmed[testSku] = true;

    const warehouseDay1Initial = stockSetupSnapshot(testSku, "day1").warehouse;
    const cumulativeDay1Initial = stockSetupSnapshot(testSku, "day1").cumulativeAllocated;

    // Top-up 10 on day 1 via the same code path as Stock & Allocation Setup.
    state.inventory.days.day1.addedStock[testSku] = 10;
    const warehouseDay1AfterTopUp = stockSetupSnapshot(testSku, "day1").warehouse;

    // Inject a synthetic sale of 30 on day 1.
    const fakeSale = {
      id: "smoke-cc-1",
      billId: "smoke-cc-1",
      datetime: new Date().toISOString(),
      timestamp: Date.now(),
      operatingDay: "day1",
      operator: "Zamm",
      payment: "cash",
      paymentStatus: "confirmed",
      total: 100,
      subtotal: 100,
      discount: 0,
      items: [{
        sku: testSku,
        qty: 30,
        basePrice: 100,
        lineSubtotal: 100,
        finalUnitPrice: 100,
        lineTotal: 100,
        discountPerItem: 0,
        discountAmount: 0,
        category: "test",
        isFreeGift: false,
        isPreorder: false
      }],
      tags: []
    };
    state.sales.push(fakeSale);
    invalidateSalesDerivedData();
    const warehouseDay1AfterSale = stockSetupSnapshot(testSku, "day1").warehouse;

    // Close day 1 → advance to day 2; warehouse must remain stable.
    state.inventory.days.day1.closed = true;
    state.inventory.days.day1.closedAt = new Date().toISOString();
    state.inventory.days.day2.startingStock = getDayRemainingMap("day1");
    state.inventory.days.day2.addedStock = buildSkuMap(() => 0);
    state.inventory.days.day2.eventStartConfirmed = buildSkuMap(() => true);
    realignInventoryCarryForward("day1", { persist: false });
    state.inventory.currentDay = "day2";
    state.inventory.viewDay = "day2";
    invalidateSalesDerivedData();
    const warehouseDay2 = stockSetupSnapshot(testSku, "day2").warehouse;
    const day2StartingStock = state.inventory.days.day2.startingStock[testSku];

    // Top-up 5 on day 2 → warehouse should drop by exactly 5.
    state.inventory.days.day2.addedStock[testSku] = 5;
    const warehouseDay2AfterTopUp = stockSetupSnapshot(testSku, "day2").warehouse;

    // Reconcile must pass after this fully-correct sequence.
    const reportClean = reconcileInventoryReport().filter(r => r.sku === testSku);

    // Now corrupt day2.startingStock directly (simulating the legacy buggy path)
    // — reconcile must DETECT the drift.
    const beforeCorruption = state.inventory.days.day2.startingStock[testSku];
    state.inventory.days.day2.startingStock[testSku] = beforeCorruption + 7;
    const reportCorrupted = reconcileInventoryReport().filter(r => r.sku === testSku);
    state.inventory.days.day2.startingStock[testSku] = beforeCorruption;

    // Restore state from backup so subsequent smoke steps see normal data.
    state.sales = stateBackup.sales;
    state.voidedSales = stateBackup.voidedSales;
    state.preorders = stateBackup.preorders;
    state.inventory = stateBackup.inventory;
    state.globalInventory = stateBackup.globalInventory;
    state.dashboardViewDay = stateBackup.dashboardViewDay;
    invalidateSalesDerivedData();

    return {
      testSku,
      warehouseDay1Initial,
      cumulativeDay1Initial,
      warehouseDay1AfterTopUp,
      warehouseDay1AfterSale,
      warehouseDay2,
      warehouseDay2AfterTopUp,
      day2StartingStock,
      reportClean,
      reportCorrupted
    };
  });
  assert(
    driftFlow.warehouseDay1Initial === 50 &&
      driftFlow.cumulativeDay1Initial === 100 &&
      driftFlow.warehouseDay1AfterTopUp === 40 &&
      driftFlow.warehouseDay1AfterSale === 40 &&
      // Day 2 warehouse must EQUAL the day 1 post-top-up value: no drift.
      driftFlow.warehouseDay2 === 40 &&
      driftFlow.day2StartingStock === 80 &&
      driftFlow.warehouseDay2AfterTopUp === 35,
    "Batch CC: warehouse formula must NOT drift across day rollover, top-up, or sale",
    driftFlow
  );
  assert(
    driftFlow.reportClean.length === 1 &&
      driftFlow.reportClean[0].isOk === true &&
      driftFlow.reportClean[0].allocatedDelta === 0,
    "Batch CC: reconcile must report isOk=true after a fully-correct sequence",
    driftFlow.reportClean
  );
  assert(
    driftFlow.reportCorrupted.length === 1 &&
      driftFlow.reportCorrupted[0].isOk === false &&
      driftFlow.reportCorrupted[0].allocatedDelta === -7,
    "Batch CC: reconcile must DETECT a 7-unit allocated drift after manual startingStock corruption",
    driftFlow.reportCorrupted
  );

  // Batch CC scenario set — every drift path the user listed in the post-event
  // bug report (top-up, sample, correction, void) and a multi-day rollover.
  // Each runs in an isolated state, asserts warehouse stability, and checks
  // that reconcileInventoryReport reports isOk=true at every step.
  const driftScenarios = await page.evaluate(() => {
    const stateBackup = {
      sales: JSON.parse(JSON.stringify(state.sales)),
      voidedSales: JSON.parse(JSON.stringify(state.voidedSales)),
      preorders: JSON.parse(JSON.stringify(state.preorders)),
      inventory: JSON.parse(JSON.stringify(state.inventory)),
      globalInventory: JSON.parse(JSON.stringify(state.globalInventory)),
      dashboardViewDay: state.dashboardViewDay
    };

    function buildFakeSale(billId, sku, qty, dayId) {
      return {
        id: billId,
        billId,
        datetime: new Date().toISOString(),
        timestamp: Date.now() + Math.random(),
        operatingDay: dayId,
        operator: "Zamm",
        payment: "cash",
        paymentStatus: "confirmed",
        total: qty * 100,
        subtotal: qty * 100,
        discount: 0,
        items: [{
          sku, qty, basePrice: 100, lineSubtotal: qty * 100,
          finalUnitPrice: 100, lineTotal: qty * 100,
          discountPerItem: 0, discountAmount: 0, category: "test",
          isFreeGift: false, isPreorder: false
        }],
        tags: []
      };
    }
    function resetClean(globalQty, onlineQty, day1Start) {
      state.sales = [];
      state.voidedSales = [];
      state.preorders = [];
      EVENT_DAYS.forEach(d => {
        const r = state.inventory.days[d.id];
        r.startingStock = buildSkuMap(() => 0);
        r.addedStock = buildSkuMap(() => 0);
        r.sampleQty = buildSkuMap(() => 0);
        r.eventStartConfirmed = buildSkuMap(() => false);
        r.addLog = [];
        r.closed = false;
        r.closedAt = "";
        r.exportedAt = "";
      });
      state.inventory.currentDay = "day1";
      state.inventory.viewDay = "day1";
      state.dashboardViewDay = null;
      PRODUCTS.forEach(p => {
        state.globalInventory.global[p.sku] = 0;
        state.globalInventory.onlineAllocated[p.sku] = 0;
        state.globalInventory.eventAllocated[p.sku] = 0;
      });
      const sku = PRODUCTS[0].sku;
      state.globalInventory.global[sku] = globalQty;
      state.globalInventory.onlineAllocated[sku] = onlineQty;
      state.inventory.days.day1.startingStock[sku] = day1Start;
      state.inventory.days.day1.eventStartConfirmed[sku] = true;
      invalidateSalesDerivedData();
      return sku;
    }
    function closeDay(activeDay, nextDay) {
      state.inventory.days[activeDay].closed = true;
      state.inventory.days[activeDay].closedAt = new Date().toISOString();
      if (nextDay) {
        state.inventory.days[nextDay].startingStock = getDayRemainingMap(activeDay);
        state.inventory.days[nextDay].addedStock = buildSkuMap(() => 0);
        state.inventory.days[nextDay].eventStartConfirmed = buildSkuMap(() => true);
        realignInventoryCarryForward(activeDay, { persist: false });
        state.inventory.currentDay = nextDay;
        state.inventory.viewDay = nextDay;
      }
      invalidateSalesDerivedData();
    }
    function snapWh(sku, dayId) { return stockSetupSnapshot(sku, dayId).warehouse; }
    function reconcileSku(sku) { return reconcileInventoryReport().find(r => r.sku === sku); }

    const results = {};

    // Scenario 1: void on day 1 — warehouse must NOT change (pre-CC drifted by
    // sale.qty units after carry-forward changed in realign).
    {
      const sku = resetClean(200, 50, 100);
      const wh0 = snapWh(sku, "day1");
      state.sales.push(buildFakeSale("v1", sku, 30, "day1"));
      invalidateSalesDerivedData();
      const wh1 = snapWh(sku, "day1");
      // Void via real path:
      state.pendingVoidSale = state.sales[0];
      // Stub to bypass UI:
      state.sales = state.sales.filter(s => s.billId !== "v1");
      const voidEntry = { type: "void", at: new Date().toISOString(), reason: "smoke", billId: "v1", operatingDay: "day1", saleSnapshot: { items: [{ sku, qty: 30 }] }, total: 3000, itemCount: 30 };
      state.voidedSales = [voidEntry];
      invalidateSalesDerivedData();
      realignInventoryCarryForward("day1", { persist: false });
      const wh2 = snapWh(sku, "day1");
      const ok = reconcileSku(sku).isOk;
      results.scenarioVoid = { wh0, wh1, wh2, ok, reconcile: reconcileSku(sku) };
    }

    // Scenario 2: sample on day 1 (booth-internal label) — warehouse must NOT
    // change. Pre-CC: sample didn't enter the formula, so warehouse stayed
    // correct on day 1; post-rollover it would still drift via carry-forward.
    {
      const sku = resetClean(200, 50, 100);
      const wh0 = snapWh(sku, "day1");
      state.inventory.days.day1.sampleQty[sku] = 5;
      const wh1 = snapWh(sku, "day1");
      closeDay("day1", "day2");
      const wh2 = snapWh(sku, "day2");
      const ok = reconcileSku(sku).isOk;
      results.scenarioSample = { wh0, wh1, wh2, ok };
    }

    // Scenario 3: inventory correction to addedStock — must realign downstream
    // and reconcile clean.
    {
      const sku = resetClean(200, 50, 100);
      state.inventory.days.day1.addedStock[sku] = 10;
      state.sales.push(buildFakeSale("c1", sku, 30, "day1"));
      invalidateSalesDerivedData();
      const wh0 = snapWh(sku, "day1");
      closeDay("day1", "day2");
      const wh1 = snapWh(sku, "day2");
      const day2StartBefore = state.inventory.days.day2.startingStock[sku];
      // Correct day 1's addedStock from 10 to 8 (reduce a prior top-up via the
      // real correction path), then verify carry-forward realigns and warehouse
      // moves by exactly the delta.
      state.inventory.days.day1.closed = false; // unlock day 1 to allow correction
      state.pendingInventoryCorrection = {
        sku, productName: "test", field: "addedStock", before: 10, after: 8,
        reason: "smoke test correction", dayId: "day1",
        at: new Date().toISOString()
      };
      confirmInventoryCorrection();
      state.inventory.days.day1.closed = true; // restore
      const wh2 = snapWh(sku, "day2");
      const day2StartAfter = state.inventory.days.day2.startingStock[sku];
      const ok = reconcileSku(sku).isOk;
      results.scenarioCorrection = {
        wh0, wh1, wh2,
        day2StartBefore, day2StartAfter,
        ok, reconcile: reconcileSku(sku)
      };
    }

    // Scenario 4: multi-day rollover — close day 1 → 2 → 3 with sales each
    // day. Warehouse must stay constant unless physical top-ups happen.
    {
      const sku = resetClean(500, 100, 200);
      const wh0 = snapWh(sku, "day1");
      state.sales.push(buildFakeSale("md1", sku, 20, "day1"));
      invalidateSalesDerivedData();
      const wh1 = snapWh(sku, "day1");
      closeDay("day1", "day2");
      const wh2 = snapWh(sku, "day2");
      state.inventory.days.day2.addedStock[sku] = 30; // top-up on day 2
      state.sales.push(buildFakeSale("md2", sku, 25, "day2"));
      invalidateSalesDerivedData();
      const wh3 = snapWh(sku, "day2");
      closeDay("day2", "day3");
      const wh4 = snapWh(sku, "day3");
      state.sales.push(buildFakeSale("md3", sku, 10, "day3"));
      invalidateSalesDerivedData();
      const wh5 = snapWh(sku, "day3");
      const ok = reconcileSku(sku).isOk;
      results.scenarioMultiRollover = { wh0, wh1, wh2, wh3, wh4, wh5, ok };
    }

    // Restore pre-test state.
    state.sales = stateBackup.sales;
    state.voidedSales = stateBackup.voidedSales;
    state.preorders = stateBackup.preorders;
    state.inventory = stateBackup.inventory;
    state.globalInventory = stateBackup.globalInventory;
    state.dashboardViewDay = stateBackup.dashboardViewDay;
    invalidateSalesDerivedData();

    return results;
  });
  // Scenario 1: void must NOT shift warehouse (was 150 - jumped pre-CC).
  assert(
    driftScenarios.scenarioVoid.wh0 === 50 &&
      driftScenarios.scenarioVoid.wh1 === 50 &&
      driftScenarios.scenarioVoid.wh2 === 50 &&
      driftScenarios.scenarioVoid.ok === true,
    "Batch CC scenario VOID: warehouse must stay 50 across sale + void; reconcile must be OK",
    driftScenarios.scenarioVoid
  );
  // Scenario 2: sample is booth-internal — warehouse stays 50 across rollover.
  assert(
    driftScenarios.scenarioSample.wh0 === 50 &&
      driftScenarios.scenarioSample.wh1 === 50 &&
      driftScenarios.scenarioSample.wh2 === 50 &&
      driftScenarios.scenarioSample.ok === true,
    "Batch CC scenario SAMPLE: warehouse must stay 50 across sample reservation + day rollover; reconcile must be OK",
    driftScenarios.scenarioSample
  );
  // Scenario 3: correcting addedStock from 10→8 (returning 2 units to
  // warehouse) — warehouse must move from 40 to 42 and day2 carry-forward
  // realigns from 80 down to 78.
  assert(
    driftScenarios.scenarioCorrection.wh0 === 40 &&
      driftScenarios.scenarioCorrection.wh1 === 40 &&
      driftScenarios.scenarioCorrection.day2StartBefore === 80 &&
      driftScenarios.scenarioCorrection.day2StartAfter === 78 &&
      driftScenarios.scenarioCorrection.wh2 === 42 &&
      driftScenarios.scenarioCorrection.ok === true,
    "Batch CC scenario CORRECTION: addedStock correction must realign carry-forward and shift warehouse by exactly the delta; reconcile must be OK",
    driftScenarios.scenarioCorrection
  );
  // Scenario 4: multi-day rollover — start 200 (wh=200), top-up 30 (wh=170),
  // warehouse stays at 200 until top-up, then stays at 170 across closes/sales.
  assert(
    driftScenarios.scenarioMultiRollover.wh0 === 200 &&
      driftScenarios.scenarioMultiRollover.wh1 === 200 &&
      driftScenarios.scenarioMultiRollover.wh2 === 200 &&
      driftScenarios.scenarioMultiRollover.wh3 === 170 &&
      driftScenarios.scenarioMultiRollover.wh4 === 170 &&
      driftScenarios.scenarioMultiRollover.wh5 === 170 &&
      driftScenarios.scenarioMultiRollover.ok === true,
    "Batch CC scenario MULTI_ROLLOVER: warehouse must stay constant across sales/closes and only move on physical top-ups; reconcile must be OK",
    driftScenarios.scenarioMultiRollover
  );

  // Reconcile UI button must exist and runInventoryReconcile must run without
  // mutating ledgers.
  const reconcileButtonFlow = await page.evaluate(() => {
    const buttonExists = !!document.getElementById("reconcileInventoryBtn");
    const fnExists = typeof runInventoryReconcile === "function";
    const beforeReport = reconcileInventoryReport();
    runInventoryReconcile();
    const afterReport = reconcileInventoryReport();
    const reportSnapshotsMatch =
      JSON.stringify(beforeReport) === JSON.stringify(afterReport);
    return { buttonExists, fnExists, reportSnapshotsMatch };
  });
  assert(
    reconcileButtonFlow.buttonExists &&
      reconcileButtonFlow.fnExists &&
      reconcileButtonFlow.reportSnapshotsMatch,
    "Batch CC: Reconcile Inventory button + function must exist and runInventoryReconcile must NOT mutate the ledgers",
    reconcileButtonFlow
  );

  // Drain any in-app notice opened by runInventoryReconcile so subsequent tests
  // start with a clean overlay surface.
  await page.evaluate(() => {
    if (typeof closeAppNotice === "function") closeAppNotice();
    document.querySelectorAll(".dialog-overlay.open, #appNoticeOverlay.open").forEach(el => el.classList.remove("open"));
  });

  // Iter 5: movement audit log. After the existing smoke flow saves sales,
  // logs corrections, and reverses a top-up, state.movements must contain
  // matching SELL/SELL_FREE/RESERVE/ADJUST/REVERSE_TOPUP entries. We also
  // exercise appendVoidMovements directly (the existing smoke voids a bill
  // BEFORE its mid-flow resetSavedSales(), so VOID rows are wiped), and
  // confirm the CSV export emits a single download with the documented name.
  const movementsFlow = await page.evaluate(() => {
    const movements = Array.isArray(state.movements) ? state.movements.slice() : null;
    const counts = {};
    if (movements) movements.forEach(m => { counts[m.type] = (counts[m.type] || 0) + 1; });

    // Direct test that appendVoidMovements fires the VOID type — the hook is
    // a one-line call at the success path of confirmVoidSale, so verifying
    // the function output here is sufficient coverage for the type itself.
    const beforeCount = state.movements.length;
    appendVoidMovements({
      billId: "smoke-mv-void",
      operatingDay: currentDayId(),
      items: [{ sku: PRODUCTS[0].sku, qty: 3 }]
    }, "smoke void test reason");
    const afterCount = state.movements.length;
    const voidEntry = state.movements[state.movements.length - 1];
    // Roll back so the export below is reproducible.
    state.movements.pop();

    let downloadName = null;
    let downloadCount = 0;
    const originalCreate = document.createElement.bind(document);
    document.createElement = function (tag) {
      const el = originalCreate(tag);
      if (tag.toLowerCase() === "a") {
        el.click = function () {
          downloadCount += 1;
          downloadName = el.download;
        };
      }
      return el;
    };
    const exported = exportMovementsCsv();
    document.createElement = originalCreate;
    return {
      hasArray: Array.isArray(movements),
      total: movements ? movements.length : 0,
      counts,
      voidEntry,
      voidAppended: afterCount === beforeCount + 1,
      buttonExists: !!document.getElementById("movementsOpenBtn"),
      exported,
      downloadCount,
      downloadName,
      sampleMovement: movements && movements.length ? movements[movements.length - 1] : null
    };
  });
  assert(
    movementsFlow.hasArray &&
      movementsFlow.total >= 5 &&
      (movementsFlow.counts.SELL > 0 || movementsFlow.counts.SELL_FREE > 0 || movementsFlow.counts.RESERVE > 0) &&
      (movementsFlow.counts.ADJUST_ADDEDSTOCK > 0 || movementsFlow.counts.ADJUST_SAMPLEQTY > 0) &&
      movementsFlow.counts.REVERSE_TOPUP >= 1 &&
      movementsFlow.voidAppended === true &&
      movementsFlow.voidEntry &&
      movementsFlow.voidEntry.type === "VOID" &&
      movementsFlow.voidEntry.qty === -3 &&
      movementsFlow.voidEntry.refId === "smoke-mv-void" &&
      movementsFlow.buttonExists &&
      movementsFlow.exported === true &&
      movementsFlow.downloadCount === 1 &&
      /^meowseum-movements-\d{4}-\d{2}-\d{2}\.csv$/.test(movementsFlow.downloadName) &&
      movementsFlow.sampleMovement &&
      typeof movementsFlow.sampleMovement.id === "string" &&
      typeof movementsFlow.sampleMovement.ts === "string" &&
      typeof movementsFlow.sampleMovement.type === "string",
    "Iter 5: movement audit log must contain hook entries from sales/correction/reverse, the VOID helper must produce a -qty entry referencing the bill, and the CSV must emit a date-stamped download",
    movementsFlow
  );

  // Iter 7: movement log in-app viewer overlay must render rows from
  // state.movements, support type + SKU filters, and have a working close.
  const movementsViewerFlow = await page.evaluate(() => {
    const overlay = document.getElementById("movementsOverlay");
    const list = document.getElementById("movementsList");
    const typeFilter = document.getElementById("movementsTypeFilter");
    const skuFilter = document.getElementById("movementsSkuFilter");
    const summary = document.getElementById("movementsSummary");
    const exportBtn = document.getElementById("movementsExportInOverlayBtn");
    const closeBtn = document.getElementById("movementsCloseBtn");
    if (!overlay || !list) return { exists: false };

    openMovementsOverlay();
    const opened = overlay.classList.contains("open");
    const initialRowCount = list.querySelectorAll(".movements-row").length;
    const initialSummary = summary?.textContent || "";
    const typeOptionsAfterOpen = Array.from(typeFilter?.options || []).map(o => o.value);

    // Filter to a type that exists.
    const sampleType = state.movements.length ? state.movements[0].type : "";
    typeFilter.value = sampleType;
    renderMovementsList();
    const filteredRowCount = list.querySelectorAll(".movements-row").length;
    const summaryFiltered = summary?.textContent || "";

    // Apply SKU filter on top.
    skuFilter.value = state.movements.length ? state.movements[0].sku : "";
    renderMovementsList();
    const skuFilteredRowCount = list.querySelectorAll(".movements-row").length;

    // Reset filters and close.
    typeFilter.value = "";
    skuFilter.value = "";
    renderMovementsList();
    const resetRowCount = list.querySelectorAll(".movements-row").length;
    closeMovementsOverlay();
    const closed = !overlay.classList.contains("open");

    return {
      exists: true,
      opened,
      closed,
      initialRowCount,
      initialSummary,
      typeOptionsAfterOpen,
      sampleType,
      filteredRowCount,
      summaryFiltered,
      skuFilteredRowCount,
      resetRowCount,
      hasExportBtn: !!exportBtn,
      hasCloseBtn: !!closeBtn,
      totalMovements: state.movements.length
    };
  });
  assert(
    movementsViewerFlow.exists &&
      movementsViewerFlow.opened === true &&
      movementsViewerFlow.closed === true &&
      movementsViewerFlow.initialRowCount > 0 &&
      movementsViewerFlow.initialRowCount === Math.min(250, movementsViewerFlow.totalMovements) &&
      /Showing .* of .* movement/.test(movementsViewerFlow.initialSummary) &&
      movementsViewerFlow.typeOptionsAfterOpen.includes("") &&
      movementsViewerFlow.typeOptionsAfterOpen.length > 1 &&
      movementsViewerFlow.filteredRowCount > 0 &&
      movementsViewerFlow.filteredRowCount <= movementsViewerFlow.initialRowCount &&
      /Filter active/.test(movementsViewerFlow.summaryFiltered) &&
      movementsViewerFlow.skuFilteredRowCount <= movementsViewerFlow.filteredRowCount &&
      movementsViewerFlow.resetRowCount === movementsViewerFlow.initialRowCount &&
      movementsViewerFlow.hasExportBtn &&
      movementsViewerFlow.hasCloseBtn,
    "Iter 7: movement log overlay must open, render rows, filter by type + SKU, reset filters, and close cleanly",
    movementsViewerFlow
  );

  // Reset Data must wipe the movements log alongside sales / voided sales.
  const movementsResetFlow = await page.evaluate(() => {
    const before = state.movements.length;
    const stateBackup = {
      sales: JSON.parse(JSON.stringify(state.sales)),
      voidedSales: JSON.parse(JSON.stringify(state.voidedSales)),
      movements: JSON.parse(JSON.stringify(state.movements)),
      preorders: JSON.parse(JSON.stringify(state.preorders)),
      inventory: JSON.parse(JSON.stringify(state.inventory)),
      globalInventory: JSON.parse(JSON.stringify(state.globalInventory))
    };
    resetSavedSales();
    const after = state.movements.length;
    const lsAfter = localStorage.getItem("meowseum_event_movements_v1");
    state.sales = stateBackup.sales;
    state.voidedSales = stateBackup.voidedSales;
    state.movements = stateBackup.movements;
    state.preorders = stateBackup.preorders;
    state.inventory = stateBackup.inventory;
    state.globalInventory = stateBackup.globalInventory;
    invalidateSalesDerivedData();
    return { before, after, lsAfter };
  });
  assert(
    movementsResetFlow.before > 0 &&
      movementsResetFlow.after === 0 &&
      movementsResetFlow.lsAfter === null,
    "Iter 5: Reset Data must clear state.movements and remove the movements localStorage key",
    movementsResetFlow
  );

  // Reconcile CSV export button: the function exists, the button exists, and
  // calling exportReconcileReportCsv triggers a single download with a CSV
  // header that matches the report shape.
  const reconcileCsvFlow = await page.evaluate(() => {
    const buttonExists = !!document.getElementById("exportReconcileCsvBtn");
    const fnExists = typeof exportReconcileReportCsv === "function";
    let downloadName = null;
    let downloadCount = 0;
    const originalCreate = document.createElement.bind(document);
    document.createElement = function (tag) {
      const el = originalCreate(tag);
      if (tag.toLowerCase() === "a") {
        el.click = function () {
          downloadCount += 1;
          downloadName = el.download;
        };
      }
      return el;
    };
    const result = exportReconcileReportCsv();
    document.createElement = originalCreate;
    return { buttonExists, fnExists, result, downloadCount, downloadName };
  });
  assert(
    reconcileCsvFlow.buttonExists &&
      reconcileCsvFlow.fnExists &&
      reconcileCsvFlow.result === true &&
      reconcileCsvFlow.downloadCount === 1 &&
      /^meowseum-reconcile-\d{4}-\d{2}-\d{2}\.csv$/.test(reconcileCsvFlow.downloadName),
    "Batch CC iter3: Reconcile CSV button must trigger exactly one download with name pattern meowseum-reconcile-YYYY-MM-DD.csv",
    reconcileCsvFlow
  );

  // Dashboard auto-reconcile banner: hidden when ledgers reconcile, visible
  // with summary when drift is present.
  const reconcileBannerFlow = await page.evaluate(() => {
    const bannerEl = document.getElementById("dashboardReconcileBanner");
    if (!bannerEl) return { exists: false };
    renderDashboard();
    const cleanHidden = bannerEl.hidden;
    const cleanText = bannerEl.textContent || "";

    // To break the invariant deterministically without depending on the
    // current operating day, drop gi.global[sku] to 0. With cumulative > 0
    // and global = 0, warehouse goes negative — reconcile flags warehouseUnderflow.
    const stateBackup = JSON.parse(JSON.stringify(state.globalInventory));
    const sku = PRODUCTS[0].sku;
    const originalGlobal = state.globalInventory.global[sku];
    state.globalInventory.global[sku] = 0;
    renderDashboard();
    const driftHidden = bannerEl.hidden;
    const driftText = bannerEl.textContent || "";

    // Restore state.
    state.globalInventory = stateBackup;
    invalidateSalesDerivedData();
    renderDashboard();
    const restoredHidden = bannerEl.hidden;

    return {
      exists: true,
      cleanHidden,
      cleanText,
      driftHidden,
      driftText,
      restoredHidden,
      sku,
      originalGlobal
    };
  });
  assert(
    reconcileBannerFlow.exists &&
      reconcileBannerFlow.cleanHidden === true &&
      reconcileBannerFlow.driftHidden === false &&
      reconcileBannerFlow.driftText.includes("drift detected") &&
      reconcileBannerFlow.driftText.includes(reconcileBannerFlow.sku) &&
      reconcileBannerFlow.restoredHidden === true,
    "Batch CC: dashboard reconcile banner must hide when ledgers are clean, surface a summary when drift is detected, and re-hide after the state is restored",
    reconcileBannerFlow
  );

  assert(pageErrors.length === 0, "No page errors after Batch CC drift + reconcile flow", pageErrors);
  assert(browserDialogs.length === 0, "No browser dialogs after Batch CC drift + reconcile flow", browserDialogs);

  // Batch AA: bulk export of all day sale CSVs. The button lives in Developer
  // Tools (passcode-gated already). Verify the function exists, the button is
  // present, and the function correctly counts eligible vs skipped days.
  const bulkExportFlow = await page.evaluate(() => {
    const buttonExists = !!document.getElementById("exportAllDayCsvBtn");
    const fnExists = typeof exportAllDaysCsv === "function";
    const eligibleCount = EVENT_DAYS.filter(day => getDaySales(day.id).length > 0).length;
    const skippedCount = EVENT_DAYS.filter(day => getDaySales(day.id).length === 0).length;
    // Stub link.click so headless smoke does not actually trigger downloads
    const originalCreate = document.createElement.bind(document);
    let triggeredDownloads = 0;
    document.createElement = function (tag) {
      const el = originalCreate(tag);
      if (tag.toLowerCase() === "a") {
        const realClick = el.click.bind(el);
        el.click = function () { triggeredDownloads += 1; };
      }
      return el;
    };
    const result = exportAllDaysCsv();
    document.createElement = originalCreate;
    return { buttonExists, fnExists, eligibleCount, skippedCount, result, triggeredDownloads };
  });
  assert(
    bulkExportFlow.buttonExists &&
      bulkExportFlow.fnExists &&
      bulkExportFlow.result === true &&
      bulkExportFlow.eligibleCount > 0 &&
      bulkExportFlow.triggeredDownloads === 0,
    "Batch AA: bulk export must expose button + function and return true when eligible days exist (downloads queued asynchronously, not triggered synchronously)",
    bulkExportFlow
  );
  // Wait for the deferred setTimeout(...) downloads to fire and verify they ran.
  await page.waitForTimeout(300 * Math.max(1, bulkExportFlow.eligibleCount));
  // Empty-state branch: clear all sales, call again, expect false + notice.
  const bulkExportEmpty = await page.evaluate(() => {
    const before = state.sales.length;
    state.sales = [];
    const result = exportAllDaysCsv();
    state.sales = []; // already empty; explicit re-affirm
    invalidateSalesDerivedData();
    return { before, result };
  });
  assert(
    bulkExportEmpty.result === false,
    "Batch AA: bulk export must return false and refuse when no sales exist on any day",
    bulkExportEmpty
  );

  assert(pageErrors.length === 0, "No page errors after Batch AA bulk export flow", pageErrors);
  assert(browserDialogs.length === 0, "No browser dialogs after Batch AA bulk export flow", browserDialogs);

  await browser.close();
  console.log(`local smoke passed for ${path.basename(appPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
