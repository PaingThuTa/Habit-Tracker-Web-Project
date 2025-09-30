'use client'

// Progress bar component

// Function component to display a progress bar
export default function ProgressBar({ value, max, variant = 'bar', size = 120, stroke = 10, label }) {
  const ratio = Math.max(0, Math.min(1, (value || 0) / (max || 1)))

  if (variant === 'circle') {
    const radius = (size - stroke) / 2
    const circumference = 2 * Math.PI * radius
    const dash = circumference * ratio
    const remainder = circumference - dash
    return (
      <div
        role="progressbar"
        aria-label={label || 'Progress'}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value ?? 0} of ${max ?? 0}`}
        className="inline-flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="text-slate-200 dark:text-slate-700"
            stroke="currentColor"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            className="text-green-500"
            strokeDasharray={`${dash} ${remainder}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            stroke="currentColor"
          />
        </svg>
        <div className="absolute text-center">
          <div className="text-xl font-semibold">{value ?? 0}/{max ?? 0}</div>
          {label ? <div className="text-xs text-slate-500">{label}</div> : null}
        </div>
      </div>
    )
  }

  return (
    <div
      className="overflow-hidden w-full h-2 rounded bg-slate-200 dark:bg-slate-700"
      role="progressbar"
      aria-label={label || 'Progress'}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value ?? 0} of ${max ?? 0}`}
    >
      <div className="h-full bg-green-500" style={{ width: `${ratio * 100}%` }}></div>
    </div>
  )
}


