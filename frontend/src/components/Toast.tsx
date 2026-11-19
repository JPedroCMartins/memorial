import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'

type Tipo = 'sucesso' | 'erro' | 'info'
interface Toast { id: number; mensagem: string; tipo: Tipo }

const Ctx = createContext<(mensagem: string, tipo?: Tipo) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const fechar = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const mostrar = useCallback(
    (mensagem: string, tipo: Tipo = 'sucesso') => {
      const id = Date.now() + Math.random()
      setToasts((t) => [...t, { id, mensagem, tipo }])
      setTimeout(() => fechar(id), 4000)
    },
    [fechar],
  )

  const borda = { sucesso: 'border-l-success', erro: 'border-l-danger', info: 'border-l-gold' }

  return (
    <Ctx.Provider value={mostrar}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed top-4 left-1/2 z-[300] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tipo === 'erro' ? 'alert' : 'status'}
            className={`pointer-events-auto flex animate-toast items-center justify-between gap-3 rounded-[var(--radius-field)] border border-l-[3px] border-line bg-card px-4 py-3.5 text-sm text-ink shadow-[var(--shadow-soft)] ${borda[t.tipo]}`}
          >
            <span>{t.mensagem}</span>
            <button type="button" aria-label="Fechar aviso" onClick={() => fechar(t.id)} className="cursor-pointer text-muted hover:text-ink">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(Ctx)
