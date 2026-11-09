import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './app/App';
import { createHttpDiagnostics, demoDiagnostics } from './data/demoGateway';
import './styles/base.css';

async function bootstrap() {
  let gateway = demoDiagnostics;
  if (import.meta.env.DEV && import.meta.env.VITE_DEMO_HTTP === 'true') {
    const { demoWorker } = await import('./demo/browser');
    await demoWorker.start({ quiet: true, onUnhandledFrame: 'bypass' });
    gateway = createHttpDiagnostics(window.location.origin);
  }

  const root = document.getElementById('root');
  if (!root) throw new Error('Не найден контейнер приложения');
  const queryClient = new QueryClient();
  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        {/* Commit route changes inside the native snapshot callback. */}
        <BrowserRouter useTransitions={false}><App gateway={gateway} /></BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
}

void bootstrap().catch(() => {
  const root = document.getElementById('root');
  if (root) {
    root.setAttribute('role', 'alert');
    root.textContent = 'Не удалось запустить техническую проверку. Обновите страницу.';
  }
});
