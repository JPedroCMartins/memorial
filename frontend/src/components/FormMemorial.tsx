import { useState } from 'react'
import { BookOpen, Images } from 'lucide-react'
import { Campo, FileDrop } from './Campos'
import { normalizarSlug } from '../lib/format'
import type { Memorial } from '../types'

export interface ArquivosNovos {
  logo: File[]
  banner: File[]
  imagens: File[]
  videos: File[]
  audios: File[]
}

const VAZIO: ArquivosNovos = { logo: [], banner: [], imagens: [], videos: [], audios: [] }

/** Monta o FormData no formato esperado por POST/PUT /api/memoriais. */
export function montarFormData(form: HTMLFormElement, arquivos: ArquivosNovos): FormData {
  const fd = new FormData()
  for (const campo of ['nome', 'nascimento', 'falecimento', 'frase_efeito', 'biografia', 'url_personalizada']) {
    fd.append(campo, String(new FormData(form).get(campo) ?? ''))
  }
  for (const [chave, lista] of Object.entries(arquivos) as [keyof ArquivosNovos, File[]][]) {
    lista.forEach((f) => fd.append(chave, f))
  }
  return fd
}

export function useArquivosNovos() {
  const [arquivos, setArquivos] = useState<ArquivosNovos>(VAZIO)
  const set = (chave: keyof ArquivosNovos) => (lista: File[]) => setArquivos((a) => ({ ...a, [chave]: lista }))
  return { arquivos, set, limpar: () => setArquivos(VAZIO) }
}

function Secao({ icone, titulo }: { icone: React.ReactNode; titulo: string }) {
  return <h4 className="mb-3.5 flex items-center gap-2.5 font-serif text-lg font-semibold text-gold">{icone}{titulo}</h4>
}

/** Campos de texto do memorial (usados no modal "Novo memorial" e na página de edição). */
export function CamposMemorial({ memorial, camposComErro = [] }: { memorial?: Memorial; camposComErro?: string[] }) {
  const [slug, setSlug] = useState(memorial?.url_personalizada ?? '')
  const erro = (c: string) => camposComErro.includes(c)
  return (
    <>
      <Secao icone={<BookOpen size={18} />} titulo="Informações Básicas" />
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <Campo rotulo="Nome completo" erro={erro('nome')} className="sm:col-span-2">
          {(id) => <input id={id} name="nome" className="input" placeholder="Nome da pessoa homenageada" defaultValue={memorial?.nome} required maxLength={256} />}
        </Campo>
        <Campo rotulo="Data de nascimento" erro={erro('nascimento')}>
          {(id) => <input id={id} name="nascimento" type="date" className="input [color-scheme:dark]" defaultValue={memorial?.nascimento} required />}
        </Campo>
        <Campo rotulo="Data de falecimento" erro={erro('falecimento')}>
          {(id) => <input id={id} name="falecimento" type="date" className="input [color-scheme:dark]" defaultValue={memorial?.falecimento} required />}
        </Campo>
        <Campo rotulo="Frase de efeito" erro={erro('frase_efeito')} className="sm:col-span-2">
          {(id) => <input id={id} name="frase_efeito" className="input" placeholder="Ex: 'Uma vida dedicada à família...'" defaultValue={memorial?.frase_efeito} required maxLength={512} />}
        </Campo>
        <Campo rotulo="Biografia" erro={erro('biografia')} className="sm:col-span-2">
          {(id) => <textarea id={id} name="biografia" className="input" rows={5} defaultValue={memorial?.biografia} required />}
        </Campo>
        <Campo
          rotulo="URL personalizada"
          erro={erro('url_personalizada')}
          className="sm:col-span-2"
          dica={slug && normalizarSlug(slug) !== slug ? <>Será salva como <strong className="text-gold">{normalizarSlug(slug) || '—'}</strong></> : 'Apenas letras minúsculas, números e hífens.'}
        >
          {(id) => (
            <div className="flex items-stretch overflow-hidden rounded-[var(--radius-field)] border border-line bg-bg-soft transition focus-within:border-gold focus-within:shadow-[0_0_0_3px_var(--color-gold-soft)]">
              <span className="flex items-center border-r border-line bg-card-hover px-3.5 text-sm whitespace-nowrap text-muted">{location.host}/m/</span>
              <input id={id} name="url_personalizada" className="input rounded-none! border-0! bg-transparent! shadow-none!" placeholder="joao-silva" value={slug} onChange={(e) => setSlug(e.target.value)} required />
            </div>
          )}
        </Campo>
      </div>
    </>
  )
}

export function CamposArquivos({ arquivos, set }: Pick<ReturnType<typeof useArquivosNovos>, 'arquivos' | 'set'>) {
  return (
    <>
      <hr className="my-6 border-line" />
      <Secao icone={<Images size={18} />} titulo="Mídias do Memorial" />
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <FileDrop rotulo="Foto de perfil" nome="logo" aceita="image/png,image/jpeg,image/gif,image/webp" formatos="PNG, JPG, WEBP" arquivos={arquivos.logo} aoMudar={set('logo')} />
        <FileDrop rotulo="Banner de capa" nome="banner" aceita="image/png,image/jpeg,image/gif,image/webp" formatos="PNG, JPG, WEBP" arquivos={arquivos.banner} aoMudar={set('banner')} />
        <FileDrop rotulo="Galeria de imagens" nome="imagens" aceita="image/png,image/jpeg,image/gif,image/webp" formatos="PNG, JPG, WEBP" multiplo arquivos={arquivos.imagens} aoMudar={set('imagens')} />
        <FileDrop rotulo="Vídeos" nome="videos" aceita="video/mp4,video/quicktime,video/webm" formatos="MP4, MOV, WEBM" multiplo arquivos={arquivos.videos} aoMudar={set('videos')} />
        <FileDrop rotulo="Gravações de áudio" nome="audios" aceita="audio/mpeg,audio/wav,audio/ogg,audio/mp4,.m4a" formatos="MP3, WAV, OGG, M4A" multiplo arquivos={arquivos.audios} aoMudar={set('audios')} />
      </div>
    </>
  )
}
