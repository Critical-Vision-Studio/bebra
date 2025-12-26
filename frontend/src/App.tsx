import { Routes, Route, Link } from 'react-router-dom'
import HomePage from './pages/HomePage'
import About from './pages/About'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import ItemsPage from './pages/ItemsPage'

function App() {
  const linkStyle = {
    color: '#007bff',
    textDecoration: 'none',
    fontWeight: 'bold' as const
  }

  return (
    <Routes>
      {/* Public routes without layout */}
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<About />} />
      
      {/* Dashboard routes with MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/items" element={<ItemsPage />} />
      </Route>

      {/* 404 route */}
      <Route path="*" element={
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          minHeight: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h1>404 - Page Not Found</h1>
          <p>The page you're looking for doesn't exist.</p>
          <div style={{ marginTop: '20px', display: 'flex', gap: '1rem' }}>
            <Link to="/" style={linkStyle}>← Go to Home</Link>
            <Link to="/dashboard" style={linkStyle}>Go to Dashboard →</Link>
          </div>
        </div>
      } />
    </Routes>
  )
}

export default App