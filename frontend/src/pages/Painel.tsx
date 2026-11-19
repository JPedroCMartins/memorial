import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Feather, Images, LogOut, MessageSquare, Pencil, Plus, ShieldCheck, Trash2, Video } from 'lucide-react'
import { Topbar, Rodape } from '../components/Layout'
import { Modal } from '../components/Modal'
import { Confirmar } from '../components/Confirmar'
import { Interruptor } from '../components/Campos'
import { CamposArquivos, CamposMemorial, montarFormData, useArquivosNovos } from '../components/FormMemorial'
import { useToast } from '../components/Toast'
import { useAuth } from '../lib/auth'
import { ApiError, api, mensagemErro } from '../lib/api'
import { dataCurta, formatarData, inicial } from '../lib/format'
import type { Memorial } from '../types'

export function BotaoSair() {
  const { sair } = useAuth()
  return (
    <button type="button" className="btn btn-ghost btn-icon" title="Sair" aria-label="Sair" onClick={() => sair()}>
      <LogOut size={18} />
    </button>
  )
}

export default function Painel() {
  const { usuario } = useAuth()
  const toast = useToast()
  const qc = useQueryClient()
  const { data, isLoading, isError } = useQuery({ queryKey: ['memoriais'], queryFn: api.memoriais })
  const [novoAberto, setNovoAberto] = useState(false)
  const [comentariosDe, setComentariosDe] = useState<number | null>(null)
  const [apagando, setApagando] = useState<Memorial | null>(null)

  const apagar = useMutation({
    mutationFn: (id: number) => api.apagarMemorial(id),
    onSuccess: () => {
      toast('Memorial apagado com sucesso.')
      setApagando(null)
      qc.invalidateQueries({ queryKey: ['memoriais'] })
    },
    onError: (e) => toast(mensagemErro(e), 'erro'),
  })

  const memoriais = data?.memoriais ?? []
  const memorialComentarios = memoriais.find((m) => m.id === comentariosDe) ?? null

  return (
    <>
      <Topbar>
        {usuario?.is_admin && (
          <Link to="/admin" className="btn btn-ghost btn-icon" title="Administração" aria-label="Administração">
            <ShieldCheck size={18} />
          </Link>
        )}
        <BotaoSair />
      </Topbar>

      <main className="container-user">
        <section className="pt-7 pb-2">
          <h1 className="mb-1 font-serif text-[1.9rem] font-semibold">Olá, {usuario?.nome}.</h1>
          <p className="text-[0.95rem] text-muted">Gerencie aqui as suas homenagens.</p>
        </section>

        <div className="mt-6 mb-5 flex items-center justify-between gap-4">
          <h2 className="font-serif text-2xl font-semibold">Seus memoriais</h2>
          <button type="button" className="btn btn-gold btn-sm hidden md:inline-flex" onClick={() => setNovoAberto(true)}>
            <Plus size={16} /> Novo memorial
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 pb-22 min-[560px]:grid-cols-2 min-[900px]:grid-cols-3">
          {isLoading && [0, 1, 2].map((i) => <div key={i} className="h-[300px] animate-pulse rounded-[var(--radius-card)] bg-card" />)}
          {isError && <Vazio>Não foi possível carregar seus memoriais. Recarregue a página.</Vazio>}
          {!isLoading && !isError && memoriais.length === 0 && (
            <Vazio>
              Você ainda não possui nenhum memorial cadastrado.
              <p className="mt-4">
                <button type="button" className="btn btn-gold btn-sm" onClick={() => setNovoAberto(true)}>
                  <Plus size={16} /> Criar o primeiro memorial
                </button>
              </p>
            </Vazio>
          )}
          {memoriais.map((m) => (
            <CardMemorial key={m.id} memorial={m} aoComentarios={() => setComentariosDe(m.id)} aoApagar={() => setApagando(m)} />
          ))}
        </div>
      </main>
      <Rodape />

      <button
        type="button"
        aria-label="Novo memorial"
        onClick={() => setNovoAberto(true)}
        className="fixed right-5 bottom-5 z-90 flex size-[58px] cursor-pointer items-center justify-center rounded-full text-[#141414] shadow-[0_6px_22px_rgba(194,168,120,0.35)] transition active:scale-90 md:hidden"
        style={{ background: 'linear-gradient(135deg, #d4b87e, #a88d5c)' }}
      >
        <Plus size={26} />
      </button>

      <NovoMemorial aberto={novoAberto} aoFechar={() => setNovoAberto(false)} />
      <ModalComentarios memorial={memorialComentarios} aoFechar={() => setComentariosDe(null)} />
      <Confirmar
        aberto={!!apagando}
        titulo={`Apagar "${apagando?.nome}"?`}
        texto="O memorial, todos os arquivos e comentários serão apagados permanentemente. Essa ação não pode ser desfeita."
        ocupado={apagar.isPending}
        aoConfirmar={() => apagando && apagar.mutate(apagando.id)}
        aoFechar={() => setApagando(null)}
      />
    </>
  )
}

function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-full rounded-[var(--radius-card)] border border-dashed border-line bg-card px-6 py-14 text-center text-muted">
      <Feather className="mx-auto mb-3 text-gold-dark" size={40} />
      {children}
    </div>
  )
}

function CardMemorial({ memorial: m, aoComentarios, aoApagar }: { memorial: Memorial; aoComentarios: () => void; aoApagar: () => void }) {
  const pendentes = m.comentarios.filter((c) => !c.is_visible).length
  const acao = 'flex flex-1 cursor-pointer items-center justify-center gap-1.5 px-1.5 py-3 text-[0.82rem] font-medium text-muted no-underline transition hover:bg-gold-soft hover:text-gold'
  return (
    <article className="flex animate-fade-up flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-card transition hover:-translate-y-[3px] hover:border-gold-dark hover:shadow-[var(--shadow-soft)]">
      <div className="relative h-[140px]" style={{ background: 'linear-gradient(135deg, #2a2b2f, #1a1b1e)' }}>
        {m.banner && <img src={m.banner.url} alt="" loading="lazy" className="size-full object-cover" />}
        <div
          className="absolute -bottom-6 left-4 flex size-16 items-center justify-center overflow-hidden rounded-full border-[3px] border-card font-serif text-[1.6rem] font-bold text-[#141414] shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
          style={{ background: 'linear-gradient(135deg, #d4b87e, #a88d5c)' }}
        >
          {m.logo ? <img src={m.logo.url} alt={`Foto de ${m.nome}`} loading="lazy" className="size-full object-cover" /> : inicial(m.nome)}
        </div>
      </div>
      <div className="flex-1 px-[1.1rem] pt-8 pb-4">
        <h3 className="mb-0.5 font-serif text-xl font-semibold">{m.nome}</h3>
        <div className="text-[0.8rem] tracking-[0.5px] text-muted uppercase">
          {formatarData(m.nascimento)} ∼ {formatarData(m.falecimento)}
        </div>
        <div className="mt-3 flex gap-4 text-[0.8rem] text-muted">
          <button type="button" onClick={aoComentarios} title="Comentários" className="inline-flex cursor-pointer items-center gap-1.5 hover:text-gold">
            <MessageSquare size={14} /> {m.comentarios.length}
            {pendentes > 0 && <span className="badge bg-warning/15 text-warning">{pendentes} pendente{pendentes > 1 ? 's' : ''}</span>}
          </button>
          {m.imagens.length > 0 && <span className="inline-flex items-center gap-1.5"><Images size={14} /> {m.imagens.length}</span>}
          {m.videos.length > 0 && <span className="inline-flex items-center gap-1.5"><Video size={14} /> {m.videos.length}</span>}
        </div>
      </div>
      <div className="flex border-t border-line [&>*+*]:border-l [&>*+*]:border-line">
        <a href={`/m/${m.url_personalizada}`} target="_blank" rel="noreferrer" className={acao} title="Visualizar"><Eye size={15} /> Visualizar</a>
        <Link to={`/painel/memoriais/${m.id}`} className={acao} title="Editar"><Pencil size={15} /> Editar</Link>
        <button type="button" onClick={aoApagar} className={`${acao} hover:bg-danger/10! hover:text-danger!`} title="Apagar"><Trash2 size={15} /> Apagar</button>
      </div>
    </article>
  )
}

function NovoMemorial({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  const toast = useToast()
  const qc = useQueryClient()
  const { arquivos, set, limpar } = useArquivosNovos()
  const [camposComErro, setCamposComErro] = useState<string[]>([])
  const criar = useMutation({ mutationFn: api.criarMemorial })

  function fechar() {
    limpar()
    setCamposComErro([])
    aoFechar()
  }

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    try {
      const { memorial } = await criar.mutateAsync(montarFormData(e.currentTarget, arquivos))
      toast(`Memorial para ${memorial.nome} criado com sucesso!`)
      qc.invalidateQueries({ queryKey: ['memoriais'] })
      fechar()
    } catch (err) {
      setCamposComErro(err instanceof ApiError ? err.campos : [])
      toast(mensagemErro(err), 'erro')
    }
  }

  return (
    <Modal
      aberto={aberto}
      aoFechar={fechar}
      titulo={<><Feather size={18} className="text-gold" /> Criar Novo Memorial</>}
      rodape={
        <>
          <button type="button" className="btn btn-ghost" onClick={fechar}>Cancelar</button>
          <button type="submit" form="formNovoMemorial" className="btn btn-gold" disabled={criar.isPending}>
            {criar.isPending ? 'Salvando…' : 'Salvar memorial'}
          </button>
        </>
      }
    >
      <form id="formNovoMemorial" onSubmit={enviar}>
        <CamposMemorial camposComErro={camposComErro} />
        <CamposArquivos arquivos={arquivos} set={set} />
      </form>
    </Modal>
  )
}

function ModalComentarios({ memorial, aoFechar }: { memorial: Memorial | null; aoFechar: () => void }) {
  const toast = useToast()
  const qc = useQueryClient()
  const [apagando, setApagando] = useState<number | null>(null)
  const atualizar = () => qc.invalidateQueries({ queryKey: ['memoriais'] })

  const visibilidade = useMutation({
    mutationFn: ({ id, visivel }: { id: number; visivel: boolean }) => api.visibilidadeComentario(id, visivel),
    onSuccess: ({ comentario }) => {
      toast(comentario.is_visible ? `Comentário de ${comentario.nome_autor} agora está visível.` : `Comentário de ${comentario.nome_autor} foi ocultado.`, comentario.is_visible ? 'sucesso' : 'info')
      atualizar()
    },
    onError: (e) => toast(mensagemErro(e), 'erro'),
  })
  const apagar = useMutation({
    mutationFn: (id: number) => api.apagarComentario(id),
    onSuccess: () => {
      toast('Comentário apagado permanentemente.', 'info')
      setApagando(null)
      atualizar()
    },
    onError: (e) => toast(mensagemErro(e), 'erro'),
  })

  return (
    <>
    <Modal
      aberto={!!memorial}
      aoFechar={aoFechar}
      titulo={<><MessageSquare size={18} className="text-gold" /> Comentários de "{memorial?.nome}"</>}
    >
      <p className="mb-4 text-sm text-muted">Use o interruptor para ativar ou desativar a visibilidade de um comentário na página pública.</p>
      {memorial && memorial.comentarios.length === 0 && (
        <div className="rounded-[var(--radius-card)] border border-dashed border-line p-8 text-center text-muted">Nenhum comentário recebido ainda.</div>
      )}
      <div className="flex flex-col gap-3">
        {memorial?.comentarios.map((c) => (
          <div key={c.id} className="rounded-[var(--radius-field)] border border-line bg-bg-soft p-4">
            <p className="mb-2 font-serif text-base whitespace-pre-wrap italic">"{c.texto}"</p>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-2.5">
              <small className="text-[0.78rem] text-muted"><strong>{c.nome_autor}</strong> · {dataCurta(c.data_criacao)}</small>
              <div className="flex items-center gap-3">
                <Interruptor ligado={c.is_visible} rotulo={`Visibilidade do comentário de ${c.nome_autor}`} aoMudar={(v) => visibilidade.mutate({ id: c.id, visivel: v })} />
                <button
                  type="button"
                  className="btn btn-danger btn-icon size-8!"
                  title="Apagar comentário"
                  aria-label="Apagar comentário"
                  onClick={() => setApagando(c.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
    <Confirmar
      aberto={apagando !== null}
      titulo="Apagar este comentário?"
      texto="Ele será removido permanentemente."
      ocupado={apagar.isPending}
      aoConfirmar={() => apagando !== null && apagar.mutate(apagando)}
      aoFechar={() => setApagando(null)}
    />
    </>
  )
}
