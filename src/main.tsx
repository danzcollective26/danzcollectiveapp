import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AuthProvider } from './auth/AuthProvider'
import './index.css'
import { rememberNativePhotoLaunch } from './cloud/nativePhoto'
import NativePhotosNotice from './cloud/NativePhotosNotice'

rememberNativePhotoLaunch()

createRoot(document.getElementById('root')!).render(
  <StrictMode><NativePhotosNotice /><AuthProvider><App /></AuthProvider></StrictMode>,
)
