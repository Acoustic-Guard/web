import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Network from './pages/Network';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Головний маршрут, який обгортає всі сторінки в MainLayout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} /> {/* Відкриється за замовчуванням на / */}
          <Route path="analytics" element={<Analytics />} /> {/* Відкриється на /analytics */}
          <Route path="network" element={<Network />} /> {/* Відкриється на /network */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;