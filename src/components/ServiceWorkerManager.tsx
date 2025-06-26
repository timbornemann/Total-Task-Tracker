import { useEffect } from 'react'
import { useSettings } from '@/hooks/useSettings'

const ServiceWorkerManager: React.FC = () => {
  const { offlineCache } = useSettings()

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    if (offlineCache) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch(err => console.error('SW registration failed', err))
    } else {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => r.unregister())
      })
    }
  }, [offlineCache])

  return null
}

export default ServiceWorkerManager
