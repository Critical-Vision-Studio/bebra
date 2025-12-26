import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

function MainLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Items', href: '/items', icon: '📋' }
  ]

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <div className="layout">
      {/* Header */}
      <header className="layout-header">
        <div className="header-content">
          <div className="header-left">
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              ☰
            </button>
            <Link to="/dashboard" className="logo">
              <span className="logo-icon">⚡</span>
              <span className="logo-text">Template App</span>
            </Link>
          </div>
          
          <div className="header-right">
            <nav className="header-nav">
              <Link to="/" className="header-link">Public Home</Link>
              <Link to="/about" className="header-link">About</Link>
            </nav>
            <div className="user-menu">
              <span className="user-avatar">👤</span>
              <span className="user-name">Demo User</span>
            </div>
          </div>
        </div>
      </header>

      <div className="layout-body">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <nav className="sidebar-nav">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`sidebar-link ${isActivePath(item.href) ? 'sidebar-link-active' : ''}`}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className={`sidebar-text ${!sidebarOpen ? 'sidebar-text-hidden' : ''}`}>
                  {item.name}
                </span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="layout-footer">
        <div className="footer-content">
          <p>&copy; 2024 FastAPI + React Template. Built with ❤️</p>
          <div className="footer-links">
            <a href="https://fastapi.tiangolo.com/" target="_blank" rel="noopener noreferrer">
              FastAPI
            </a>
            <a href="https://react.dev/" target="_blank" rel="noopener noreferrer">
              React
            </a>
            <a href="https://tanstack.com/query" target="_blank" rel="noopener noreferrer">
              React Query
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default MainLayout
