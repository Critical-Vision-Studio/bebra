interface Item {
  id: number
  name: string
  created_at: string
}

interface ItemCardProps {
  item: Item
  isEditing: boolean
  onEdit: () => void
  onDelete: () => void
  onSave: (name: string) => void
  onCancel: () => void
  isDeleting: boolean
  isSaving: boolean
}

function ItemCard({ 
  item, 
  isEditing, 
  onEdit, 
  onDelete, 
  onSave, 
  onCancel, 
  isDeleting, 
  isSaving 
}: ItemCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const name = formData.get('name') as string
    if (name.trim()) {
      onSave(name.trim())
    }
  }

  return (
    <div className="item-card">
      {isEditing ? (
        <form onSubmit={handleSubmit} className="item-edit-form">
          <input
            type="text"
            name="name"
            className="form-control"
            defaultValue={item.name}
            autoFocus
          />
          <div className="item-actions">
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="item-info">
            <div className="item-name">{item.name}</div>
            <div className="item-meta">
              ID: {item.id} • Created: {formatDate(item.created_at)}
            </div>
          </div>
          <div className="item-actions">
            <button
              className="btn btn-secondary btn-sm"
              onClick={onEdit}
            >
              Edit
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={onDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ItemCard
