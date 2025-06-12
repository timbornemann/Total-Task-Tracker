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
          Ich hab dich lieb
        </h1>
        <br/>
        <p className="text-lg text-pink-600 dark:text-pink-200 whitespace-pre-line text-center max-w-2xl mx-auto leading-relaxed">
        Für dich, mein Schatz, ein kleines Wort,<br/>
        Versteckt im Code, wo nur du es findest.<br/>
        Ein Funke Licht in dunkler Nacht,<br/>
        Ein Zeichen dafür, dass ich immer an dich wach’.<br/>
        <br/>
        Dein Lächeln strahlt wie Sonnenschein,<br/>
        Da schlägt mein Herz im schönsten Takt.<br/>
        Doch mehr als Code und süße Zeilen –<br/>
        Bist du die Liebe, die ich nie verlier’.<br/>
        <br/>
        Dies ist erst der Anfang unserer Magie,<br/>
        Denn mit dir wird Glück ganz leicht geschrieben.<br/>
        Lass uns die Welt, die nur uns gehört,<br/>
        Mit Küssen, Lachen und Sternen verzieren.<br/>
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
