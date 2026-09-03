import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { ConfidencePoint } from '../../lib/session'
import { ChartFrame } from './ChartFrame'

interface ConfidenceTimelineChartProps {
  series: ConfidencePoint[]
}

// Average classifier confidence over the session, bucketed per second.
export function ConfidenceTimelineChart({ series }: ConfidenceTimelineChartProps) {
  return (
    <ChartFrame
      title="Confidence over time"
      empty={series.length < 2}
      emptyLabel="Not enough data yet - hold a gesture for a few seconds."
      ariaLabel="Area chart of average recognition confidence over time"
    >
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
          <defs>
            <linearGradient id="confFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
          <XAxis dataKey="t" tick={{ fontSize: 12 }} tickFormatter={(t) => `${t}s`} />
          <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            formatter={(value) => [Number(value).toFixed(2), 'confidence'] as [string, string]}
            labelFormatter={(label) => `${label}s`}
          />
          <Area
            type="monotone"
            dataKey="confidence"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#confFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}
