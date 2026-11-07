import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import AuthStage from "../../components/AuthStage.jsx";
import { Icon, Logo, ThemeButton } from "../../components/ui.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTitle } from "../../hooks.js";

// mode = "login" or "register". Same layout for both.
export default function Auth({ mode }) {
  const register = mode === "register";
  useTitle(register ? "Create account" : "Sign in");
  const { isAuthed, login, register: signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ displayName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(false);
  const [focus, setFocus] = useState({ on: false, k: 0 });

  if (isAuthed) return <Navigate to="/dashboard" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // The head turns toward the form when any field is focused.
  const onFocus = (e) => {
    if (e.target.tagName !== "INPUT") return;
    const inputs = [...e.currentTarget.querySelectorAll("input")];
    setFocus({ on: true, k: inputs.indexOf(e.target) - (inputs.length - 1) / 2 });
  };
  const onBlur = (e) => {
    if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) return;
    setFocus({ on: false, k: 0 });
  };

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (register && !form.displayName.trim()) return setError("Please enter your name.");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("Please enter a valid email address.");
    if (form.password.length < 8 || form.password.length > 72) return setError("Your password must be 8 to 72 characters.");
    setBusy(true);
    try {
      if (register) await signUp(form.displayName.trim(), form.email.trim(), form.password);
      else await login(form.email.trim(), form.password);
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className={`al${focus.on ? " look" : ""}`} style={{ "--tx": `${-focus.k * 5}deg` }}>
      <div className="ap">
        <AuthStage focus={focus} />
        <Logo s={32} />
        <div className="apt">
          <h2>Run your operations by asking.</h2>
          <p className="mu">Your own workspace, dashboard and API keys, all in one place.</p>
          <Link to="/playground" className="cy">Just exploring? Try the live demo</Link>
        </div>
      </div>

      <div className="af">
        <div className="afh">
          <div className="afd"><ThemeButton /><Link className="b" to="/">Back to site</Link></div>
          <button type="button" className="ib mbtn" aria-label="Open menu" aria-expanded={menu} onClick={() => setMenu(!menu)}><Icon n="menu" /></button>
          <div className={`amenu${menu ? " open" : ""}`}><Link className="b" to="/">Back to site</Link><ThemeButton /></div>
        </div>
        <form className="fm" onSubmit={submit} onFocus={onFocus} onBlur={onBlur} noValidate>
          <h1>{register ? "Create account" : "Sign in"}</h1>
          {register && <label>Display name<input value={form.displayName} onChange={set("displayName")} autoComplete="name" /></label>}
          <label>Email<input type="email" value={form.email} onChange={set("email")} autoComplete="email" /></label>
          <label>Password<input type="password" value={form.password} onChange={set("password")} autoComplete={register ? "new-password" : "current-password"} /></label>
          {error && <p className="er" role="alert">{error}</p>}
          <button type="submit" className="b bp" disabled={busy}>{busy ? "Please wait…" : register ? "Create account" : "Sign in"}</button>
          <p className="mu sm">
            {register ? <>Have an account? <Link className="cy" to="/login">Sign in</Link></> : <>New here? <Link className="cy" to="/register">Create an account</Link></>}
          </p>
        </form>
      </div>
    </div>
  );
}
