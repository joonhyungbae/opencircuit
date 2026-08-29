import { Navigate, Route, Routes } from "react-router-dom";
import { CameraPage } from "./pages/Camera";

export function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<CameraPage />} />
        <Route path="/intro" element={<Navigate to="/" replace />} />
        <Route path="/studio" element={<Navigate to="/" replace />} />
        <Route path="/make" element={<Navigate to="/" replace />} />
        <Route path="/camera" element={<Navigate to="/" replace />} />
        <Route path="/gallery" element={<Navigate to="/" replace />} />
        <Route path="/gallery/:work" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
