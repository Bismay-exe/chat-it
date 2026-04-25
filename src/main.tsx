import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
// @ts-ignore - Boneyard auto-generates this at build time
import './bones/registry'
import App from './App.tsx'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

window.onerror = null;
window.onunhandledrejection = null;

import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';

GoogleSignIn.initialize({
  clientId: '386785142814-66lvss57us9jo249t6rjual6jmpo4v59.apps.googleusercontent.com',
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours of local cache 
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const persister = createSyncStoragePersister({
  storage: window.localStorage,
})

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <PersistQueryClientProvider 
      client={queryClient}
      persistOptions={{ 
        persister,
        // Bump this string any time you make breaking schema changes to query data
        buster: 'v2',
      }}
    >
      <App />
    </PersistQueryClientProvider>
  </BrowserRouter>,
)

// Pre-warm the most frequently used page chunks immediately after mount.
// These run after the main thread is free — not blocking initial render.
// On first visit they download in the background; on all subsequent visits
// they're served from disk cache instantly (zero delay on navigation).
setTimeout(() => {
  import('@/pages/AuthPage');
  import('@/pages/ChatsPage');
  import('@/pages/ChatScreen');
}, 100);

