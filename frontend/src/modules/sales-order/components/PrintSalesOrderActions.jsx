import React, { useEffect, useRef, useState } from 'react';
import { fetchSalesOrderPrintLayouts, printSalesOrder } from '../../../api/salesOrderApi';
import { base64ToPdfBlob, downloadPdfBlob, openPdfBlobInNewTab } from '../../../utils/pdfUtils';

const DEFAULT_DOC_CODE = 'RDR20010';
const DEFAULT_SCHEMA = 'NCPL_110126';

const buildDefaultFileName = (docEntry, docNumber, docCode) =>
  `sales-order-${docNumber || docEntry || 'document'}-${docCode || 'layout'}.pdf`;

const buildLayoutLabel = (layout) => {
  const name = layout.layout_name || layout.layout_id;
  const type = layout.layout_type ? ` • ${layout.layout_type}` : '';
  const language = layout.language_name ? ` • ${layout.language_name}` : '';
  const support = layout.is_export_supported ? '' : ' • PDF API not supported';
  return `${layout.layout_id} - ${name}${type}${language}${support}`;
};

function PrintSalesOrderActions({
  docEntry,
  docNumber,
  disabled = false,
  defaultDocCode = DEFAULT_DOC_CODE,
  defaultSchema = DEFAULT_SCHEMA,
  onSuccess,
  onError,
}) {
  const [docCode, setDocCode] = useState(defaultDocCode);
  const [schema, setSchema] = useState(defaultSchema);
  const [loading, setLoading] = useState(false);
  const [layoutsLoading, setLayoutsLoading] = useState(false);
  const [layouts, setLayouts] = useState([]);
  const [cachedPdfByKey, setCachedPdfByKey] = useState({});
  const onErrorRef = useRef(onError);

  const notifySuccess = (message) => {
    if (onSuccess) {
      onSuccess(message);
    }
  };

  const notifyError = (message) => {
    if (onError) {
      onError(message);
    }
  };

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    setCachedPdfByKey({});
  }, [docEntry, docCode, schema]);

  useEffect(() => {
    let ignore = false;

    const loadLayouts = async () => {
      setLayoutsLoading(true);

      try {
        const response = await fetchSalesOrderPrintLayouts();
        const nextLayouts = Array.isArray(response.data?.layouts) ? response.data.layouts : [];

        if (ignore) {
          return;
        }

        setLayouts(nextLayouts);

        setDocCode((currentDocCode) => {
          if (nextLayouts.length === 0) {
            return currentDocCode;
          }

          const currentLayout = nextLayouts.find((layout) => layout.layout_id === currentDocCode);
          if (currentLayout?.is_export_supported) {
            return currentDocCode;
          }

          const fallbackLayout =
            nextLayouts.find((layout) => layout.layout_id === defaultDocCode && layout.is_export_supported) ||
            nextLayouts.find((layout) => layout.is_export_supported) ||
            nextLayouts[0];

          return fallbackLayout.layout_id;
        });
      } catch (error) {
        if (!ignore) {
          onErrorRef.current?.(error.message || 'Failed to load sales order print layouts.');
        }
      } finally {
        if (!ignore) {
          setLayoutsLoading(false);
        }
      }
    };

    loadLayouts();

    return () => {
      ignore = true;
    };
  }, [defaultDocCode]);

  const getPdfDocument = async (layoutDocCode = docCode) => {
    const normalizedDocEntry = String(docEntry ?? '').trim();
    const normalizedDocCode = String(layoutDocCode ?? '').trim();
    const normalizedSchema = String(schema ?? '').trim();
    const cacheKey = `${normalizedDocEntry}::${normalizedDocCode}::${normalizedSchema}`;

    if (!normalizedDocEntry) {
      throw new Error('Save or load a sales order before printing.');
    }

    if (!normalizedDocCode) {
      throw new Error('Layout DocCode is required before printing.');
    }

    if (!normalizedSchema) {
      throw new Error('Schema is required before printing.');
    }

    if (cachedPdfByKey[cacheKey]) {
      return cachedPdfByKey[cacheKey];
    }

    const response = await printSalesOrder({
      docEntry: normalizedDocEntry,
      docCode: normalizedDocCode,
      schema: normalizedSchema,
    });

    const nextPdf = {
      blob: base64ToPdfBlob(response.data?.base64Pdf),
      fileName:
        response.data?.fileName || buildDefaultFileName(normalizedDocEntry, docNumber, normalizedDocCode),
      docEntry: normalizedDocEntry,
      docCode: normalizedDocCode,
      schema: normalizedSchema,
    };

    setCachedPdfByKey((current) => ({
      ...current,
      [cacheKey]: nextPdf,
    }));

    return nextPdf;
  };

  const handlePreview = async () => {
    const previewWindow = window.open('', '_blank');

    if (!previewWindow) {
      notifyError('Please allow pop-ups to preview the PDF.');
      return;
    }

    previewWindow.document.title = 'Generating sales order PDF...';
    previewWindow.document.body.innerHTML =
      '<p style="font-family: Segoe UI, Arial, sans-serif; padding: 16px;">Generating PDF preview...</p>';

    setLoading(true);

    try {
      const pdfDocument = await getPdfDocument();

      openPdfBlobInNewTab(pdfDocument.blob, previewWindow);
      notifySuccess(`Sales order PDF opened for layout ${pdfDocument.docCode}.`);
    } catch (error) {
      previewWindow.close();
      notifyError(error.message || 'Failed to preview the sales order PDF.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setLoading(true);

    try {
      const pdfDocument = await getPdfDocument();

      downloadPdfBlob(pdfDocument.blob, pdfDocument.fileName);
      notifySuccess(`Sales order PDF downloaded as ${pdfDocument.fileName}.`);
    } catch (error) {
      notifyError(error.message || 'Failed to download the sales order PDF.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    const printableLayouts = layouts.filter(
      (layout) => String(layout.layout_id || '').trim() && layout.is_export_supported
    );
    const skippedLayouts = layouts.filter(
      (layout) => String(layout.layout_id || '').trim() && !layout.is_export_supported
    );

    if (printableLayouts.length === 0) {
      notifyError('No sales order print layouts are available to download.');
      return;
    }

    setLoading(true);

    try {
      for (const layout of printableLayouts) {
        const pdfDocument = await getPdfDocument(layout.layout_id);
        downloadPdfBlob(pdfDocument.blob, pdfDocument.fileName);
      }

      const skippedMessage = skippedLayouts.length > 0
        ? ` Skipped ${skippedLayouts.length} PLD layout(s) because the API exports Crystal layouts only.`
        : '';
      notifySuccess(`Downloaded ${printableLayouts.length} sales order layout PDF(s).${skippedMessage}`);
    } catch (error) {
      notifyError(error.message || 'Failed to download all sales order layout PDFs.');
    } finally {
      setLoading(false);
    }
  };

  const selectedLayout = layouts.find((layout) => layout.layout_id === docCode) || null;
  const canExportSelectedLayout =
    !selectedLayout || selectedLayout.is_export_supported;
  const actionDisabled = disabled || loading || layoutsLoading || !docEntry || !canExportSelectedLayout;

  return (
    <div className="so-toolbar__group so-print-tools">
      <div className="so-toolbar__field">
        <label className="so-toolbar__field-label" htmlFor="sales-order-print-doc-code">
          Layout
        </label>
        <select
          id="sales-order-print-doc-code"
          className="so-toolbar__field-input so-toolbar__field-input--layout"
          value={docCode}
          onChange={(event) => setDocCode(event.target.value)}
          disabled={loading || layoutsLoading || disabled}
        >
          {layouts.length === 0 && (
            <option value={docCode}>
              {layoutsLoading ? 'Loading layouts...' : docCode || 'No layouts found'}
            </option>
          )}
          {layouts.map((layout) => (
            <option key={layout.layout_id} value={layout.layout_id} disabled={!layout.is_export_supported}>
              {buildLayoutLabel(layout)}
            </option>
          ))}
        </select>
      </div>

      <div className="so-toolbar__field">
        <label className="so-toolbar__field-label" htmlFor="sales-order-print-schema">
          Schema
        </label>
        <input
          id="sales-order-print-schema"
          className="so-toolbar__field-input so-toolbar__field-input--schema"
          value={schema}
          onChange={(event) => setSchema(event.target.value)}
          disabled={loading || disabled}
          placeholder="NCPL_110126"
        />
      </div>

      <button
        type="button"
        className="so-btn"
        onClick={handlePreview}
        disabled={actionDisabled}
        title={docEntry ? 'Open the selected sales order layout PDF in a new browser tab.' : 'Load a saved sales order to print.'}
      >
        {loading ? 'Generating PDF...' : 'Print Sales Order'}
      </button>

      <button
        type="button"
        className="so-btn"
        onClick={handleDownload}
        disabled={actionDisabled}
        title={docEntry ? 'Download the selected sales order layout PDF.' : 'Load a saved sales order to download.'}
      >
        Download PDF
      </button>

      <button
        type="button"
        className="so-btn"
        onClick={handleDownloadAll}
        disabled={actionDisabled || layouts.length === 0}
        title={docEntry ? 'Download all available sales order layout PDFs.' : 'Load a saved sales order to download all layouts.'}
      >
        {loading ? 'Generating PDF...' : 'Download All Layouts'}
      </button>
    </div>
  );
}

export default PrintSalesOrderActions;
