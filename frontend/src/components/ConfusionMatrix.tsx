interface ConfusionMatrixProps {
  matrix: number[][]
  labels: string[]
  gestureNames: Record<string, string>
}

// A small confusion-matrix heatmap. Rows = true gesture, columns = predicted.
// Cell shading scales with the row proportion so the diagonal stands out.
export function ConfusionMatrix({ matrix, labels, gestureNames }: ConfusionMatrixProps) {
  const rowTotals = matrix.map((row) => row.reduce((a, b) => a + b, 0))

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="p-1.5 text-left font-medium text-slate-400">true \ pred</th>
            {labels.map((label) => (
              <th key={label} className="p-1.5 font-medium text-slate-500">
                {gestureNames[label] ?? label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={labels[i]}>
              <th className="whitespace-nowrap p-1.5 text-left font-medium text-slate-500">
                {gestureNames[labels[i]] ?? labels[i]}
              </th>
              {row.map((value, j) => {
                const share = rowTotals[i] ? value / rowTotals[i] : 0
                const onDiagonal = i === j
                return (
                  <td
                    key={j}
                    className="p-1.5 text-center tabular-nums"
                    style={{
                      backgroundColor: onDiagonal
                        ? `rgba(99, 102, 241, ${0.15 + share * 0.6})`
                        : value > 0
                          ? `rgba(244, 63, 94, ${0.12 + share * 0.5})`
                          : undefined,
                    }}
                  >
                    {value}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
