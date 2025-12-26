import { useQuery } from '@tanstack/react-query'
import { apiService } from '../api'

function Dashboard() {
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiService.healthCheck(),
  })

  const { data: dbData, isLoading: dbLoading } = useQuery({
    queryKey: ['db-test'],
    queryFn: () => apiService.testDatabase(),
  })

  const stats = [
    {
      title: 'Backend Status',
      value: healthData?.data.status || 'Unknown',
      icon: '🟢',
      color: 'green'
    },
    {
      title: 'Database',
      value: dbData?.data.status || 'Unknown',
      icon: '💾',
      color: dbData?.data.status === 'success' ? 'green' : 'orange'
    }
  ]

  if (healthLoading || dbLoading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome to your application overview</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className={`stat-card stat-${stat.color}`}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-title">{stat.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Dashboard
