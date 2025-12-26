import { useQuery } from '@tanstack/react-query'
import { apiService } from '../api'

function HomePage() {
  // Example of using React Query
  const { 
    data: healthData, 
    isLoading: healthLoading, 
    error: healthError 
  } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiService.healthCheck(),
  })

  const { 
    data: dbData, 
    isLoading: dbLoading, 
    error: dbError 
  } = useQuery({
    queryKey: ['db-test'],
    queryFn: () => apiService.testDatabase(),
  })

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>FastAPI + React + PostgreSQL Template</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Backend Health Check</h2>
        {healthLoading && <p>Checking backend...</p>}
        {healthError && <p style={{ color: 'red' }}>Health check failed: {String(healthError)}</p>}
        {healthData && (
          <div style={{ padding: '10px', background: '#e8f5e8', borderRadius: '5px' }}>
            <strong>✓ Backend Status:</strong> {healthData.data.status}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Database Connection Test</h2>
        {dbLoading && <p>Testing database...</p>}
        {dbError && <p style={{ color: 'red' }}>Database test failed: {String(dbError)}</p>}
        {dbData && (
          <div style={{ 
            padding: '10px', 
            background: dbData.data.status === 'success' ? '#e8f5e8' : '#fff3cd',
            borderRadius: '5px' 
          }}>
            <strong>Database Status:</strong> {dbData.data.status}<br />
            <strong>Message:</strong> {dbData.data.message}<br />
            {dbData.data.data && (
              <div>
                <strong>Sample Data:</strong>
                <pre style={{ background: '#f8f9fa', padding: '10px', margin: '10px 0' }}>
                  {JSON.stringify(dbData.data.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: '30px', padding: '15px', background: '#f8f9fa', borderRadius: '5px' }}>
        
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <a 
            href="/dashboard" 
            style={{ 
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
              fontWeight: 'bold'
            }}
          >
            🚀 Go to Dashboard →
          </a>
        </div>
      </div>
    </div>
  )
}

export default HomePage
