import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { Carregando } from './components/Layout'
import Landing from './pages/Landing'
import { Login, Registrar } from './pages/Auth'
import Painel from './pages/Painel'
import EditarMemorial from './pages/EditarMemorial'
import MemorialPublico from './pages/MemorialPublico'
import Admin from './pages/Admin'
import NaoEncontrado from './pages/NaoEncontrado'

/** Exige login; se não houver, manda para /login?next=<rota atual>. */
function Protegida({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { usuario, carregando } = useAuth()
  const local = useLocation()
  if (carregando) return <Carregando />
  if (!usuario) return <Navigate to={`/login?next=${encodeURIComponent(local.pathname)}`} replace />
  if (admin && !usuario.is_admin) return <NaoEncontrado texto="Você não tem permissão para acessar esta página." />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registrar" element={<Registrar />} />
      <Route path="/m/:slug" element={<MemorialPublico />} />
      <Route path="/m" element={<Navigate to="/painel" replace />} />
      <Route path="/painel" element={<Protegida><Painel /></Protegida>} />
      <Route path="/painel/memoriais/:id" element={<Protegida><EditarMemorial /></Protegida>} />
      <Route path="/admin" element={<Protegida admin><Admin /></Protegida>} />
      <Route path="*" element={<NaoEncontrado />} />
    </Routes>
  )
}
