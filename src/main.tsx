import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { authService } from './services/authServices'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Small runtime guard: enforce caret/cursor behavior and log focused elements.
// This helps hide stray carets on elements that shouldn't show them and aids debugging.
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('focusin', (ev: FocusEvent) => {
    const target = ev.target as HTMLElement | null;
    if (!target) return;

    const tag = (target.tagName || '').toLowerCase();
    const isEditable = tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;

    // Force caret hidden + default cursor for non-editable focused elements
    if (!isEditable) {
      try {
        (target.style as any).caretColor = 'transparent';
        target.style.cursor = 'default';
        // (Optional) add temporary attribute for debug/tracking:
        // target.setAttribute('data-hid-caret', '1');
      } catch (e) {
        // ignore
      }
    } else {
      // Restore natural styles for real editable elements
      try {
        (target.style as any).caretColor = '';
        target.style.cursor = '';
      } catch (e) {
        // ignore
      }
    }

    // Debug log to console - remove or comment out in production if noisy
    // Shows which element is receiving focus when the caret appears
    // Use this if the problem persists to capture the offending element.
    // eslint-disable-next-line no-console
    console.log('[focus-debug] element:', target, 'isEditable:', isEditable);
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1
    }
  }
})

authService.initAuth().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>
  )
})