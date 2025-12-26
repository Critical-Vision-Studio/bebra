import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiService } from '../api'
import ItemForm from '../components/ItemForm'
import ItemCard from '../components/ItemCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

interface Item {
  id: number
  name: string
  created_at: string
}

function ItemsPage() {
  const [newItemName, setNewItemName] = useState('')
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const queryClient = useQueryClient()

  // Fetch items
  const { data: items, isLoading, error } = useQuery({
    queryKey: ['items'],
    queryFn: () => apiService.getItems('/items'),
  })

  // Create item mutation
  const createMutation = useMutation({
    mutationFn: (name: string) => apiService.createItem('/items', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      setNewItemName('')
    },
  })

  // Update item mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      apiService.updateItem('/items', id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      setEditingItem(null)
    },
  })

  // Delete item mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteItem('/items', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (newItemName.trim()) {
      createMutation.mutate(newItemName.trim())
    }
  }


  if (isLoading) return <LoadingSpinner message="Loading items..." />
  if (error) return <ErrorMessage title="Error loading items" message={String(error)} />

  return (
    <div className="items-page">
      <div className="page-header">
        <h1 className="page-title">Items Management</h1>
        <p className="page-subtitle">Manage your application items</p>
      </div>

      {/* Create New Item */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Add New Item</h3>
        </div>
        <div className="card-content">
          <ItemForm
            value={newItemName}
            onChange={setNewItemName}
            onSubmit={handleCreateItem}
            isLoading={createMutation.isPending}
          />
        </div>
      </div>

      {/* Items List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Items ({items?.data?.length || 0})</h3>
        </div>
        <div className="card-content">
          {!items?.data?.length ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No items yet</h3>
              <p>Create your first item using the form above</p>
            </div>
          ) : (
            <div className="items-list">
              {items.data.map((item: Item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isEditing={editingItem?.id === item.id}
                  onEdit={() => setEditingItem(item)}
                  onDelete={() => {
                    if (confirm('Are you sure you want to delete this item?')) {
                      deleteMutation.mutate(item.id)
                    }
                  }}
                  onSave={(name) => updateMutation.mutate({ id: item.id, name })}
                  onCancel={() => setEditingItem(null)}
                  isDeleting={deleteMutation.isPending}
                  isSaving={updateMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ItemsPage
