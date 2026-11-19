import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, ShieldCheck, Trash2 } from 'lucide-react'
import { Rodape, Topbar } from '../components/Layout'
import { Modal } from '../components/Modal'
import { Confirmar } from '../components/Confirmar'
import { Campo, Senha } from '../components/Campos'
import { useToast } from '../components/Toast'
import { api, mensagemErro } from '../lib/api'
import type { UsuarioAdmin } from '../types'
import { BotaoSair } from './Painel'

export default function Admin() {
  const toast = useToast()
  const qc = useQueryClient()
  const { data, isLoading, isError } = useQuery({ queryKey: ['admin-usuarios'], queryFn: api.adminUsuarios })
  const [resetando, setResetando] = useState<UsuarioAdmin | null>(null)
  const [excluindo, setExcluindo] = useState<UsuarioAdmin | null>(null)
  const usuarios = data?.usuarios ?? []

  const resetar = useMutation({
    mutationFn: ({ id, senha }: { id: number; senha: string }) => api.adminResetarSenha(id, senha),
    onSuccess: (r) => { toast(r.mensagem); setResetando(null) },
    onError: (e) => toast(mensagemErro(e), 'erro'),
  })
  const excluir = useMutation({
    mutationFn: (id: number) => api.adminExcluirUsuario(id),
    onSuccess: (r) => { toast(r.mensagem); setExcluindo(null); qc.invalidateQueries({ queryKey: ['admin-usuarios'] }) },
    onError: (e) => toast(mensagemErro(e), 'erro'),
  })

  const stats = [
    ['Usuários', usuarios.length],
    ['Memoriais', usuarios.reduce((s, u) => s + u.total_memoriais, 0)],
    ['Comentários', usuarios.reduce((s, u) => s + u.total_comentarios, 0)],
    ['Admins', usuarios.filter((u) => u.is_admin).length],
  ] as const

  return (
    <>
      <Topbar titulo="Admin">
        <Link to="/painel" className="btn btn-ghost btn-sm">Painel</Link>
        <BotaoSair />
      </Topbar>
      <main className="container-user pb-12">
        <section className="pt-7 pb-2">
          <h1 className="mb-1 font-serif text-[1.9rem] font-semibold">Administração</h1>
          <p className="text-[0.95rem] text-muted">Gerenciamento de usuários, memoriais e senhas.</p>
        </section>

        <div className="my-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map(([rotulo, valor]) => (
            <div key={rotulo} className="rounded-[var(--radius-field)] border border-line bg-card p-4">
              <div className="font-serif text-3xl text-gold">{isLoading ? '–' : valor}</div>
              <div className="text-xs tracking-[0.5px] text-muted uppercase">{rotulo}</div>
            </div>
          ))}
        </div>

        {isError && <p className="text-danger">Não foi possível carregar os usuários.</p>}

        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-xs tracking-[0.5px] text-muted uppercase">
              <tr><th className="p-4">Usuário</th><th className="p-4">Memoriais</th><th className="p-4 text-right">Ações</th></tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-line align-top last:border-0">
                  <td className="p-4">
                    <div className="flex items-center gap-2 font-medium">
                      {u.nome}
                      {u.is_admin && <span className="badge inline-flex items-center gap-1 bg-gold-soft text-gold"><ShieldCheck size={11} /> Admin</span>}
                    </div>
                    <small className="text-muted">{u.email}</small><br />
                    <small className="text-muted">ID {u.id}</small>
                  </td>
                  <td className="p-4">
                    {u.memoriais.length ? (
                      <ul className="space-y-1">
                        {u.memoriais.map((m) => (
                          <li key={m.id}>
                            <a href={`/m/${m.url_personalizada}`} target="_blank" rel="noreferrer" className="text-ink no-underline hover:text-gold">{m.nome}</a>{' '}
                            <small className="text-muted">({m.total_comentarios} cmt)</small>
                          </li>
                        ))}
                      </ul>
                    ) : <small className="text-muted">—</small>}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => setResetando(u)}><KeyRound size={14} /> Resetar senha</button>
                      {!u.is_admin && (
                        <button type="button" className="btn btn-danger btn-icon size-9!" aria-label={`Excluir ${u.nome}`} title="Excluir usuário" onClick={() => setExcluindo(u)}><Trash2 size={15} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && usuarios.length === 0 && (
                <tr><td colSpan={3} className="p-10 text-center text-muted">Nenhum usuário registrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
      <Rodape />

      <Modal
        aberto={!!resetando}
        aoFechar={() => setResetando(null)}
        largura="sm:max-w-[420px]"
        titulo={<><KeyRound size={18} className="text-gold" /> Redefinir senha</>}
        rodape={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setResetando(null)}>Cancelar</button>
            <button type="submit" form="formReset" className="btn btn-gold" disabled={resetar.isPending}>Salvar nova senha</button>
          </>
        }
      >
        <form
          id="formReset"
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault()
            if (resetando) resetar.mutate({ id: resetando.id, senha: String(new FormData(e.currentTarget).get('nova_senha')) })
          }}
        >
          <p className="mb-4 text-sm text-muted">Nova senha para <strong className="text-ink">{resetando?.nome}</strong>.</p>
          <Campo rotulo="Nova senha" dica="Mínimo de 8 caracteres.">{(id) => <Senha id={id} name="nova_senha" minLength={8} autoComplete="new-password" required />}</Campo>
        </form>
      </Modal>

      <Confirmar
        aberto={!!excluindo}
        titulo={`Excluir "${excluindo?.nome}"?`}
        texto="O usuário e todos os seus memoriais, arquivos e comentários serão apagados permanentemente."
        rotulo="Excluir"
        ocupado={excluir.isPending}
        aoConfirmar={() => excluindo && excluir.mutate(excluindo.id)}
        aoFechar={() => setExcluindo(null)}
      />
    </>
  )
}
