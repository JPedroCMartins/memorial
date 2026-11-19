import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { LogIn, UserPlus } from 'lucide-react'
import { Campo, Senha } from '../components/Campos'
import { Marca } from '../components/Layout'
import { useToast } from '../components/Toast'
import { useAuth } from '../lib/auth'
import { mensagemErro } from '../lib/api'

function Casca({ titulo, subtitulo, children }: { titulo: string; subtitulo: string; children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-dvh items-center justify-center p-5"
      style={{
        background:
          'radial-gradient(ellipse at top left, rgba(194,168,120,0.16), transparent 55%), radial-gradient(ellipse at bottom right, rgba(194,168,120,0.08), transparent 50%), var(--color-bg)',
      }}
    >
      <div className="w-full max-w-[420px] animate-fade-up rounded-3xl border border-line bg-card px-7 py-8 shadow-[var(--shadow-soft)]">
        <Link to="/" className="mb-7 flex flex-col items-center text-center text-ink no-underline">
          <Marca grande />
          <h1 className="mt-3.5 font-serif text-[1.7rem] font-semibold">{titulo}</h1>
          <p className="mt-1 text-sm text-muted">{subtitulo}</p>
        </Link>
        {children}
      </div>
    </div>
  )
}

/** Só aceita redirecionar para caminhos internos (evita open redirect). */
function destinoSeguro(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/painel'
}

export function Login() {
  const { usuario, entrar } = useAuth()
  const [params] = useSearchParams()
  const navegar = useNavigate()
  const toast = useToast()
  const [ocupado, setOcupado] = useState(false)
  const destino = destinoSeguro(params.get('next'))

  if (usuario) return <Navigate to={destino} replace />

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    setOcupado(true)
    try {
      await entrar(String(d.get('email')), String(d.get('password')))
      navegar(destino, { replace: true })
    } catch (err) {
      toast(mensagemErro(err), 'erro')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Casca titulo="Bem-vindo de volta" subtitulo="Entre para gerenciar seus memoriais.">
      <form onSubmit={enviar}>
        <Campo rotulo="E-mail">{(id) => <input id={id} name="email" type="email" className="input" autoComplete="email" placeholder="seu@email.com" required />}</Campo>
        <Campo rotulo="Senha">{(id) => <Senha id={id} name="password" autoComplete="current-password" placeholder="••••••••" required />}</Campo>
        <button type="submit" className="btn btn-gold mt-2 w-full" disabled={ocupado}><LogIn size={18} /> {ocupado ? 'Entrando…' : 'Entrar'}</button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        Ainda não tem conta? <Link to="/registrar" className="font-semibold text-gold no-underline hover:underline">Criar conta</Link>
      </p>
    </Casca>
  )
}

export function Registrar() {
  const { usuario, registrar } = useAuth()
  const navegar = useNavigate()
  const toast = useToast()
  const [ocupado, setOcupado] = useState(false)

  if (usuario) return <Navigate to="/painel" replace />

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    if (d.get('password') !== d.get('confirmar')) {
      toast('As senhas não coincidem.', 'erro')
      return
    }
    setOcupado(true)
    try {
      await registrar(String(d.get('name')), String(d.get('email')), String(d.get('password')))
      toast('Conta criada com sucesso! Bem-vindo(a).')
      navegar('/painel', { replace: true })
    } catch (err) {
      toast(mensagemErro(err), 'erro')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Casca titulo="Criar uma conta" subtitulo="Comece a preservar as memórias de quem você ama.">
      <form onSubmit={enviar}>
        <Campo rotulo="Nome completo">{(id) => <input id={id} name="name" className="input" autoComplete="name" placeholder="João da Silva" required maxLength={80} />}</Campo>
        <Campo rotulo="E-mail">{(id) => <input id={id} name="email" type="email" className="input" autoComplete="email" placeholder="seu@email.com" required />}</Campo>
        <Campo rotulo="Senha">{(id) => <Senha id={id} name="password" placeholder="Mínimo 8 caracteres" autoComplete="new-password" minLength={8} required />}</Campo>
        <Campo rotulo="Confirmar senha">{(id) => <Senha id={id} name="confirmar" placeholder="Repita a senha" autoComplete="new-password" minLength={8} required />}</Campo>
        <button type="submit" className="btn btn-gold mt-2 w-full" disabled={ocupado}><UserPlus size={18} /> {ocupado ? 'Criando…' : 'Criar conta'}</button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        Já tem conta? <Link to="/login" className="font-semibold text-gold no-underline hover:underline">Entrar</Link>
      </p>
    </Casca>
  )
}
