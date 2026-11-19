// Espelha os dicionários devolvidos por app/routes.py (memorial_to_dict, etc.)

export interface Usuario {
  id: number
  nome: string
  email: string
  is_admin: boolean
}

export interface Arquivo {
  filename: string
  url: string
}

export interface Comentario {
  id: number
  nome_autor: string
  texto: string
  data_criacao: string | null
  is_visible: boolean
}

export interface Memorial {
  id: number
  nome: string
  nascimento: string
  falecimento: string
  frase_efeito: string
  biografia: string
  url_personalizada: string
  logo: Arquivo | null
  banner: Arquivo | null
  imagens: Arquivo[]
  videos: Arquivo[]
  audios: Arquivo[]
  comentarios: Comentario[]
}

export type TipoArquivo = 'logo' | 'banner' | 'imagem' | 'video' | 'audio'

export interface UsuarioAdmin extends Usuario {
  memoriais: { id: number; nome: string; url_personalizada: string; total_comentarios: number }[]
  total_memoriais: number
  total_comentarios: number
}
