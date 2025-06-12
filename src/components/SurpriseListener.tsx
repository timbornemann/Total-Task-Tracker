import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const SurpriseListener: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === '3') {
        e.preventDefault()
        navigate('/surprise')
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [navigate])

  return null
}

export default SurpriseListener
