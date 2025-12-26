function About() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>About This Template</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Technologies Used</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '5px' }}>
            <h3>Backend</h3>
            <ul>
              <li><strong>FastAPI</strong> - Modern Python web framework</li>
              <li><strong>PostgreSQL</strong> - Robust relational database</li>
              <li><strong>psycopg</strong> - PostgreSQL adapter for Python</li>
              <li><strong>Connection Pooling</strong> - Efficient database connections</li>
              <li><strong>Raw SQL</strong> - Direct database queries for performance</li>
            </ul>
          </div>
          
          <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '5px' }}>
            <h3>Frontend</h3>
            <ul>
              <li><strong>React 18</strong> - Modern React with hooks</li>
              <li><strong>TypeScript</strong> - Type-safe JavaScript</li>
              <li><strong>Vite</strong> - Fast build tool and dev server</li>
              <li><strong>React Router</strong> - Client-side routing</li>
              <li><strong>React Query</strong> - Server state management</li>
              <li><strong>Axios</strong> - HTTP client</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About