import { useState } from "react";
import { Pager, State } from "../../components/ui.jsx";
import { useAsync, useDebounced, useTitle } from "../../hooks.js";
import { api, shortDate } from "../../services/api.js";

export default function Customers() {
  useTitle("Customers");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  const list = useAsync(() => api.customers({ page, limit: 10, search: q }), [page, q]);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [msg, setMsg] = useState({ error: "", ok: "" });
  const [busy, setBusy] = useState(false);

  async function add(e) {
    e.preventDefault();
    setMsg({ error: "", ok: "" });
    if (!form.name.trim() || !form.email.trim()) return setMsg({ error: "Name and email are required.", ok: "" });
    setBusy(true);
    try {
      await api.createCustomer({ name: form.name.trim(), email: form.email.trim(), ...(form.phone.trim() ? { phone: form.phone.trim() } : {}) });
      setForm({ name: "", email: "", phone: "" });
      setMsg({ error: "", ok: "Customer created." });
      list.reload();
    } catch (err) { setMsg({ error: err.message, ok: "" }); }
    finally { setBusy(false); }
  }

  const d = list.data;
  return (
    <>
      <input className="sr" placeholder="Search name or email" aria-label="Search customers" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      <State loading={list.loading} error={list.error}>
        <div className="tw c">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Created</th></tr></thead>
            <tbody>
              {d?.customers.map((c) => <tr key={c.id}><td><b>{c.name}</b></td><td>{c.email}</td><td>{c.phone || "-"}</td><td>{shortDate(c.createdAt)}</td></tr>)}
              {d && !d.customers.length && <tr><td colSpan="4" className="mu">No customers found.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pager p={d?.pagination} onPage={setPage} />
      </State>
      <form className="c frm" onSubmit={add}>
        <input placeholder="Name" aria-label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Email" aria-label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Phone (optional)" aria-label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <button type="submit" className="b bp" disabled={busy}>Create customer</button>
      </form>
      {msg.error && <p className="er" role="alert">{msg.error}</p>}
      {msg.ok && <p className="cy" role="status">{msg.ok}</p>}
    </>
  );
}
