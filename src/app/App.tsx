import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AlmoxarifadoProvider } from './context/AlmoxarifadoContext';

export default function App() {
  return (
    <AlmoxarifadoProvider>
      <RouterProvider router={router} />
    </AlmoxarifadoProvider>
  );
}
