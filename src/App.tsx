import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ResourceDetail from './pages/ResourceDetail';

/**
 * App
 *
 * Main application component with routing.
 * Routes:
 * - / : Home page with 3D universe or table view
 * - /?display=table : Table view
 * - /resource/:id : Individual resource detail page
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/resource/:id" element={<ResourceDetail />} />
    </Routes>
  );
}

export default App;
