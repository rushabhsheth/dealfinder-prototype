import { Routes, Route, Navigate } from "react-router-dom";
import PhoneFrame from "./components/PhoneFrame";
import { ToastProvider } from "./components/Toast";
import DemoMenu from "./components/DemoMenu";

import ValueExplainer from "./screens/ValueExplainer";
import Feed from "./screens/Feed";
import TrialIntro from "./screens/TrialIntro";
import InterestSurvey from "./screens/InterestSurvey";
import ConnectEmail from "./screens/ConnectEmail";
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

export default function App() {
  return (
    <PhoneFrame>
      <ToastProvider>
        <Routes>
          {/* Onboarding & free path */}
          <Route path="/" element={<ValueExplainer />} />
          <Route path="/free" element={<Navigate to="/feed" replace />} />
          <Route path="/trial" element={<TrialIntro />} />
          <Route path="/survey" element={<InterestSurvey />} />
          <Route path="/connect" element={<ConnectEmail />} />
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

          {/* Trust */}
          <Route path="/settings" element={<Settings />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <DemoMenu />
      </ToastProvider>
    </PhoneFrame>
  );
}
