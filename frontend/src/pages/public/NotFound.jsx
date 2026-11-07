import { Link } from "react-router-dom";
import { useTitle } from "../../hooks.js";

export default function NotFound() {
  useTitle("Page not found");
  return (
    <div className="al" style={{ display: "grid", placeItems: "center", textAlign: "center" }}>
      <div>
        <h1>Page not found</h1>
        <p className="mu">That address does not exist.</p>
        <Link className="b bp" to="/">Back to home</Link>
      </div>
    </div>
  );
}
