import { useState } from "react";
import { Pager, Pill, State } from "../../components/ui.jsx";
import { useAsync, useTitle } from "../../hooks.js";
import { api, money, shortDate } from "../../services/api.js";

const FILTERS = ["", "pending", "processing", "shipped", "delivered", "cancelled"];
// The same status flow the backend enforces. delivered and cancelled are final.
const NEXT = { pending: ["processing", "cancelled"], processing: ["shipped", "cancelled"], shipped: ["delivered"] };

export default function Orders() {
  useTitle("Orders");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const list = useAsync(() => api.orders({ page, limit: 10, status }), [page, status]);

  async function move(order, next) {
    setError(""); setBusyId(order.id);
    try { await api.setOrderStatus(order.id, next); list.reload(); }
    catch (e) { setError(e.message); }
    finally { setBusyId(""); }
  }

  const d = list.data;
  return (
    <>
      <div className="chips">
        {FILTERS.map((f) => (
          <button type="button" key={f || "all"} className={`chip${status === f ? " on" : ""}`} onClick={() => { setStatus(f); setPage(1); }}>{f || "All"}</button>
        ))}
      </div>
      {error && <p className="er" role="alert">{error}</p>}
      <State loading={list.loading} error={list.error}>
        <div className="tw c">
          <table>
            <thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th><th>Created</th><th>Action</th></tr></thead>
            <tbody>
              {d?.orders.map((o) => (
                <tr key={o.id}>
                  <td><code>{o.orderNumber}</code></td>
                  <td>{o.customer?.name || "-"}</td>
                  <td>{money(o.amount, o.currency)}</td>
                  <td><Pill t={o.status} /></td>
                  <td>{shortDate(o.createdAt)}</td>
                  <td>
                    {NEXT[o.status] ? NEXT[o.status].map((n) => (
                      <button type="button" key={n} className="b" disabled={busyId === o.id} onClick={() => move(o, n)}>{n === "cancelled" ? "Cancel" : `Move to ${n}`}</button>
                    )) : <span className="mu">Final</span>}
                  </td>
                </tr>
              ))}
              {d && !d.orders.length && <tr><td colSpan="6" className="mu">No orders found.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pager p={d?.pagination} onPage={setPage} />
      </State>
    </>
  );
}
