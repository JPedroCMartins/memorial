import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../lib/auth'
import { ToastProvider } from '../components/Toast'
import App from '../App'

function renderizar(rota: string) {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify({ usuario: null }), { status: 200 }))))
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[rota]}>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('páginas', () => {
  it('landing mostra chamadas para entrar e criar conta', async () => {
    renderizar('/')
    expect(await screen.findByRole('link', { name: /entrar/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /criar conta/i })).toBeInTheDocument()
  })

  it('painel sem login redireciona para o login', async () => {
    renderizar('/painel')
    expect(await screen.findByText('Bem-vindo de volta')).toBeInTheDocument()
  })

  it('rota desconhecida mostra 404', async () => {
    renderizar('/nao-existe')
    expect(await screen.findByText('Página não encontrada')).toBeInTheDocument()
  })
})
