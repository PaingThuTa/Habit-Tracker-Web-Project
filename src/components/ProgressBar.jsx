// Progress bar component

// Function component to display a progress bar
export default function ProgressBar({ value, max }) {
  const ratio = Math.max(0, Math.min(1, (value || 0) / (max || 1)))
  return (
    <div
      className="overflow-hidden w-full h-2 rounded bg-slate-200 dark:bg-slate-700"
      role="progressbar"
      aria-label="Progress"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value ?? 0} of ${max ?? 0}`}
    >
      <div className="h-full bg-green-500" style={{ width: `${ratio * 100}%` }}></div>
    </div>
  )
}


