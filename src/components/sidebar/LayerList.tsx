import { useStore } from '../../store/useStore'

interface Props {
  editingId: string | null
  onRequestEdit: (id: string) => void
}

export function LayerList({ editingId, onRequestEdit }: Props) {
  const { objects, selectedId, toggleVisible, removeObject, selectObject } = useStore()

  if (objects.length === 0) {
    return <p className="text-zinc-500 text-xs p-3">No objects yet. Double-click an object to edit it.</p>
  }

  return (
    <ul className="divide-y divide-zinc-800">
      {objects.map((obj) => {
        const isEditing = editingId === obj.id
        return (
          <li
            key={obj.id}
            onClick={() => selectObject(obj.id === selectedId ? null : obj.id)}
            onDoubleClick={() => onRequestEdit(obj.id)}
            title="Double-click to edit"
            className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-zinc-800
              ${selectedId === obj.id && !isEditing ? 'bg-zinc-800' : ''}
              ${isEditing ? 'bg-blue-950 ring-1 ring-inset ring-blue-600' : ''}`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: obj.color }}
            />
            {isEditing && <span className="text-blue-400 text-xs shrink-0">✎</span>}
            <span className={`flex-1 truncate text-xs ${obj.visible ? 'text-zinc-100' : 'text-zinc-600'}`}>
              {obj.label}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); toggleVisible(obj.id) }}
              className="text-zinc-500 hover:text-zinc-200 text-xs px-1"
              title="Toggle visibility"
            >
              {obj.visible ? '●' : '○'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); removeObject(obj.id) }}
              className="text-zinc-600 hover:text-red-400 text-xs px-1"
              title="Delete"
            >
              ✕
            </button>
          </li>
        )
      })}
    </ul>
  )
}
