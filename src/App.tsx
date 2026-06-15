import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Network from './pages/Network';
import { AuthProvider } from './context/AuthProvider';
import { ConnectionProvider } from './context/ConnectionContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <ConnectionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="analytics" element={
                <ProtectedRoute requiredRole="admin">
                  <Analytics />
                </ProtectedRoute>
              } />

              <Route path="network" element={
                <ProtectedRoute requiredRole="admin">
                  <Network />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </BrowserRouter>
      </ConnectionProvider>
    </AuthProvider>
  );
}

export default App;