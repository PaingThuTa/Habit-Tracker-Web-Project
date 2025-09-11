// Modal component

import { useEffect, useRef } from 'react'

// Function component to display habit card modal
export default function Modal({ isOpen, onClose, title, children, footer }) {
  const dialogRef = useRef(null)
  const lastActiveRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      lastActiveRef.current = document.activeElement
      setTimeout(() => dialogRef.current?.focus(), 0)
      const onKey = (e) => {
        if (e.key === 'Escape') onClose?.()
      }
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen && lastActiveRef.current) {
      lastActiveRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center backdrop-blur-sm bg-black/20" role="dialog" aria-modal="true">
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="mx-4 w-full max-w-xl rounded-xl border border-slate-200 bg-[#f6f0e3] p-6 shadow-xl outline-none"
        role="document"
        aria-labelledby="modal-title"
      >
        <div className="flex justify-between items-center mb-3">
          <h2 id="modal-title" className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="material-icons text-slate-600 hover:text-slate-900">close</button>
        </div>
        <div className="mb-2">{children}</div>
        {footer ? <div className="flex gap-2 justify-end mt-4">{footer}</div> : null}
      </div>
    </div>
  )
}


