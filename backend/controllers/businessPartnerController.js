const sapService = require("../services/sapService");
const masterDataDbService = require("../services/masterDataDbService");

const createBP = async (req, res) => {
  const data = req.body;
  if (!data.CardName) return res.status(400).json({ message: "CardName is required." });
  if (!data.CardType) return res.status(400).json({ message: "CardType is required." });
  const series = String(data.Series ?? "");
  const isManual = !series || series === "0";

  if (isManual && !data.CardCode) {
    return res.status(400).json({ message: "CardCode is required for manual entry." });
  }

  try {
    if (!data.CardCode && !isManual) {
      const next = await masterDataDbService.getBPSeriesNextNumber(series);
      if (!next || next.isManual || !next.formattedCode) {
        return res.status(400).json({ message: `Could not get next number for series '${series}'.` });
      }
      data.CardCode = next.formattedCode;
    }

    const result = await sapService.createItem_generic("/BusinessPartners", data);
    res.status(201).json(result);
  } catch (err) {
    const msg =
      err.response?.data?.error?.message?.value ||
      err.response?.data?.error?.message ||
      err.message;
    console.error("[SAP createBP error]", msg, JSON.stringify(err.response?.data));
    res.status(err.response?.status || 500).json({ message: msg });
  }
};

const getBP = async (req, res) => {
  try {
    const row = await masterDataDbService.getBP(req.params.cardCode);
    if (!row) return res.status(404).json({ message: "Business Partner not found." });
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateBP = async (req, res) => {
  const { cardCode } = req.params;
  try {
    await sapService.request({
      method: "PATCH",
      url: `/BusinessPartners('${encodeURIComponent(cardCode)}')`,
      data: req.body,
    });
    const row = await masterDataDbService.getBP(cardCode);
    res.json(row || { CardCode: cardCode });
  } catch (err) {
    const msg = err.response?.data?.error?.message?.value || err.message;
    console.error("[SAP updateBP error]", msg, JSON.stringify(err.response?.data));
    res.status(err.response?.status || 500).json({ message: msg });
  }
};

const searchBP = async (req, res) => {
  try {
    const { query = "", type = "", top = 50, skip = 0 } = req.query;
    const rows = await masterDataDbService.searchBP(query, type, top, skip);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const lookupBPGroups = async (req, res) => {
  try {
    const rows = await masterDataDbService.lookupBPGroups(req.query.query || "");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Could not load BP groups: " + err.message });
  }
};

const lookupPaymentTerms = async (req, res) => {
  try {
    const rows = await masterDataDbService.lookupPaymentTerms(req.query.query || "");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const lookupSalesPersons = async (req, res) => {
  try {
    const rows = await masterDataDbService.lookupSalesPersons(req.query.query || "");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const lookupPriceLists = async (req, res) => {
  try {
    const rows = await masterDataDbService.lookupPriceLists(req.query.query || "");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const lookupCurrencies = async (req, res) => {
  try {
    const rows = await masterDataDbService.lookupCurrencies(req.query.query || "");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const lookupNumberingSeries = async (_req, res) => {
  try {
    const rows = await masterDataDbService.lookupBPSeries();
    const manual = {
      series: "0",
      name: "Manual",
      prefix: "",
      suffix: "",
      indicator: "",
      nextNumber: null,
      locked: false,
      isManual: true,
      isDefault: true,
    };
    const nonManual = rows.filter((row) => !row.isManual);
    res.json([manual, ...nonManual]);
  } catch (err) {
    res.json([
      {
        series: "0",
        name: "Manual",
        prefix: "",
        suffix: "",
        indicator: "",
        nextNumber: null,
        locked: false,
        isManual: true,
        isDefault: true,
      },
    ]);
  }
};

const getNextNumber = async (req, res) => {
  const { series } = req.params;
  if (String(series) === "0") {
    return res.json({
      series: "0",
      nextNumber: null,
      prefix: "",
      suffix: "",
      indicator: "",
      formattedCode: "",
      seriesName: "Manual",
      isManual: true,
    });
  }

  try {
    const row = await masterDataDbService.getBPSeriesNextNumber(series);
    if (!row) {
      return res.status(404).json({ message: `Series ${series} not found.` });
    }
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createBP,
  getBP,
  updateBP,
  searchBP,
  lookupBPGroups,
  lookupPaymentTerms,
  lookupSalesPersons,
  lookupPriceLists,
  lookupCurrencies,
  lookupNumberingSeries,
  getNextNumber,
};
