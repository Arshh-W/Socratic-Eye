import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SessionProvider } from "./context/SessionContext";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MentorIDE from "./pages/MentorIDE";
import SessionReport from "./pages/SessionReport";

import "./styles/globals.css";

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />

    {/* Mentor IDE*/}
    <Route path="/mentor" element={<MentorIDE />} />

    {/* Session Report */}
    <Route path="/report" element={<SessionReport />} />

    <Route path="*" element={<Navigate to="/login" />} />
  </Routes>
);

const App = () => {
  return (
    <SessionProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </SessionProvider>
  );
};

export default App;
