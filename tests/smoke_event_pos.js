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
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(`file:///${appPath.replace(/\\/g, "/")}`);
  await page.waitForSelector("#productGrid", { timeout: 5000 });

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
    };
  });

  assert(pageErrors.length === 0, "Page errors were reported", pageErrors);
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

  await browser.close();
  console.log(`local smoke passed for ${path.basename(appPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
