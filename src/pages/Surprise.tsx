import React, { useEffect, useMemo } from 'react'
import Navbar from '@/components/Navbar'
import { toast } from '@/hooks/use-toast'

const SurprisePage: React.FC = () => {
  useEffect(() => {
    toast({ description: 'Geheime Liebesbotschaft entdeckt!' })
  }, [])

  const hearts = useMemo(
    () =>
      Array.from({ length: 20 }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 5,
        size: Math.random() * 24 + 16
      })),
    []
  )

  return (
    <div className="min-h-screen bg-pink-50 dark:bg-pink-900 relative overflow-hidden">
      <Navbar title="Überraschung" />
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-4xl font-bold text-pink-600 dark:text-pink-200">
          Hab dich lieb
        </h1>
      </div>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {hearts.map((h, i) => (
          <span
            key={i}
            className="absolute animate-float select-none text-pink-500 dark:text-pink-300"
            style={{
              left: `${h.left}%`,
              animationDelay: `${h.delay}s`,
              fontSize: `${h.size}px`
            }}
          >
            ❤️
          </span>
        ))}
      </div>
    </div>
  )
}

export default SurprisePage
