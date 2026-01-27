import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SessionProvider, useSession } from "./context/SessionContext";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MentorIDE from "./pages/MentorIDE";

import "./styles/globals.css";

const ProtectedRoute = ({ children }) => {
  const { user } = useSession();
  return user ? children : <Navigate to="/login" />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route
      path="/mentor"
      element={
        <ProtectedRoute>
          <MentorIDE />
        </ProtectedRoute>
      }
    />
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
