interface ItemFormProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  placeholder?: string
  buttonText?: string
}

function ItemForm({ 
  value, 
  onChange, 
  onSubmit, 
  isLoading, 
  placeholder = "Enter item name...",
  buttonText = "Add Item"
}: ItemFormProps) {
  return (
    <form onSubmit={onSubmit} className="item-form">
      <div className="form-row">
        <input
          type="text"
          className="form-control"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading || !value.trim()}
        >
          {isLoading ? (
            <>
              <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
              {buttonText.replace('Add', 'Creating').replace('Update', 'Updating')}...
            </>
          ) : (
            buttonText
          )}
        </button>
      </div>
    </form>
  )
}

export default ItemForm
