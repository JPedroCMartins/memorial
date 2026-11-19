import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Eye, Film, Image as ImageIcon, Music, X } from 'lucide-react'
import { Carregando, Rodape, Topbar } from '../components/Layout'
import { Confirmar } from '../components/Confirmar'
import { CamposArquivos, CamposMemorial, montarFormData, useArquivosNovos } from '../components/FormMemorial'
import { useToast } from '../components/Toast'
import { ApiError, api, mensagemErro } from '../lib/api'
import type { Arquivo, Memorial, TipoArquivo } from '../types'
import { BotaoSair } from './Painel'
import NaoEncontrado from './NaoEncontrado'

export default function EditarMemorial() {
  const id = Number(useParams().id)
  const { data, isLoading, error } = useQuery({ queryKey: ['memorial', id], queryFn: () => api.memorial(id) })

  if (isLoading) return <Carregando />
  if (error || !data) {
    const status = error instanceof ApiError ? error.status : 0
    return <NaoEncontrado texto={status === 403 ? 'Você não tem permissão para editar este memorial.' : undefined} />
  }
  // key: remonta o formulário quando os dados mudam (defaultValue não é reativo).
  return <Formulario key={data.memorial.id} memorial={data.memorial} />
}

function Formulario({ memorial }: { memorial: Memorial }) {
  const toast = useToast()
  const qc = useQueryClient()
  const navegar = useNavigate()
  const { arquivos, set } = useArquivosNovos()
  const [camposComErro, setCamposComErro] = useState<string[]>([])
  const [removendo, setRemovendo] = useState<{ arquivo: Arquivo; tipo: TipoArquivo } | null>(null)

  const salvar = useMutation({ mutationFn: (fd: FormData) => api.editarMemorial(memorial.id, fd) })
  const apagarArquivo = useMutation({
    mutationFn: ({ arquivo, tipo }: { arquivo: Arquivo; tipo: TipoArquivo }) => api.apagarArquivo(memorial.id, arquivo.filename, tipo),
    onSuccess: ({ memorial: m }) => {
      toast('Arquivo apagado com sucesso.')
      setRemovendo(null)
      qc.setQueryData(['memorial', memorial.id], { memorial: m })
      qc.invalidateQueries({ queryKey: ['memoriais'] })
    },
    onError: (e) => toast(mensagemErro(e), 'erro'),
  })

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    try {
      await salvar.mutateAsync(montarFormData(e.currentTarget, arquivos))
      toast('Memorial atualizado com sucesso!')
      qc.invalidateQueries({ queryKey: ['memoriais'] })
      qc.removeQueries({ queryKey: ['memorial', memorial.id] })
      navegar('/painel')
    } catch (err) {
      setCamposComErro(err instanceof ApiError ? err.campos : [])
      toast(mensagemErro(err), 'erro')
    }
  }

  const remover = (arquivo: Arquivo, tipo: TipoArquivo) => setRemovendo({ arquivo, tipo })

  return (
    <>
      <Topbar>
        <a href={`/m/${memorial.url_personalizada}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><Eye size={16} /> Ver</a>
        <BotaoSair />
      </Topbar>
      <main className="container-user pb-10">
        <section className="pt-7 pb-6">
          <Link to="/painel" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted no-underline hover:text-gold"><ArrowLeft size={16} /> Voltar ao painel</Link>
          <h1 className="mb-1 font-serif text-[1.9rem] font-semibold">Editar memorial</h1>
          <p className="text-[0.95rem] text-muted">{memorial.nome}</p>
        </section>

        <form onSubmit={enviar} className="rounded-[var(--radius-card)] border border-line bg-card p-5 md:p-7">
          <CamposMemorial memorial={memorial} camposComErro={camposComErro} />

          <hr className="my-6 border-line" />
          <h4 className="mb-3.5 font-serif text-lg font-semibold text-gold">Mídias atuais</h4>
          <Grupo titulo="Foto de perfil e banner" vazio={!memorial.logo && !memorial.banner}>
            {memorial.logo && <CartaoMidia aoRemover={() => remover(memorial.logo!, 'logo')} legenda="Perfil"><img src={memorial.logo.url} alt="Foto de perfil" className="size-full object-cover" /></CartaoMidia>}
            {memorial.banner && <CartaoMidia aoRemover={() => remover(memorial.banner!, 'banner')} legenda="Banner"><img src={memorial.banner.url} alt="Banner" className="size-full object-cover" /></CartaoMidia>}
          </Grupo>
          <Grupo titulo="Imagens" icone={<ImageIcon size={15} />} vazio={!memorial.imagens.length}>
            {memorial.imagens.map((a) => <CartaoMidia key={a.filename} aoRemover={() => remover(a, 'imagem')}><img src={a.url} alt="" loading="lazy" className="size-full object-cover" /></CartaoMidia>)}
          </Grupo>
          <Grupo titulo="Vídeos" icone={<Film size={15} />} vazio={!memorial.videos.length}>
            {memorial.videos.map((a) => <CartaoMidia key={a.filename} largo aoRemover={() => remover(a, 'video')}><video src={a.url} controls preload="metadata" className="size-full object-cover" /></CartaoMidia>)}
          </Grupo>
          <Grupo titulo="Áudios" icone={<Music size={15} />} vazio={!memorial.audios.length}>
            {memorial.audios.map((a) => (
              <div key={a.filename} className="relative col-span-full flex items-center gap-3 rounded-[var(--radius-field)] border border-line bg-bg-soft p-3 pr-12">
                <audio src={a.url} controls preload="none" className="w-full" />
                <BotaoRemover aoRemover={() => remover(a, 'audio')} />
              </div>
            ))}
          </Grupo>

          <CamposArquivos arquivos={arquivos} set={set} />
          <p className="field-hint -mt-2 mb-4">Novas imagens, vídeos e áudios são adicionados aos existentes. Uma nova foto de perfil ou banner substitui a atual.</p>

          <div className="flex justify-end gap-3 border-t border-line pt-5">
            <Link to="/painel" className="btn btn-ghost">Cancelar</Link>
            <button type="submit" className="btn btn-gold" disabled={salvar.isPending}>{salvar.isPending ? 'Salvando…' : 'Salvar alterações'}</button>
          </div>
        </form>
      </main>
      <Rodape />
      <Confirmar
        aberto={!!removendo}
        titulo="Apagar este arquivo?"
        texto="O arquivo será removido permanentemente do memorial."
        ocupado={apagarArquivo.isPending}
        aoConfirmar={() => removendo && apagarArquivo.mutate(removendo)}
        aoFechar={() => setRemovendo(null)}
      />
    </>
  )
}

function Grupo({ titulo, icone, vazio, children }: { titulo: string; icone?: ReactNode; vazio: boolean; children: ReactNode }) {
  return (
    <div className="mb-5">
      <span className="field-label flex items-center gap-1.5">{icone}{titulo}</span>
      {vazio ? <p className="text-sm text-muted">Nenhum arquivo.</p> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>}
    </div>
  )
}

function BotaoRemover({ aoRemover }: { aoRemover: () => void }) {
  return (
    <button
      type="button"
      onClick={aoRemover}
      aria-label="Apagar arquivo"
      title="Apagar arquivo"
      className="absolute top-2 right-2 flex size-[30px] cursor-pointer items-center justify-center rounded-full bg-black/70 text-white transition hover:scale-110 hover:bg-danger"
    >
      <X size={16} />
    </button>
  )
}

function CartaoMidia({ children, aoRemover, largo, legenda }: { children: ReactNode; aoRemover: () => void; largo?: boolean; legenda?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[var(--radius-field)] border border-line bg-bg-soft ${largo ? 'aspect-video' : 'aspect-square'}`}>
      {children}
      {legenda && <span className="badge absolute bottom-2 left-2 bg-black/70 text-ink">{legenda}</span>}
      <BotaoRemover aoRemover={aoRemover} />
    </div>
  )
}
