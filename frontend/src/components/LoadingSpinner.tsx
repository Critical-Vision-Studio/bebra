interface LoadingSpinnerProps {
  message?: string
}

function LoadingSpinner({ message = "Loading..." }: LoadingSpinnerProps) {
  return (
    <div className="page-loading">
      <div className="loading-spinner"></div>
      <p>{message}</p>
    </div>
  )
}

export default LoadingSpinner
