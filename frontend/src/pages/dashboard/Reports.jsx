import { useState } from "react";
import { State, Stat, StatusBars } from "../../components/ui.jsx";
import { useAsync, useTitle } from "../../hooks.js";
import { api, money } from "../../services/api.js";

export default function Reports() {
  useTitle("Reports");
  const [range, setRange] = useState({ fromDate: "", toDate: "" });
  const [applied, setApplied] = useState({});
  const rep = useAsync(() => api.report(applied), [applied]);
  const r = rep.data;

  const apply = (e) => {
    e.preventDefault();
    setApplied({ ...(range.fromDate ? { fromDate: range.fromDate } : {}), ...(range.toDate ? { toDate: range.toDate } : {}) });
  };

  return (
    <>
      <form className="c frm" onSubmit={apply}>
        <label className="mu sm">From <input type="date" value={range.fromDate} onChange={(e) => setRange({ ...range, fromDate: e.target.value })} /></label>
        <label className="mu sm">To <input type="date" value={range.toDate} onChange={(e) => setRange({ ...range, toDate: e.target.value })} /></label>
        <button type="submit" className="b bp">Generate report</button>
      </form>
      <State loading={rep.loading} error={rep.error}>
        {r && (
          <>
            <div className="g4">
              <Stat l="Revenue" v={money(r.revenue, r.currency)} s="Delivered orders" />
              <Stat l="Pipeline value" v={money(r.pipelineValue, r.currency)} />
              <Stat l="Cancelled value" v={money(r.cancelledValue, r.currency)} />
              <Stat l="Average order value" v={money(r.averageOrderValue, r.currency)} />
            </div>
            <div className="c"><b>Orders by status</b><StatusBars byStatus={r.byStatus} total={r.totalOrders} currency={r.currency} /></div>
          </>
        )}
      </State>
    </>
  );
}
