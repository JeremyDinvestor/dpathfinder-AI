import { Link } from "react-router-dom";
import { State, Stat, StatusBars } from "../../components/ui.jsx";
import { useAsync, useTitle } from "../../hooks.js";
import { api, money } from "../../services/api.js";

export default function Overview() {
  useTitle("Overview");
  const report = useAsync(() => api.report({}), []);
  const usage = useAsync(() => api.usage(7), []);
  const r = report.data;
  const u = usage.data?.totals;

  return (
    <>
      <State loading={report.loading} error={report.error}>
        {r && (
          <>
            <div className="g4">
              <Stat l="Customers" v={r.customerCount} />
              <Stat l="Total orders" v={r.totalOrders} />
              <Stat l="Revenue" v={money(r.revenue, r.currency)} s="Delivered orders" />
              <Stat l="Pipeline" v={money(r.pipelineValue, r.currency)} s="Pending, processing, shipped" />
            </div>
            <div className="g2">
              <div className="c"><b>Orders by status</b><StatusBars byStatus={r.byStatus} total={r.totalOrders} currency={r.currency} /></div>
              <div className="c">
                <b>Ask the agent</b>
                <p className="mu">Run operations in your own workspace.</p>
                <Link className="b bp" to="/dashboard/playground">Open AI Playground</Link>
              </div>
            </div>
          </>
        )}
      </State>
      <div className="c">
        <b>Requests, last 7 days</b>
        <State loading={usage.loading} error={usage.error}>
          {u ? (
            <div className="g4" style={{ marginTop: 12 }}>
              <Stat l="Requests" v={u.requests} />
              <Stat l="Successful" v={u.successful} />
              <Stat l="Failed" v={u.failed} />
              <Stat l="Tokens" v={u.totalTokens} />
            </div>
          ) : <p className="mu">No usage yet.</p>}
        </State>
      </div>
    </>
  );
}
