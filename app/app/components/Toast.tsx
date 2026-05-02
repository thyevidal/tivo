'use client'
import { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error'

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose: () => void
}

export function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Pequeno delay para acionar a animação de entrada
    const enterTimer = setTimeout(() => setVisible(true), 10)
    const exitTimer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300) // aguarda animação de saída
    }, duration)
    return () => { clearTimeout(enterTimer); clearTimeout(exitTimer) }
  }, [duration, onClose])

  return (
    <div style={{
      position: 'fixed',
      bottom: 88, // acima da nav bar
      left: '50%',
      transform: `translateX(-50%) translateY(${visible ? '0' : '20px'})`,
      opacity: visible ? 1 : 0,
      transition: 'all 0.3s ease',
      zIndex: 100,
      maxWidth: 340,
      width: 'calc(100% - 32px)',
    }}>
      <div style={{
        background: type === 'success' ? 'rgba(22,163,74,0.95)' : 'rgba(239,68,68,0.95)',
        backdropFilter: 'blur(12px)',
        borderRadius: 12,
        padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        border: `1px solid ${type === 'success' ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
      }}>
        {type === 'success'
          ? <CheckCircle size={16} color="white" style={{ flexShrink: 0 }} />
          : <AlertCircle size={16} color="white" style={{ flexShrink: 0 }} />
        }
        <span style={{ flex: 1, fontSize: 13, color: 'white', fontWeight: 400, lineHeight: 1.4 }}>
          {message}
        </span>
        <button
          onClick={() => { setVisible(false); setTimeout(onClose, 300) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
        >
          <X size={14} color="rgba(255,255,255,0.7)" />
        </button>
      </div>
    </div>
  )
}

// Hook utilitário para usar Toast facilmente em qualquer página
export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const show = (message: string, type: ToastType = 'success') => {
    setToast({ message, type })
  }

  const hide = () => setToast(null)

  const ToastComponent = toast ? (
    <Toast message={toast.message} type={toast.type} onClose={hide} />
  ) : null

  return { show, ToastComponent }
}
