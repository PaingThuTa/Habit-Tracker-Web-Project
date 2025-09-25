'use client'

// Icon picker component

const COMMON_ICONS = [
  'check_circle',
  'fitness_center',
  'self_improvement',
  'book',
  'menu_book',
  'water_drop',
  'restaurant',
  'directions_run',
  'brush',
  'music_note',
  'bedtime',
]
// Function component to pick an icon
export default function IconPicker({ value, onChange }) {
  const icons = COMMON_ICONS
  return (
    <div className="grid grid-cols-8 gap-2">
      {icons.map((icon) => (
        <button
          key={icon}
          type="button"
          onClick={() => onChange?.(icon)}
          className={`material-icons rounded border border-slate-300 bg-[#f7f1e4] p-2 text-slate-700 hover:bg-slate-100 ${
            value === icon ? 'ring-2 ring-slate-400' : ''
          }`}
          aria-pressed={value === icon}
          aria-label={icon}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}


