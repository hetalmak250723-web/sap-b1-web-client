import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchARInvoiceList } from '../api/arInvoiceApi';

const getErrorMessage = (error, fallbackMessage) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (detail?.error?.message) return detail.error.message;
  if (detail?.message) return detail.message;
  return error?.message || fallbackMessage;
};

function ARInvoiceListPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [pageState, setPageState] = useState({
    loading: true,
    error: '',
  });

  useEffect(() => {
    let ignore = false;

    const loadInvoices = async () => {
      setPageState({ loading: true, error: '' });

      try {
        const response = await fetchARInvoiceList();
        console.log("AR invoice list:", response.data);
        if (!ignore) {
          setInvoices(response.data.ar_invoices || []);
          setPageState({ loading: false, error: '' });
        }
      } catch (error) {
        if (!ignore) {
          setPageState({
            loading: false,
            error: getErrorMessage(error, 'Failed to load AR invoices.'),
          });
        }
      }
    };

    loadInvoices();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Open AR Invoices</h2>
          <small className="text-muted">Only invoices with open status are shown.</small>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => navigate('/ar-invoice')}
        >
          Back
        </button>
      </div>

      {pageState.error && (
        <div className="alert alert-danger" role="alert">
          {pageState.error}
        </div>
      )}

      <div className="card p-3">
        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Action</th>
                <th>Doc No</th>
                <th>Customer Code</th>
                <th>Customer Name</th>
                <th>Doc Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Lines</th>
                <th className="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              {pageState.loading && (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    Loading AR invoices...
                  </td>
                </tr>
              )}

              {!pageState.loading && invoices.length === 0 && (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-4">
                    No open AR invoices found.
                  </td>
                </tr>
              )}

              {!pageState.loading &&
                invoices.map((invoice) => (
                  <tr key={invoice.DocEntry}>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() =>
                          navigate('/ar-invoice', {
                            state: { arInvoiceDocEntry: invoice.DocEntry },
                          })
                        }
                      >
                        Edit
                      </button>
                    </td>
                    <td>{invoice.DocNum}</td>
                    <td>{invoice.CardCode}</td>
                    <td>{invoice.CardName}</td>
                    <td>{invoice.DocDate}</td>
                    <td>{invoice.DocDueDate}</td>
                    <td>{invoice.DocumentStatus}</td>
                    <td>-</td>
                    <td className="text-end">{Number(invoice.DocTotal || 0).toFixed(2)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ARInvoiceListPage;
