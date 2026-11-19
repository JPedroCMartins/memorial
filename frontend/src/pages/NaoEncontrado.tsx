import { Link } from 'react-router-dom'
import { Feather } from 'lucide-react'

export default function NaoEncontrado({ texto = 'A página que você procura não existe.' }: { texto?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <Feather size={44} className="text-gold-dark" />
      <h1 className="font-serif text-3xl">Página não encontrada</h1>
      <p className="max-w-sm text-muted">{texto}</p>
      <Link to="/" className="btn btn-outline btn-sm mt-2">Voltar ao início</Link>
    </div>
  )
}
