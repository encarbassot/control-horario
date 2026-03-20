import { createRoot } from 'react-dom/client'
import "./i18n/i18n.js"

import "./elio-react-components/styles/base.css"
import "./elio-react-components/styles/fonts.css"
import "./elio-react-components/styles/ui.css"
import "./styles/index.css"

import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file


import { RouterProvider } from 'react-router-dom'
import { ModalsProvider } from './elio-react-components/components/Modals/ModalsContext.jsx'
import VersionCheck from './components/VersionCheck/VersionCheck.jsx'
import { getRouter } from './routes/router.jsx'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary.jsx'
import { ElioAuthProvider } from './contexts/ElioAuthContext.jsx'
import { ActiveClockProvider } from './contexts/ActiveClockContext.jsx'
import { api } from './api/ApiAdapter.js'

const router = getRouter()

// Suppress React's error overlay in development (optional, for testing only)
if (process.env.NODE_ENV === 'development') {
  window.addEventListener('error', (e) => {
    // Allow ErrorBoundary to handle it
    e.stopImmediatePropagation();
  });
}

// Global error handler for errors that Error Boundaries don't catch
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

function App() {
  return (
    <ElioAuthProvider api={api}>
      <ActiveClockProvider>
      <ModalsProvider>
        <div className={'app'}>
          {/* <VersionCheck> */}
            <RouterProvider router={router} />
          {/* </VersionCheck> */}
        </div>
      </ModalsProvider>
      </ActiveClockProvider>
    </ElioAuthProvider>
  )
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
