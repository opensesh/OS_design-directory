import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import ResourceDetail from './pages/ResourceDetail';
import { PageTransition } from './components/layout/PageTransition';

/**
 * App
 *
 * Main application component with routing.
 * Routes:
 * - / : Home page with 3D universe or table view
 * - /?display=table : Table view
 * - /resource/:id : Individual resource detail page
 *
 * Uses AnimatePresence for smooth page transitions
 * with fade + slide animations between routes.
 */
function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <Home />
            </PageTransition>
          }
        />
        <Route
          path="/resource/:id"
          element={
            <PageTransition>
              <ResourceDetail />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
