// Cliente HTTP da API Flask.
// - Mesma origem: o cookie de sessão vai automaticamente (credentials: 'same-origin').
// - CSRF: o token vem de GET /api/csrf e é enviado no header X-CSRFToken
//   em toda requisição que altera dados.
import type { Comentario, Memorial, TipoArquivo, Usuario, UsuarioAdmin } from '../types'

export class ApiError extends Error {
  status: number
  campos: string[]
  constructor(status: number, mensagem: string, campos: string[] = []) {
    super(mensagem)
    this.status = status
    this.campos = campos
  }
}

let csrfToken: string | null = null

async function obterCsrf(forcar = false): Promise<string> {
  if (!csrfToken || forcar) {
    const r = await fetch('/api/csrf', { credentials: 'same-origin' })
    csrfToken = ((await r.json()) as { csrf_token: string }).csrf_token
  }
  return csrfToken
}

type Corpo = Record<string, unknown> | FormData | undefined

export async function request<T>(metodo: string, url: string, corpo?: Corpo, tentativa = 0): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const altera = metodo !== 'GET'
  if (altera) headers['X-CSRFToken'] = await obterCsrf()

  let body: BodyInit | undefined
  if (corpo instanceof FormData) body = corpo
  else if (corpo !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(corpo)
  }

  const resp = await fetch(url, { method: metodo, headers, body, credentials: 'same-origin' })
  const dados = await resp.json().catch(() => ({}))

  if (!resp.ok) {
    const mensagem = (dados as { erro?: string }).erro ?? 'Algo deu errado. Tente novamente.'
    // Token CSRF expirado (ex.: servidor reiniciou com outra SECRET_KEY): renova e repete uma vez.
    if (resp.status === 400 && altera && tentativa === 0 && mensagem.includes('CSRF')) {
      await obterCsrf(true)
      return request<T>(metodo, url, corpo, 1)
    }
    throw new ApiError(resp.status, mensagem, (dados as { campos?: string[] }).campos ?? [])
  }
  return dados as T
}

export const api = {
  me: () => request<{ usuario: Usuario | null }>('GET', '/api/me'),
  login: (email: string, password: string) =>
    request<{ usuario: Usuario }>('POST', '/api/auth/login', { email, password }),
  registrar: (name: string, email: string, password: string) =>
    request<{ usuario: Usuario }>('POST', '/api/auth/registrar', { name, email, password }),
  logout: async () => {
    await request('POST', '/api/auth/logout')
    csrfToken = null
  },

  memoriais: () => request<{ memoriais: Memorial[] }>('GET', '/api/memoriais'),
  memorial: (id: number) => request<{ memorial: Memorial }>('GET', `/api/memoriais/${id}`),
  criarMemorial: (form: FormData) => request<{ memorial: Memorial }>('POST', '/api/memoriais', form),
  editarMemorial: (id: number, form: FormData) =>
    request<{ memorial: Memorial }>('PUT', `/api/memoriais/${id}`, form),
  apagarMemorial: (id: number) => request('DELETE', `/api/memoriais/${id}`),
  apagarArquivo: (id: number, filename: string, tipo: TipoArquivo) =>
    request<{ memorial: Memorial }>('DELETE', `/api/memoriais/${id}/arquivos`, { filename, tipo }),

  publico: (slug: string) => request<{ memorial: Memorial }>('GET', `/api/publico/${encodeURIComponent(slug)}`),
  comentar: (slug: string, nome_autor: string, texto: string) =>
    request<{ mensagem: string }>('POST', `/api/publico/${encodeURIComponent(slug)}/comentarios`, { nome_autor, texto }),
  visibilidadeComentario: (id: number, is_visible: boolean) =>
    request<{ comentario: Comentario }>('PATCH', `/api/comentarios/${id}`, { is_visible }),
  apagarComentario: (id: number) => request('DELETE', `/api/comentarios/${id}`),

  adminUsuarios: () => request<{ usuarios: UsuarioAdmin[] }>('GET', '/api/admin/usuarios'),
  adminResetarSenha: (id: number, nova_senha: string) =>
    request<{ mensagem: string }>('POST', `/api/admin/usuarios/${id}/senha`, { nova_senha }),
  adminExcluirUsuario: (id: number) => request<{ mensagem: string }>('DELETE', `/api/admin/usuarios/${id}`),
}

export function mensagemErro(e: unknown): string {
  return e instanceof Error ? e.message : 'Algo deu errado. Tente novamente.'
}
