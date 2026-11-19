import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  aberto: boolean
  titulo: ReactNode
  aoFechar: () => void
  children: ReactNode
  rodape?: ReactNode
  largura?: string
}

/** Modal estilo "bottom sheet" no celular e centralizado no desktop (igual ao .modal-user antigo). */
export function Modal({ aberto, titulo, aoFechar, children, rodape, largura = 'sm:max-w-[620px]' }: Props) {
  useEffect(() => {
    if (!aberto) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    document.addEventListener('keydown', esc)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', esc)
      document.body.style.overflow = overflow
    }
  }, [aberto, aoFechar])

  if (!aberto) return null
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`max-h-[92dvh] w-full animate-fade-up overflow-y-auto rounded-t-[20px] border border-line bg-card sm:rounded-[20px] ${largura}`}
      >
        <div className="sticky top-0 z-[5] flex items-center justify-between rounded-t-[inherit] border-b border-line bg-card px-5 py-4">
          <h3 className="m-0 flex items-center gap-2 font-serif text-lg font-semibold">{titulo}</h3>
          <button
            type="button"
            aria-label="Fechar"
            onClick={aoFechar}
            className="flex size-[34px] cursor-pointer items-center justify-center rounded-full bg-bg-soft text-muted transition hover:bg-card-hover hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {rodape && (
          <div className="sticky bottom-0 flex justify-end gap-3 rounded-b-[inherit] border-t border-line bg-card px-5 py-4">
            {rodape}
          </div>
        )}
      </div>
    </div>
  )
}
