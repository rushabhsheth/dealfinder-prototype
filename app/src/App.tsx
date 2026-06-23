import { Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./components/Toast";
import DemoMenu from "./components/DemoMenu";
import AppShell from "./components/AppShell";
import { useDemo } from "./state/DemoContext";

import Landing from "./screens/Landing";
import ValueExplainer from "./screens/ValueExplainer";
import Feed from "./screens/Feed";
import TrialIntro from "./screens/TrialIntro";
import ConnectEmail from "./screens/ConnectEmail";
import ConnectCallback from "./screens/ConnectCallback";
import SignIn from "./screens/SignIn";
import AuthCallback from "./screens/AuthCallback";
import EnrollmentConsent from "./screens/EnrollmentConsent";
import FirstScan from "./screens/FirstScan";
import SavingsSummary from "./screens/SavingsSummary";
import DealDetail from "./screens/DealDetail";
import Assistant from "./screens/Assistant";
import TravelWatch from "./screens/TravelWatch";
import SavingsDashboard from "./screens/SavingsDashboard";
import Paywall from "./screens/Paywall";
import Subscribed from "./screens/Subscribed";
import Settings from "./screens/Settings";
import Privacy from "./screens/Privacy";
import EnrolledBrands from "./screens/EnrolledBrands";

/**
 * Front door at `/`: signed-out users see the trust-first marketing landing;
 * signed-in users are sent straight to their feed (the Going pattern). The
 * swipe-panel ValueExplainer is now the mobile on-ramp, reachable at `/intro`.
 */
function Root() {
  const { signedIn } = useDemo();
  return signedIn ? <Navigate to="/feed" replace /> : <Landing />;
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        {/* Every route renders inside the responsive AppShell (no more PhoneFrame). */}
        <Route element={<AppShell />}>
          <Route path="/" element={<Root />} />
          <Route path="/intro" element={<ValueExplainer />} />
          <Route path="/free" element={<Navigate to="/feed" replace />} />
          <Route path="/trial" element={<TrialIntro />} />

          {/* Standalone connect / enroll */}
          <Route path="/connect" element={<ConnectEmail />} />
          <Route path="/connect/callback" element={<ConnectCallback />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/enroll" element={<EnrollmentConsent />} />
          <Route path="/scan" element={<FirstScan />} />
          <Route path="/summary" element={<SavingsSummary />} />

          {/* Core (hero) */}
          <Route path="/feed" element={<Feed />} />
          <Route path="/deal/:id" element={<DealDetail />} />
          <Route path="/chat" element={<Assistant />} />
          <Route path="/watches" element={<TravelWatch />} />
          <Route path="/savings" element={<SavingsDashboard />} />

          {/* Conversion */}
          <Route path="/paywall" element={<Paywall />} />
          <Route path="/subscribed" element={<Subscribed />} />

          {/* Trust & control */}
          <Route path="/brands" element={<EnrolledBrands />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/privacy" element={<Privacy />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <DemoMenu />
    </ToastProvider>
  );
}
