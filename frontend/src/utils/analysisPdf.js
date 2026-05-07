import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0));

const formatCurrency = (currencyCode, value) => `${currencyCode} ${formatNumber(value)}`;

const formatDate = (value) => {
  if (!value) return "";
  const [year, month, day] = String(value).split("-");
  if (!year || !month || !day) return String(value);
  return `${day}/${month}/${year.slice(-2)}`;
};

const formatTime = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

const dateFilterLabels = {
  postingDate: "Posting Date",
  dueDate: "Due Date",
  documentDate: "Document Date",
};

function addReportHeader(doc, { title, subtitle, criteria, companyName }) {
  const now = new Date();
  const pageWidth = doc.internal.pageSize.getWidth();
  const enabledDateFilters = Object.entries(criteria?.dateFilters || {}).filter(([, filter]) => filter?.enabled);
  const resolvedCompanyName = companyName || "SAP B1";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(resolvedCompanyName, pageWidth / 2, 18, { align: "center" });

  doc.setFontSize(14);
  doc.text(title || "Purchase Analysis Report", pageWidth / 2, 30, { align: "center" });

  if (subtitle) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(subtitle, pageWidth - 16, 40, { align: "right" });
  }

  doc.setFont("helvetica", "normal");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Date: ${formatDate(now.toISOString().slice(0, 10))}`, pageWidth - 16, 18, { align: "right" });
  doc.text(`Time: ${formatTime(now)}`, pageWidth - 16, 24, { align: "right" });

  let cursorY = subtitle ? 48 : 42;
  enabledDateFilters.forEach(([key, filter]) => {
    doc.text(`${dateFilterLabels[key] || key}: From ${formatDate(filter.from)} To ${formatDate(filter.to)}`, 14, cursorY);
    cursorY += 6;
  });

  return cursorY + 2;
}

function savePdf(doc, filename) {
  doc.save(filename);
}

function buildSummaryColumns({
  result,
  tab,
  customerLabel = "Supplier",
  salesEmployeeLabel = "Sales Employee",
  openAmountLabel = "Total Open PU",
}) {
  const columns = [
    { header: "#", dataKey: "rowNo" },
    {
      header:
        tab === "customers"
          ? `${customerLabel} Code`
          : tab === "items"
            ? "Item Code"
            : `${salesEmployeeLabel} Code`,
      dataKey: "entityCode",
    },
    {
      header:
        tab === "customers"
          ? `${customerLabel} Name`
          : tab === "items"
            ? "Item Description"
            : `${salesEmployeeLabel} Name`,
      dataKey: "entityName",
    },
  ];

  if (result.rows.some((row) => row.secondaryCode)) {
    columns.push({ header: "Grouping", dataKey: "secondaryGroup" });
  }

  if (result.rows.some((row) => row.periodLabel)) {
    columns.push({ header: "Period", dataKey: "periodLabel" });
  }

  if (tab === "items") {
    columns.push({ header: "Quantity", dataKey: "quantity" });
  }

  columns.push(
    { header: result.documentLabel || "Documents", dataKey: "documentCount" },
    { header: result.amountLabel || "Amount", dataKey: "totalAmount" },
    { header: openAmountLabel, dataKey: "openAmount" }
  );

  return columns;
}

function buildSummaryBody(result, tab) {
  return result.rows.map((row) => ({
    rowNo: row.rowNo,
    entityCode: row.entityCode || "",
    entityName: row.entityName || "",
    secondaryGroup: row.secondaryCode ? `${row.secondaryCode} - ${row.secondaryName || ""}` : "",
    periodLabel: row.periodLabel || "",
    quantity: tab === "items" ? formatNumber(row.quantity) : undefined,
    documentCount: String(row.documentCount ?? ""),
    totalAmount: formatCurrency(result.currencyCode, row.totalAmount),
    openAmount: formatCurrency(result.currencyCode, row.openAmount),
  }));
}

function buildSummaryFoot(result, tab) {
  if (!result.totals) return [];

  return [
    {
      rowNo: "Total",
      entityCode: "",
      entityName: "",
      secondaryGroup: "",
      periodLabel: "",
      quantity: tab === "items" ? formatNumber(result.totals.quantity) : undefined,
      documentCount: String(result.totals.documentCount ?? ""),
      totalAmount: formatCurrency(result.currencyCode, result.totals.totalAmount),
      openAmount: formatCurrency(result.currencyCode, result.totals.openAmount),
    },
  ];
}

function buildPurchaseDetailColumns(result) {
  if (result.detailLayout === "sapDocument") {
    return [
      { header: "#", dataKey: "rowNo" },
      { header: "Document", dataKey: "documentRef" },
      { header: "Installment", dataKey: "installmentLabel" },
      { header: "Sales Employee", dataKey: "salesEmployee" },
      { header: "Posting Date", dataKey: "postingDate" },
      { header: "Due Date", dataKey: "dueDate" },
      { header: "Supplier Name", dataKey: "customerName" },
      { header: result.chartData?.primaryLabel || "Purchased Amount", dataKey: "purchasedAmount" },
      { header: result.chartData?.secondaryLabel || "Applied Amount", dataKey: "appliedAmount" },
      { header: "Agreement No.", dataKey: "agreementNo" },
    ];
  }

  return [
    { header: "#", dataKey: "rowNo" },
    { header: "Document No", dataKey: "documentNo" },
    { header: "Posting Date", dataKey: "postingDate" },
    { header: "Supplier Code", dataKey: "customerCode" },
    { header: "Supplier Name", dataKey: "customerName" },
    { header: "Item Code", dataKey: "itemCode" },
    { header: "Item Name", dataKey: "itemName" },
    { header: "Quantity", dataKey: "quantity" },
    { header: "Price", dataKey: "price" },
    { header: "Line Total", dataKey: "lineTotal" },
    { header: "Sales Employee", dataKey: "salesEmployee" },
  ];
}

function buildPurchaseDetailBody(result) {
  if (result.detailLayout === "sapDocument") {
    return result.rows.map((row) => ({
      rowNo: row.rowNo,
      documentRef: row.documentRef || "",
      installmentLabel: row.installmentLabel || "",
      salesEmployee: row.salesEmployee || "",
      postingDate: formatDate(row.postingDate),
      dueDate: formatDate(row.dueDate),
      customerName: row.customerName || "",
      purchasedAmount: formatCurrency(result.currencyCode, row.purchasedAmount),
      appliedAmount: formatCurrency(result.currencyCode, row.appliedAmount),
      agreementNo: row.agreementNo || "",
    }));
  }

  return result.rows.map((row) => ({
    rowNo: row.rowNo,
    documentNo: row.documentNo || "",
    postingDate: formatDate(row.postingDate),
    customerCode: row.customerCode || "",
    customerName: row.customerName || "",
    itemCode: row.itemCode || "",
    itemName: row.itemName || "",
    quantity: formatNumber(row.quantity),
    price: formatCurrency(result.currencyCode, row.price),
    lineTotal: formatCurrency(result.currencyCode, row.lineTotal),
    salesEmployee: row.salesEmployee || "",
  }));
}

function buildPurchaseDetailFoot(result) {
  if (!result.totals) return [];

  if (result.detailLayout === "sapDocument") {
    return [
      {
        rowNo: "Total",
        documentRef: "",
        installmentLabel: "",
        salesEmployee: "",
        postingDate: "",
        dueDate: "",
        customerName: "",
        purchasedAmount: formatCurrency(result.currencyCode, result.totals.purchasedAmount),
        appliedAmount: formatCurrency(result.currencyCode, result.totals.appliedAmount),
        agreementNo: "",
      },
    ];
  }

  return [
    {
      rowNo: "Total",
      documentNo: "",
      postingDate: "",
      customerCode: "",
      customerName: "",
      itemCode: "",
      itemName: "",
      quantity: formatNumber(result.totals.quantity),
      price: "",
      lineTotal: formatCurrency(result.currencyCode, result.totals.totalAmount),
      salesEmployee: "",
    },
  ];
}

function renderTable(doc, { startY, columns, body, foot }) {
  autoTable(doc, {
    startY,
    head: [columns.map((column) => column.header)],
    body: body.map((row) => columns.map((column) => row[column.dataKey] ?? "")),
    foot: foot.length ? [columns.map((column) => foot[0][column.dataKey] ?? "")] : undefined,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 2,
      lineColor: [130, 130, 130],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    footStyles: {
      fillColor: [250, 250, 250],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    margin: { left: 12, right: 12, top: 12, bottom: 12 },
    didDrawPage: (hookData) => {
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.text(`Page ${hookData.pageNumber}`, pageWidth - 16, pageHeight - 8, { align: "right" });
    },
  });
}

export function exportPurchaseSummaryPdf({
  result,
  criteria,
  tab,
  customerLabel = "Supplier",
  salesEmployeeLabel = "Sales Employee",
  openAmountLabel = "Total Open PU",
}) {
  if (!result?.rows?.length) return;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const startY = addReportHeader(doc, {
    companyName: result.companyName,
    title: result.title || "Purchase Analysis by Supplier (Annual)",
    subtitle: result.documentLabel || "A/P Invoices",
    criteria,
  });

  renderTable(doc, {
    startY,
    columns: buildSummaryColumns({ result, tab, customerLabel, salesEmployeeLabel, openAmountLabel }),
    body: buildSummaryBody(result, tab),
    foot: buildSummaryFoot(result, tab),
  });

  savePdf(doc, "purchase-analysis-summary.pdf");
}

export function exportPurchaseDetailPdf({ result, criteria }) {
  if (!result?.rows?.length) return;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const startY = addReportHeader(doc, {
    companyName: result.companyName,
    title: result.title || "Purchase Analysis Detailed Report",
    subtitle: result.chartData?.primaryLabel || "Detailed Report",
    criteria,
  });

  renderTable(doc, {
    startY,
    columns: buildPurchaseDetailColumns(result),
    body: buildPurchaseDetailBody(result),
    foot: buildPurchaseDetailFoot(result),
  });

  savePdf(doc, "purchase-analysis-detail.pdf");
}
