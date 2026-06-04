const parseAmount = (value) => {
  const parsed = Number(String(value ?? "").replace(/,/g, "").replace(/^INR\s*/i, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const toNumber = (value) => Number(value || 0);

const roundMoney = (value) => Number(parseAmount(value).toFixed(2));

const toSapDate = (value) => {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString().slice(0, 10);

  const raw = String(value).trim();
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const shortMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{2,4})$/);
  if (shortMatch) {
    const [, day, month, year] = shortMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month}-${day}`;
  }

  return raw;
};

const cleanObject = (object) =>
  Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );

const numericOrUndefined = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const yesNo = (value) => (value ? "tYES" : "tNO");

const requireField = (value, message) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new Error(message);
  }
  return String(value).trim();
};

const getPaymentMeansPaidTotal = (paymentMeans = {}) => {
  const means = paymentMeans || {};
  const checkTotal = (means.check?.rows || []).reduce(
    (sum, row) => sum + parseAmount(row.amount),
    0,
  );

  return (
    checkTotal +
    parseAmount(means.bankTransfer?.total) +
    parseAmount(means.creditCard?.amountDue) +
    parseAmount(means.cash?.total)
  );
};

const buildPaymentMeansPayload = ({
  paymentMeans,
  fallbackAmount,
  fallbackCashAccount,
  fallbackDate,
  label = "Payment Means",
} = {}) => {
  const expectedAmount = parseAmount(fallbackAmount);
  const meansPaidTotal = getPaymentMeansPaidTotal(paymentMeans);

  if (!paymentMeans || meansPaidTotal <= 0) {
    const cashAccount = String(fallbackCashAccount || "").trim();
    if (expectedAmount <= 0) {
      return { paidTotal: 0, fields: {}, usesFallbackCash: true };
    }
    if (!cashAccount) {
      throw new Error(`${label}: Cash Account is required for cash payments.`);
    }

    return {
      paidTotal: expectedAmount,
      fields: {
        CashAccount: cashAccount,
        CashSum: roundMoney(expectedAmount),
      },
      usesFallbackCash: true,
    };
  }

  if (expectedAmount > 0 && Math.abs(meansPaidTotal - expectedAmount) > 0.01) {
    throw new Error(`${label}: Paid amount must equal Total Amount Due.`);
  }

  const fields = {};
  const bankChargeAmount = parseAmount(paymentMeans.bankCharge);
  if (bankChargeAmount > 0) {
    fields.BankChargeAmount = roundMoney(bankChargeAmount);
  }

  const cashAmount = parseAmount(paymentMeans.cash?.total);
  if (cashAmount > 0) {
    const cashAccount = requireField(
      paymentMeans.cash?.glAccount || fallbackCashAccount,
      `${label}: Cash G/L Account is required.`,
    );
    fields.CashAccount = cashAccount;
    fields.CashSum = roundMoney(cashAmount);
  }

  const transferAmount = parseAmount(paymentMeans.bankTransfer?.total);
  if (transferAmount > 0) {
    fields.TransferAccount = requireField(
      paymentMeans.bankTransfer?.glAccount,
      `${label}: Bank Transfer G/L Account is required.`,
    );
    fields.TransferDate = toSapDate(
      requireField(
        paymentMeans.bankTransfer?.transferDate || fallbackDate,
        `${label}: Bank Transfer Date is required.`,
      ),
    );
    fields.TransferReference = String(paymentMeans.bankTransfer?.reference || "").trim() || undefined;
    fields.TransferSum = roundMoney(transferAmount);
  }

  const checkRows = (paymentMeans.check?.rows || [])
    .map((row) => ({ ...row, amount: parseAmount(row.amount) }))
    .filter((row) => row.amount > 0);

  if (checkRows.length) {
    const checkAccount = String(paymentMeans.check?.glAccount || "").trim();
    if (checkAccount) fields.CheckAccount = checkAccount;

    fields.PaymentChecks = checkRows.map((row, index) => {
      const bankCode = requireField(
        row.bankCode || row.bankName,
        `${label}: Bank Code is required for check row ${index + 1}.`,
      );
      const countryCode = String(row.countryRegion || row.country || "").trim();

      return cleanObject({
        DueDate: toSapDate(row.dueDate || fallbackDate),
        CheckSum: roundMoney(row.amount),
        CountryCode: countryCode && countryCode.length <= 3 ? countryCode : undefined,
        BankCode: bankCode,
        Branch: String(row.branch || "").trim() || undefined,
        AccounttNum: String(row.account || "").trim() || undefined,
        CheckNumber: numericOrUndefined(row.checkNo),
        CheckAccount: checkAccount || undefined,
        Trnsfrable: yesNo(row.endorsable),
        ManualCheck: row.manualCheck ? "tYES" : undefined,
        OriginallyIssuedBy: String(row.originallyIssuedBy || "").trim() || undefined,
        FiscalID: String(row.fiscalId || "").trim() || undefined,
      });
    });
  }

  const creditAmount = parseAmount(paymentMeans.creditCard?.amountDue);
  if (creditAmount > 0) {
    const card = paymentMeans.creditCard || {};
    const creditCardCode = requireField(card.creditCardCode, `${label}: Credit Card Name is required.`);
    const cardValidUntil = requireField(card.validUntil, `${label}: Credit Card Valid Until is required.`);
    const cardNumber = requireField(card.creditCardNo, `${label}: Credit Card No. is required.`);
    const paymentCount = Math.max(1, Number(card.noOfPayments || 1));
    const creditType = String(card.transactionType || "").toLowerCase() === "telephone" ? "cr_Telephone" : "cr_Regular";

    fields.PaymentCreditCards = [
      cleanObject({
        CreditCard: numericOrUndefined(creditCardCode) ?? creditCardCode,
        CreditCardNumber: cardNumber,
        CardValidUntil: toSapDate(cardValidUntil),
        CreditSum: roundMoney(creditAmount),
        CreditAcct: String(card.glAccount || "").trim() || undefined,
        OwnerIdNum: String(card.idNo || "").trim() || undefined,
        OwnerPhone: String(card.telephoneNo || "").trim() || undefined,
        PaymentMethodCode: numericOrUndefined(card.paymentMethod),
        VoucherNum: String(card.voucherNo || "").trim() || undefined,
        CreditType: creditType,
        NumOfCreditPayments: Number.isFinite(paymentCount) ? paymentCount : 1,
        FirstPaymentSum: parseAmount(card.firstPartialPayment) > 0 ? roundMoney(card.firstPartialPayment) : undefined,
        AdditionalPaymentSum: parseAmount(card.eachAdditionalPayment) > 0 ? roundMoney(card.eachAdditionalPayment) : undefined,
      }),
    ];
  }

  return {
    paidTotal: meansPaidTotal,
    fields,
    usesFallbackCash: false,
  };
};

const mapPaymentMeansFromDb = ({
  header = {},
  checkRows = [],
  creditRows = [],
  paymentDirection = "incoming",
} = {}) => {
  const cashSum = toNumber(header.CashSum);
  const transferSum = toNumber(header.TrsfrSum);

  return {
    currency: header.DocCurr || header.DocCur || "INR",
    overallAmount: toNumber(header.DocTotal),
    bankCharge: toNumber(header.BcgSum),
    check: {
      glAccount: header.CheckAcct || checkRows[0]?.CheckAct || "",
      glAccountName: "",
      searchByBankCode: false,
      rows: checkRows.length
        ? checkRows.map((row, index) => ({
            id: `posted-check-${index}`,
            dueDate: toSapDate(row.DueDate),
            amount: toNumber(row.CheckSum),
            countryRegion: row.CountryCod || "",
            bankCode: row.BankCode || "",
            bankName: row.BankName || row.BankCode || "",
            branch: row.Branch || "",
            account: row.AcctNum || "",
            checkNo: row.CheckNum ? String(row.CheckNum) : "",
            endorsable: row.Trnsfrable === "Y" || row.Trnsfrable === "tYES",
            manualCheck: row.ManualChk === "Y" || row.ManualChk === "tYES",
            originallyIssuedBy: row.OrigIssdBy || "",
            fiscalId: row.FiscalId || "",
          }))
        : [],
    },
    bankTransfer: {
      glAccount: header.TrsfrAcct || "",
      glAccountName: "",
      transferDate: toSapDate(header.TrsfrDate),
      reference: header.TrsfrRef || "",
      total: transferSum,
    },
    creditCard: {
      creditCardCode: creditRows[0]?.CreditCard ? String(creditRows[0].CreditCard) : "",
      creditCardName: creditRows[0]?.CardName || "",
      glAccount: creditRows[0]?.CreditAcct || "",
      glAccountName: "",
      creditCardNo: creditRows[0]?.CrCardNum || "",
      validUntil: toSapDate(creditRows[0]?.CardValid),
      idNo: creditRows[0]?.OwnerIdNum || "",
      telephoneNo: creditRows[0]?.OwnerPhone || "",
      paymentMethod: creditRows[0]?.CrTypeCode ? String(creditRows[0].CrTypeCode) : "",
      amountDue: toNumber(creditRows[0]?.CreditSum),
      noOfPayments: creditRows[0]?.NumOfPmnts ? String(creditRows[0].NumOfPmnts) : "1",
      firstPartialPayment: toNumber(creditRows[0]?.FirstSum),
      eachAdditionalPayment: toNumber(creditRows[0]?.AddPmntSum),
      voucherNo: creditRows[0]?.VoucherNum || "",
      transactionType: creditRows[0]?.CreditType === "cr_Telephone" || Number(creditRows[0]?.CreditType) === 1 ? "Telephone" : "Regular",
      approvalTelephone: creditRows[0]?.Phone || "",
      companyId: creditRows[0]?.CompanyId || "",
    },
    cash: {
      glAccount: header.CashAcct || "",
      glAccountName: "",
      primaryFormItem:
        paymentDirection === "outgoing"
          ? "Payments for Invoices to Vendors"
          : "Payments for Invoices from Customers",
      total: cashSum,
    },
  };
};

module.exports = {
  buildPaymentMeansPayload,
  getPaymentMeansPaidTotal,
  mapPaymentMeansFromDb,
  parseAmount,
};
