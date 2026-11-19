import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, Feather, Music, X } from 'lucide-react'
import { Carregando, Rodape } from '../components/Layout'
import { useToast } from '../components/Toast'
import { ApiError, api, mensagemErro } from '../lib/api'
import { dataPorExtenso, formatarData, inicial } from '../lib/format'
import type { Arquivo, Memorial } from '../types'
import NaoEncontrado from './NaoEncontrado'

export default function MemorialPublico() {
  const slug = useParams().slug ?? ''
  const { data, isLoading, error } = useQuery({ queryKey: ['publico', slug], queryFn: () => api.publico(slug), retry: false })

  useEffect(() => {
    if (data) document.title = `Em memória de ${data.memorial.nome}`
    return () => { document.title = 'Memorial' }
  }, [data])

  if (isLoading) return <Carregando claro texto={<>Em memória</>} />
  if (error || !data) {
    return <NaoEncontrado texto={error instanceof ApiError && error.status === 404 ? 'Este memorial não existe ou foi removido.' : undefined} />
  }
  return <Pagina memorial={data.memorial} />
}

function Pagina({ memorial: m }: { memorial: Memorial }) {
  const [modalAberto, setModalAberto] = useState(false)
  return (
    <div className="min-h-dvh bg-paper text-paper-text">
      <header
        className="relative h-[40vh] bg-cover bg-center md:h-[60vh] md:bg-fixed"
        style={{
          backgroundImage: m.banner
            ? `url("${m.banner.url}")`
            : 'linear-gradient(160deg, #2c2c2c 0%, #4a3c26 40%, #c2a878 100%)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/60" />
      </header>

      <div className="relative z-10 mx-auto -mt-[10vh] max-w-[1140px] px-3 pb-16 md:-mt-[20vh] md:px-6">
        <div className="mx-2 animate-fade-up rounded-xl bg-white px-5 py-8 shadow-[0_20px_40px_rgba(0,0,0,0.06)] md:mx-0 md:p-16">
          <div className="text-center">
            <div className="-mt-20 mb-4 inline-block rounded-full bg-white p-2 shadow-[0_10px_25px_rgba(0,0,0,0.08)] md:-mt-[120px] md:mb-6">
              {m.logo ? (
                <img src={m.logo.url} alt={`Foto de ${m.nome}`} className="size-[130px] rounded-full object-cover md:size-[170px]" />
              ) : (
                <div className="flex size-[130px] items-center justify-center rounded-full border-2 border-[rgba(120,90,40,0.15)] bg-gradient-to-br from-[#f5f0e8] to-[#e7dccb] font-serif text-6xl text-[#8a7050] md:size-[170px]">
                  {inicial(m.nome)}
                </div>
              )}
            </div>
            <h1 className="mb-1 font-serif text-[2.2rem] font-medium break-words text-paper-ink md:text-[3.5rem]">{m.nome}</h1>
            <p className="text-base font-medium tracking-[2px] text-[#888] uppercase">
              {formatarData(m.nascimento)} <span className="mx-2">∼</span> {formatarData(m.falecimento)}
            </p>
            {m.frase_efeito && (
              <p className="mx-auto mt-6 max-w-[600px] font-serif text-lg leading-relaxed text-[#666] italic md:text-[1.4rem]">"{m.frase_efeito}"</p>
            )}
          </div>

          <div className="divider-elegant" />

          <section className="mb-12">
            <h2 className="paper-title">Nossa Homenagem</h2>
            <MostrarMais>
              <p className="text-left text-lg leading-[1.8] md:text-justify whitespace-pre-wrap text-[#555]">{m.biografia}</p>
            </MostrarMais>
          </section>

          <Galeria memorial={m} />

          <div className="divider-elegant" />

          <section>
            <h2 className="paper-title">Livro de Condolências</h2>
            {m.comentarios.length === 0 ? (
              <div className="py-12 text-center text-[#888]">
                <BookOpen className="mx-auto mb-4 opacity-25" size={48} />
                <p>Ainda não há mensagens aprovadas neste memorial.<br />Seja o primeiro a deixar uma homenagem.</p>
              </div>
            ) : (
              <div className="grid max-h-[500px] gap-6 overflow-y-auto pr-3 md:grid-cols-2 [&::-webkit-scrollbar-thumb]:bg-gold [&::-webkit-scrollbar-track]:bg-paper-line">
                {m.comentarios.map((c) => (
                  <div key={c.id} className="flex h-full flex-col rounded-xl border border-paper-line bg-paper-card p-5 transition hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.04)]">
                    <p className="flex-1 font-serif text-xl leading-relaxed whitespace-pre-wrap text-[#444] italic">"{c.texto}"</p>
                    <div className="mt-4 border-t border-paper-line pt-4">
                      <span className="block font-medium">{c.nome_autor}</span>
                      <small className="text-[#888]">{dataPorExtenso(c.data_criacao)}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-10 text-center">
              <button type="button" className="btn-paper" onClick={() => setModalAberto(true)}>
                <Feather size={18} /> Deixar uma homenagem
              </button>
            </div>
          </section>
        </div>
      </div>
      <Rodape claro />

      <button
        type="button"
        aria-label="Deixar uma homenagem"
        title="Deixar uma homenagem"
        onClick={() => setModalAberto(true)}
        className="fixed right-5 bottom-5 z-[1000] flex size-[58px] cursor-pointer items-center justify-center rounded-full bg-paper-ink text-gold shadow-lg transition hover:scale-105 hover:bg-[#1a1a1a] hover:text-[#e5c993] md:right-10 md:bottom-10 md:size-[65px]"
      >
        <Feather size={24} />
      </button>

      {modalAberto && <ModalHomenagem slug={m.url_personalizada} nome={m.nome} aoFechar={() => setModalAberto(false)} />}
    </div>
  )
}

/** Recorta conteúdo longo com degradê e botão "Mostrar mais" (como o .bio-scroll-wrapper antigo). */
function MostrarMais({ children, altura = 400 }: { children: ReactNode; altura?: number }) {
  const [aberto, setAberto] = useState(false)
  const [precisa, setPrecisa] = useState(false)
  return (
    <div>
      <div
        ref={(el) => { if (el && !precisa && el.scrollHeight > altura + 40) setPrecisa(true) }}
        className={!aberto && precisa ? 'fade-mask overflow-hidden' : ''}
        style={!aberto && precisa ? { maxHeight: altura } : undefined}
      >
        {children}
      </div>
      {precisa && (
        <button type="button" onClick={() => setAberto((v) => !v)} className="mx-auto mt-4 flex cursor-pointer items-center gap-1 text-sm font-semibold tracking-[1px] text-gold uppercase hover:text-gold-dark">
          {aberto ? 'Mostrar menos' : 'Mostrar mais'} <ChevronDown size={16} className={`transition ${aberto ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  )
}

type Aba = 'fotos' | 'videos' | 'audios'

function Galeria({ memorial: m }: { memorial: Memorial }) {
  const [aba, setAba] = useState<Aba>('fotos')
  const [foto, setFoto] = useState<number | null>(null)
  const abas: [Aba, string, number][] = [['fotos', 'Fotos', m.imagens.length], ['videos', 'Vídeos', m.videos.length], ['audios', 'Áudios', m.audios.length]]

  return (
    <section className="mt-12 pt-6">
      <h2 className="paper-title">Memórias</h2>
      <div role="tablist" className="mb-6 flex flex-wrap justify-center gap-2 border-b border-[#eaeaea] md:gap-6">
        {abas.map(([chave, rotulo, total]) => (
          <button
            key={chave}
            role="tab"
            aria-selected={aba === chave}
            onClick={() => setAba(chave)}
            className={`relative cursor-pointer px-2 py-4 text-base font-medium tracking-[1px] uppercase transition md:text-lg ${aba === chave ? 'text-paper-ink after:absolute after:right-0 after:-bottom-px after:left-0 after:h-0.5 after:bg-gold' : 'text-[#888] hover:text-paper-text'}`}
          >
            {rotulo} {total > 0 && <span className="text-xs text-[#aaa]">({total})</span>}
          </button>
        ))}
      </div>

      {aba === 'fotos' && (
        m.imagens.length ? (
          <MostrarMais>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
              {m.imagens.map((img, i) => (
                <button key={img.filename} type="button" onClick={() => setFoto(i)} className="group block cursor-zoom-in overflow-hidden rounded-lg bg-black shadow-sm">
                  <img src={img.url} loading="lazy" alt={`Foto ${i + 1} de ${m.nome}`} className="h-[180px] w-full object-cover opacity-95 transition duration-500 group-hover:scale-105 group-hover:opacity-100 md:h-[250px]" />
                </button>
              ))}
            </div>
          </MostrarMais>
        ) : <Nenhum>Nenhuma foto foi adicionada.</Nenhum>
      )}
      {aba === 'videos' && (
        m.videos.length ? (
          <div className="grid gap-6 md:grid-cols-2">
            {m.videos.map((v) => (
              <div key={v.filename} className="overflow-hidden rounded-lg bg-black shadow-sm">
                <video controls preload="metadata" src={v.url} className="aspect-video w-full object-contain" />
              </div>
            ))}
          </div>
        ) : <Nenhum>Nenhum vídeo foi adicionado.</Nenhum>
      )}
      {aba === 'audios' && (
        m.audios.length ? (
          <div className="space-y-3">
            {m.audios.map((a) => (
              <div key={a.filename} className="flex items-center gap-3 rounded-lg border border-paper-line bg-paper-card p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold text-white"><Music size={18} /></div>
                <audio controls preload="none" src={a.url} className="w-full" />
              </div>
            ))}
          </div>
        ) : <Nenhum>Nenhum áudio foi adicionado.</Nenhum>
      )}

      {foto !== null && <Lightbox fotos={m.imagens} indice={foto} setIndice={setFoto} />}
    </section>
  )
}

function Nenhum({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-[#888]">{children}</p>
}

function Lightbox({ fotos, indice, setIndice }: { fotos: Arquivo[]; indice: number; setIndice: (i: number | null) => void }) {
  const ir = (d: number) => setIndice((indice + d + fotos.length) % fotos.length)
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIndice(null)
      if (e.key === 'ArrowRight') setIndice((indice + 1) % fotos.length)
      if (e.key === 'ArrowLeft') setIndice((indice - 1 + fotos.length) % fotos.length)
    }
    document.addEventListener('keydown', tecla)
    return () => document.removeEventListener('keydown', tecla)
  }, [indice, fotos.length, setIndice])

  const botao = 'absolute flex size-11 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25'
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 p-4" onClick={() => setIndice(null)}>
      <img src={fotos[indice].url} alt="" className="max-h-[88vh] max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
      <button type="button" aria-label="Fechar" className={`${botao} top-4 right-4`} onClick={() => setIndice(null)}><X /></button>
      {fotos.length > 1 && (
        <>
          <button type="button" aria-label="Anterior" className={`${botao} left-3`} onClick={(e) => { e.stopPropagation(); ir(-1) }}><ChevronLeft /></button>
          <button type="button" aria-label="Próxima" className={`${botao} right-3`} onClick={(e) => { e.stopPropagation(); ir(1) }}><ChevronRight /></button>
          <span className="absolute bottom-4 text-sm text-white/70">{indice + 1} / {fotos.length}</span>
        </>
      )}
    </div>
  )
}

function ModalHomenagem({ slug, nome, aoFechar }: { slug: string; nome: string; aoFechar: () => void }) {
  const toast = useToast()
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [aoFechar])

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    setEnviando(true)
    try {
      const r = await api.comentar(slug, String(d.get('nome_autor')), String(d.get('texto')))
      toast(r.mensagem)
      aoFechar()
    } catch (err) {
      toast(mensagemErro(err), 'erro')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1500] flex items-end justify-center bg-black/50 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <div role="dialog" aria-modal="true" className="w-full max-w-[560px] animate-fade-up rounded-t-2xl bg-white p-6 text-paper-text shadow-xl sm:rounded-2xl md:p-8">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-serif text-2xl text-paper-ink">Deixe sua homenagem</h3>
            <p className="text-sm text-[#888]">Uma mensagem de carinho em memória de {nome}.</p>
          </div>
          <button type="button" aria-label="Fechar" onClick={aoFechar} className="cursor-pointer rounded-full p-1.5 text-[#888] hover:bg-paper hover:text-paper-ink"><X size={20} /></button>
        </div>
        <form onSubmit={enviar}>
          <label htmlFor="nome_autor" className="mb-1.5 block text-xs tracking-[1px] text-[#888] uppercase">Seu Nome</label>
          <input id="nome_autor" name="nome_autor" className="input-paper mb-4" required maxLength={100} />
          <label htmlFor="texto" className="mb-1.5 block text-xs tracking-[1px] text-[#888] uppercase">Sua Mensagem</label>
          <textarea id="texto" name="texto" rows={5} className="input-paper" required maxLength={5000} />
          <p className="mt-3 text-center text-xs text-[#888] italic">Sua mensagem será exibida após a aprovação da família.</p>
          <button type="submit" className="btn-paper mt-5 w-full" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar homenagem'}</button>
        </form>
      </div>
    </div>
  )
}
