import { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Splash from "./components/Splash.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import PublicLayout from "./layouts/PublicLayout.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import Home from "./pages/public/Home.jsx";
import Agents from "./pages/public/Agents.jsx";
import Docs from "./pages/public/Docs.jsx";
import PlaygroundPage from "./pages/public/PlaygroundPage.jsx";
import Auth from "./pages/public/Auth.jsx";
import NotFound from "./pages/public/NotFound.jsx";
import Overview from "./pages/dashboard/Overview.jsx";
import DashPlayground from "./pages/dashboard/DashPlayground.jsx";
import Customers from "./pages/dashboard/Customers.jsx";
import Orders from "./pages/dashboard/Orders.jsx";
import Reports from "./pages/dashboard/Reports.jsx";
import ApiKeys from "./pages/dashboard/ApiKeys.jsx";
import Usage from "./pages/dashboard/Usage.jsx";
import Settings from "./pages/dashboard/Settings.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  const [splashKey, setSplashKey] = useState(0);
  useEffect(() => {
    const replay = () => setSplashKey((k) => k + 1);
    window.addEventListener("dpf-splash", replay);
    return () => window.removeEventListener("dpf-splash", replay);
  }, []);

  return (
    <>
      <Splash key={splashKey} />
      <ScrollToTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="agents" element={<Agents />} />
          <Route path="docs" element={<Docs />} />
        </Route>
        <Route path="playground" element={<PlaygroundPage />} />
        <Route path="login" element={<Auth mode="login" />} />
        <Route path="register" element={<Auth mode="register" />} />
        <Route path="dashboard" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
          <Route index element={<Overview />} />
          <Route path="playground" element={<DashPlayground />} />
          <Route path="customers" element={<Customers />} />
          <Route path="orders" element={<Orders />} />
          <Route path="reports" element={<Reports />} />
          <Route path="api-keys" element={<ApiKeys />} />
          <Route path="usage" element={<Usage />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
