import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api, request } from '../lib/api'
import { formatarData, normalizarSlug } from '../lib/format'

function resposta(status: number, corpo: unknown) {
  return Promise.resolve(new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } }))
}

afterEach(() => vi.unstubAllGlobals())

describe('api', () => {
  it('envia X-CSRFToken em requisições que alteram dados', async () => {
    const fetchMock = vi.fn((url: string) =>
      url === '/api/csrf' ? resposta(200, { csrf_token: 'tok-1' }) : resposta(200, { usuario: { id: 1 } }),
    )
    vi.stubGlobal('fetch', fetchMock)
    await api.login('a@a.com', 'senha-123')
    const [, init] = fetchMock.mock.calls.find(([u]) => u === '/api/auth/login') as unknown as [string, RequestInit]
    expect((init.headers as Record<string, string>)['X-CSRFToken']).toBe('tok-1')
    expect(JSON.parse(init.body as string)).toEqual({ email: 'a@a.com', password: 'senha-123' })
  })

  it('converte erro da API em ApiError com mensagem e campos', async () => {
    vi.stubGlobal('fetch', vi.fn(() => resposta(400, { erro: 'Preencha tudo', campos: ['nome'] })))
    const erro = (await request('GET', '/api/x').catch((e: unknown) => e)) as ApiError
    expect(erro).toBeInstanceOf(ApiError)
    expect(erro.message).toBe('Preencha tudo')
    expect(erro.campos).toEqual(['nome'])
  })
})

describe('format', () => {
  it('formata datas ISO para o padrão brasileiro', () => {
    expect(formatarData('2021-09-05')).toBe('05/09/2021')
    expect(formatarData('texto livre')).toBe('texto livre')
  })
  it('normaliza slug igual ao backend', () => {
    expect(normalizarSlug('  José da Silva!! ')).toBe('jose-da-silva')
  })
})
