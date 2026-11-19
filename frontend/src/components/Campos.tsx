import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeOff, Upload } from 'lucide-react'

export function Campo({ rotulo, dica, erro, children, className = '' }: { rotulo: string; dica?: ReactNode; erro?: boolean; children: (id: string) => ReactNode; className?: string }) {
  const id = useId()
  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={id} className={`field-label ${erro ? 'text-danger!' : ''}`}>{rotulo}</label>
      {children(id)}
      {dica && <p className="field-hint">{dica}</p>}
    </div>
  )
}

export function Senha(props: InputHTMLAttributes<HTMLInputElement>) {
  const [ver, setVer] = useState(false)
  return (
    <div className="relative">
      <input {...props} type={ver ? 'text' : 'password'} className="input pr-12" />
      <button
        type="button"
        onClick={() => setVer((v) => !v)}
        aria-label={ver ? 'Ocultar senha' : 'Mostrar senha'}
        className="absolute top-1/2 right-2.5 flex size-[34px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted hover:text-ink"
      >
        {ver ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

interface FileDropProps {
  rotulo: string
  nome: string
  aceita: string
  formatos: string
  multiplo?: boolean
  arquivos: File[]
  aoMudar: (arquivos: File[]) => void
}

/** Área de seleção de arquivos (equivalente ao .file-drop antigo), com lista do que foi escolhido. */
export function FileDrop({ rotulo, nome, aceita, formatos, multiplo, arquivos, aoMudar }: FileDropProps) {
  const id = useId()
  return (
    <div className="mb-4">
      <span className="field-label">{rotulo}</span>
      <label
        htmlFor={id}
        className="block cursor-pointer rounded-[var(--radius-field)] border-2 border-dashed border-line p-4 text-center text-muted transition hover:border-gold-dark hover:bg-gold-soft"
      >
        <Upload className="mx-auto mb-1.5 text-gold-dark" size={22} />
        <span>{arquivos.length ? `${arquivos.length} arquivo(s) selecionado(s)` : multiplo ? 'Selecionar vários' : 'Escolher arquivo'}</span>
        <small className="mt-1 block">{formatos}</small>
      </label>
      <input
        id={id}
        name={nome}
        type="file"
        accept={aceita}
        multiple={multiplo}
        className="sr-only"
        onChange={(e) => aoMudar(Array.from(e.target.files ?? []))}
      />
      {arquivos.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs text-muted">
          {arquivos.map((f) => (
            <li key={f.name + f.size} className="truncate">• {f.name}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function Interruptor({ ligado, aoMudar, rotulo }: { ligado: boolean; aoMudar: (v: boolean) => void; rotulo: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2" title="Alternar visibilidade">
      <input type="checkbox" role="switch" className="peer sr-only" checked={ligado} onChange={(e) => aoMudar(e.target.checked)} aria-label={rotulo} />
      <span className="relative h-6 w-[42px] shrink-0 rounded-full bg-line transition peer-checked:bg-success after:absolute after:top-[3px] after:left-[3px] after:size-[18px] after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-[18px]" />
      <span className={`badge ${ligado ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>{ligado ? 'Visível' : 'Oculto'}</span>
    </label>
  )
}
