/** 'YYYY-MM-DD' -> 'DD/MM/YYYY' (devolve o original se não for nesse formato). */
export function formatarData(valor: string | null | undefined): string {
  if (!valor) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : valor
}

/** ISO datetime -> '05 de setembro de 2021' */
export function dataPorExtenso(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

/** ISO datetime -> '05/09/2021' */
export function dataCurta(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR')
}

/** Mesma regra de app/routes.py:normalizar_slug, para pré-visualizar a URL. */
export function normalizarSlug(valor: string): string {
  return valor
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200)
}

export function inicial(nome: string): string {
  return (nome.trim()[0] ?? 'M').toUpperCase()
}
