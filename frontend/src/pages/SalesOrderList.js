import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSalesOrders } from '../api/salesOrderApi';

const getErrorMessage = (error, fallbackMessage) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (detail?.error?.message) return detail.error.message;
  if (detail?.message) return detail.message;
  return error?.message || fallbackMessage;
};

function SalesOrderListPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [pageState, setPageState] = useState({
    loading: true,
    error: '',
  });

  useEffect(() => {
    let ignore = false;

    const loadOrders = async () => {
      setPageState({ loading: true, error: '' });

      try {
        const response = await fetchSalesOrders();
        console.log("sale order list:",response.data.orders);
        if (!ignore) {
          setOrders(response.data.orders || []);
          setPageState({ loading: false, error: '' });
        }
      } catch (error) {
        if (!ignore) {
          setPageState({
            loading: false,
            error: getErrorMessage(error, 'Failed to load sales orders.'),
          });
        }
      }
    };

    loadOrders();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Open Sales Orders</h2>
          <small className="text-muted">Only sales orders with open status are shown.</small>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => navigate('/sales-order')}
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
                <th>Posting Date</th>
                <th>Delivery Date</th>
                <th>Status</th>
                <th>Lines</th>
                <th className="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              {pageState.loading && (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    Loading sales orders...
                  </td>
                </tr>
              )}

              {!pageState.loading && orders.length === 0 && (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-4">
                    No open sales orders found.
                  </td>
                </tr>
              )}

              {!pageState.loading &&
                orders.map((order) => (
                  <tr key={order.doc_entry}>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() =>
                          navigate('/sales-order', {
                            state: { salesOrderDocEntry: order.doc_entry },
                          })
                        }
                      >
                        Edit
                      </button>
                    </td>
                    <td>{order.doc_num}</td>
                    <td>{order.customer_code}</td>
                    <td>{order.customer_name}</td>
                    <td>{order.posting_date}</td>
                    <td>{order.delivery_date}</td>
                    <td>{order.status}</td>
                    <td>{order.line_count ?? '-'}</td>
                    <td className="text-end">{Number(order.total_amount || 0).toFixed(2)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SalesOrderListPage;
