import React, { Suspense, lazy, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { Layout } from "./components/Layout";
import { ErrorState } from "./components/Common";
import Home from "./pages/Home";
import "./styles.css";
const Catalog = lazy(() => import("./pages/Catalog"));
const Details = lazy(() => import("./pages/Details"));
const Booking = lazy(() => import("./pages/Booking"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Recommendations = lazy(() => import("./pages/Recommendations"));
const Admin = lazy(() => import("./pages/Admin"));
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title =
      (pathname === "/"
        ? "A better way to drive"
        : pathname.split("/")[1].replace(/^./, (x) => x.toUpperCase())) +
      " | DriveRent";
  }, [pathname]);
  return null;
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <ScrollToTop />
        <Suspense
          fallback={
            <div className="loading" role="status">
              Getting your next journey ready…
            </div>
          }
        >
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/cars" element={<Catalog />} />
              <Route path="/cars/:id" element={<Details />} />
              <Route path="/booking/:carId" element={<Booking />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/register" element={<Auth register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<ErrorState />} />
            </Route>
          </Routes>
        </Suspense>
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
