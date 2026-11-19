import { TriangleAlert } from 'lucide-react'
import { Modal } from './Modal'

interface Props {
  aberto: boolean
  titulo: string
  texto: string
  rotulo?: string
  ocupado?: boolean
  aoConfirmar: () => void
  aoFechar: () => void
}

export function Confirmar({ aberto, titulo, texto, rotulo = 'Apagar', ocupado, aoConfirmar, aoFechar }: Props) {
  return (
    <Modal
      aberto={aberto}
      titulo="Confirmação"
      aoFechar={aoFechar}
      largura="sm:max-w-[420px]"
      rodape={
        <>
          <button type="button" className="btn btn-ghost" onClick={aoFechar}>Cancelar</button>
          <button type="button" className="btn btn-danger" disabled={ocupado} onClick={aoConfirmar}>{rotulo}</button>
        </>
      }
    >
      <div className="pt-2 pb-1 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-danger/12 text-danger">
          <TriangleAlert size={28} />
        </div>
        <h3 className="mb-1.5 font-serif text-xl">{titulo}</h3>
        <p className="text-sm text-muted">{texto}</p>
      </div>
    </Modal>
  )
}
