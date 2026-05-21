import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './App'
import './assets/main.css'
import { KeyboardProvider } from './contexts/KeyboardProvider/KeyboardProvider'
import { store } from './store'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <KeyboardProvider>
        <App />
      </KeyboardProvider>
    </Provider>
  </StrictMode>
)
