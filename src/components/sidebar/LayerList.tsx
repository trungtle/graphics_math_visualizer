import { useStore } from '../../store/useStore'

export function LayerList() {
  const { objects, selectedId, toggleVisible, removeObject, selectObject } = useStore()

  if (objects.length === 0) {
    return <p className="text-zinc-500 text-xs p-3">No objects yet.</p>
  }

  return (
    <ul className="divide-y divide-zinc-800">
      {objects.map((obj) => (
        <li
          key={obj.id}
          onClick={() => selectObject(obj.id === selectedId ? null : obj.id)}
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-zinc-800 ${selectedId === obj.id ? 'bg-zinc-800' : ''}`}
        >
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: obj.color }}
          />
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
      ))}
    </ul>
  )
}
