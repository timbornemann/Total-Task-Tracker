import React, { useEffect, useMemo } from 'react'
import Navbar from '@/components/Navbar'
import { toast } from '@/hooks/use-toast'
import { useTranslation } from 'react-i18next'

const SurprisePage: React.FC = () => {
  const { t } = useTranslation()
  useEffect(() => {
    toast({ description: t('surprise.toast') })
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
      <Navbar title={t('surprise.navbar')} />
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-4xl font-bold text-pink-600 dark:text-pink-200">
          {t('surprise.title')}
        </h1>
        <br/>
        <p className="text-lg text-pink-600 dark:text-pink-200 whitespace-pre-line text-center max-w-2xl mx-auto leading-relaxed">
        {t('surprise.poem')}
        </p>
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
