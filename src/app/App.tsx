import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AlmoxarifadoProvider } from './context/AlmoxarifadoContext';
import { AccessibilityProvider } from './context/AccessibilityContext';

export default function App() {
  return (
    <AccessibilityProvider>
      <AlmoxarifadoProvider>
        <RouterProvider router={router} />
      </AlmoxarifadoProvider>
    </AccessibilityProvider>
  );
}
