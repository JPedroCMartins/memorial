import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Camera, Link2, LogIn } from 'lucide-react'
import { Rodape } from '../components/Layout'
import { useAuth } from '../lib/auth'

const RECURSOS = [
  { icone: Camera, titulo: 'Galeria de Mídias', texto: 'Fotos, vídeos e áudios organizados em uma bela galeria para relembrar momentos especiais.' },
  { icone: BookOpen, titulo: 'Livro de Condolências', texto: 'Amigos e familiares deixam mensagens de carinho, que você modera antes de publicar.' },
  { icone: Link2, titulo: 'Link Personalizado', texto: 'Cada memorial possui um endereço único e elegante, fácil de compartilhar.' },
]
const PASSOS = [
  ['Crie sua conta', 'Registre-se gratuitamente para começar.'],
  ['Monte o memorial', 'Adicione a biografia, fotos, vídeos e áudios.'],
  ['Compartilhe', 'Envie o link e receba homenagens.'],
]

export default function Landing() {
  const { usuario } = useAuth()
  return (
    <div className="min-h-dvh bg-paper font-sans text-paper-text">
      <header
        className="h-[40vh] md:h-[60vh]"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 100%), radial-gradient(ellipse at top left, rgba(194,168,120,0.55), transparent 60%), radial-gradient(ellipse at bottom right, rgba(44,44,44,0.75), transparent 55%), linear-gradient(160deg, #2c2c2c 0%, #4a3c26 40%, #c2a878 100%)',
        }}
      />
      <div className="relative z-10 mx-auto -mt-[10vh] max-w-[1140px] px-3 pb-16 md:-mt-[20vh] md:px-6">
        <div className="mx-2 animate-fade-up rounded-xl bg-white px-5 py-8 shadow-[0_20px_40px_rgba(0,0,0,0.06)] md:mx-0 md:p-16">
          <div className="text-center">
            <div className="mb-6 inline-flex size-[90px] items-center justify-center rounded-full bg-white font-serif text-[2.2rem] text-gold shadow-[0_10px_25px_rgba(0,0,0,0.12)] md:size-[120px] md:text-5xl">
              M
            </div>
            <h1 className="mb-1 font-serif text-[2.2rem] font-medium text-paper-ink md:text-[3.5rem]">Memorial</h1>
            <p className="text-base font-medium tracking-[2px] text-[#888] uppercase">Homenagens e recordações</p>
            <p className="mx-auto mt-6 max-w-[600px] font-serif text-lg leading-relaxed text-[#666] italic md:text-[1.4rem]">
              "Preserve a memória, celebre a vida, eternize o amor."
            </p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              {usuario ? (
                <Link to="/painel" className="btn-paper">Ir para o painel <ArrowRight size={18} /></Link>
              ) : (
                <>
                  <Link to="/login" className="btn-paper"><LogIn size={18} /> Entrar</Link>
                  <Link to="/registrar" className="btn-paper-outline">Criar conta <ArrowRight size={18} /></Link>
                </>
              )}
            </div>
          </div>

          <div className="divider-elegant" />

          <section className="mb-12">
            <h2 className="paper-title">Por que criar um Memorial?</h2>
            <p className="text-center text-lg leading-[1.8] text-[#555]">
              Um espaço digital dedicado a eternizar a trajetória de quem partiu. Reúna fotos, vídeos, áudios e histórias em um
              único lugar, e receba homenagens de amigos e familiares — com a tranquilidade de que cada mensagem passa pela sua
              aprovação antes de ser publicada.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="paper-title">Recursos</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {RECURSOS.map(({ icone: Icone, titulo, texto }) => (
                <div key={titulo} className="h-full rounded-xl border border-paper-line bg-paper-card p-6 text-center transition hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.05)]">
                  <div className="mx-auto mb-4 flex size-[60px] items-center justify-center rounded-full bg-[#f5f0e8] text-gold">
                    <Icone size={24} />
                  </div>
                  <h5 className="mb-2 font-serif text-xl text-paper-ink">{titulo}</h5>
                  <p className="text-[0.95rem] text-[#777]">{texto}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="divider-elegant" />

          <section>
            <h2 className="paper-title">Como funciona</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {PASSOS.map(([titulo, texto], i) => (
                <div key={titulo} className="text-center">
                  <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-gold font-serif text-xl text-white">{i + 1}</div>
                  <h5 className="text-sm font-semibold tracking-[1px] text-[#6c757d] uppercase">{titulo}</h5>
                  <p className="mt-2 text-sm text-[#6c757d]">{texto}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link to={usuario ? '/painel' : '/registrar'} className="btn-paper">Começar agora <ArrowRight size={18} /></Link>
            </div>
          </section>
        </div>
      </div>
      <Rodape claro />
    </div>
  )
}
