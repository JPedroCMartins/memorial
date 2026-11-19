import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function Marca({ texto = 'Memorial', grande = false }: { texto?: string; grande?: boolean }) {
  const tamanho = grande ? 'size-[68px] text-3xl' : 'size-10 text-base'
  const [falhou, setFalhou] = useState(false)
  return (
    <span className={`flex items-center justify-center overflow-hidden rounded-full bg-gold-soft font-serif font-bold text-gold ${tamanho}`}>
      {falhou ? 'M' : (
        <img src="/logo_martins.png" alt={texto} className="size-full object-cover" onError={() => setFalhou(true)} />
      )}
    </span>
  )
}

export function Topbar({ titulo = 'Memorial', link = '/painel', children }: { titulo?: string; link?: string; children?: ReactNode }) {
  return (
    <nav className="sticky top-0 z-[100] border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="container-user flex items-center justify-between gap-4 py-3">
        <Link to={link} className="flex items-center gap-3 font-serif text-lg tracking-[0.5px] text-ink no-underline">
          <Marca />
          {titulo}
        </Link>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </nav>
  )
}

export function Rodape({ claro = false }: { claro?: boolean }) {
  return (
    <footer className={`mt-4 px-5 pt-10 pb-6 text-center text-[0.82rem] ${claro ? 'text-[#888]' : 'border-t border-line text-muted'}`}>
      &copy; {new Date().getFullYear()} J. Pedro C. Martins. Todos os direitos reservados.
    </footer>
  )
}

export function Carregando({ claro = false, texto }: { claro?: boolean; texto?: ReactNode }) {
  return (
    <div className={`flex min-h-dvh flex-col items-center justify-center gap-4 ${claro ? 'bg-paper' : 'bg-bg'}`}>
      <div className={`size-12 animate-spin-slow rounded-full border-2 border-t-gold ${claro ? 'border-paper-line' : 'border-line'}`} />
      {texto && <h2 className="animate-fade-up text-center font-serif text-2xl tracking-[1px] text-gold">{texto}</h2>}
    </div>
  )
}
