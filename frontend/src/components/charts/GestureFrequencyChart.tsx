import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { Gesture } from '../../types'
import { ChartFrame } from './ChartFrame'

interface GestureFrequencyChartProps {
  /** gesture id -> number of times performed */
  counts: Record<string, number>
  gestures: Gesture[]
}

// How many times each gesture was performed this session (one count per run of
// that gesture, not per frame).
export function GestureFrequencyChart({ counts, gestures }: GestureFrequencyChartProps) {
  const data = gestures
    .map((g) => ({ name: g.name, emoji: g.emoji, count: counts[g.id] ?? 0 }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count)

  return (
    <ChartFrame
      title="Gesture frequency"
      empty={data.length === 0}
      emptyLabel="No gestures recognized yet."
      ariaLabel="Bar chart of how many times each gesture was performed"
    >
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: 'currentColor', opacity: 0.06 }}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}
