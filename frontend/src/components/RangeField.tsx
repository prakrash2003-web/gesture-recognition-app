interface RangeFieldProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  /** Text shown next to the label, e.g. "10 fps" or "threshold 0.70". */
  valueText: string
  onChange: (value: number) => void
  description?: string
}

// A labelled range slider. The native <input type="range"> is already keyboard-
// and screen-reader-accessible; we add a visible current-value readout and an
// aria-valuetext so the announced value is human-friendly.
export function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  valueText,
  onChange,
  description,
}: RangeFieldProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
          {label}
        </label>
        <span className="font-mono text-xs text-slate-500">{valueText}</span>
      </div>
      {description && <p className="mb-1 text-xs text-slate-500">{description}</p>}
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        aria-valuetext={valueText}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-brand-600"
      />
    </div>
  )
}
