interface ErrorMessageProps {
  title?: string
  message: string
}

function ErrorMessage({ title = "Error", message }: ErrorMessageProps) {
  return (
    <div className="page-error">
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  )
}

export default ErrorMessage
