import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from './api'
import type { Usuario } from '../types'

interface AuthCtx {
  usuario: Usuario | null
  carregando: boolean
  entrar: (email: string, senha: string) => Promise<void>
  registrar: (nome: string, email: string, senha: string) => Promise<void>
  sair: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    api.me()
      .then((r) => setUsuario(r.usuario))
      .catch(() => setUsuario(null))
      .finally(() => setCarregando(false))
  }, [])

  const entrar = useCallback(async (email: string, senha: string) => {
    setUsuario((await api.login(email, senha)).usuario)
  }, [])
  const registrar = useCallback(async (nome: string, email: string, senha: string) => {
    setUsuario((await api.registrar(nome, email, senha)).usuario)
  }, [])
  const sair = useCallback(async () => {
    await api.logout()
    setUsuario(null)
  }, [])

  return <Ctx.Provider value={{ usuario, carregando, entrar, registrar, sair }}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth fora do AuthProvider')
  return ctx
}
