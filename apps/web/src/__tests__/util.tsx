import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useNavigate } from 'react-router'
import App from '../routes'

export function IrA({ ruta }: { ruta: string }) {
  const navigate = useNavigate()
  return <button onClick={() => navigate(ruta)}>ir-a-prueba</button>
}

export const montarApp = (rutaInicial = '/login', extra?: string) =>
  render(
    <MemoryRouter initialEntries={[rutaInicial]}>
      <App />
      {extra && <IrA ruta={extra} />}
    </MemoryRouter>,
  )

// Login de producción: correo + contraseña reales (la API se mockea en el test).
export const entrarComo = async (email: string, password = 'warhorse-demo') => {
  await userEvent.type(await screen.findByPlaceholderText(/usuario o correo/i), email)
  await userEvent.type(screen.getByPlaceholderText(/contraseña/i), password)
  await userEvent.click(screen.getByRole('button', { name: /(arrancar|iniciar sesión)/i }))
}
