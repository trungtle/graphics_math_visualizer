import katex from 'katex'
import 'katex/dist/katex.min.css'

export function AnalyticPanel({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null
  return (
    <div className="overflow-y-auto max-h-64 space-y-1 bg-zinc-950 p-2 rounded">
      {lines.map((line, i) => (
        <div
          key={i}
          className="overflow-x-auto text-zinc-300"
          dangerouslySetInnerHTML={{
            __html: katex.renderToString(line, { throwOnError: false, displayMode: true }),
          }}
        />
      ))}
    </div>
  )
}
