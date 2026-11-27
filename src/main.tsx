import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AuthProvider } from './auth/AuthProvider'
import './index.css'
import { rememberNativePhotoLaunch } from './cloud/nativePhoto'
import NativePhotosNotice from './cloud/NativePhotosNotice'
import PreviewBadge from './pwa/PreviewBadge'

rememberNativePhotoLaunch()

createRoot(document.getElementById('root')!).render(
  <StrictMode><PreviewBadge /><NativePhotosNotice /><AuthProvider><App /></AuthProvider></StrictMode>,
)
