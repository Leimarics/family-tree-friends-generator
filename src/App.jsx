import React, { useState, useEffect } from 'react'
import Controls from './components/Controls'
import CanvasPreview from './components/CanvasPreview'
import { defaultFamily, defaultFriends } from './utils/gridLayouts'

function initialConfig() {
  return {
    template: 'family', // 'family' | 'friends'
    orientation: 'portrait', // 'portrait' | 'landscape'

    mainCaption: 'Trip to Goa',
    date: 'June 2026',
    secondaryCaption: 'The Solanki Family',
    promoMessage: 'Created with love.\nMaking memories last forever.',

    background: {
      dataUrl: null,
      opacity: 1,
      brightness: 0,
    },

    darkenAllAvatars: false,

    frame: {
      enabled: false,
      color: '#1F2430',
      width: 10,
    },

    logo: {
      dataUrl: null,
      fallbackText: 'Your Logo Here',
    },

    family: defaultFamily(),
    friends: defaultFriends(),
  }
}

export default function App() {
  const [bgImage, setBgImage] = useState(() => {
    try {
      const saved = localStorage.getItem('bgImage')
      return saved ? JSON.parse(saved) : null
    } catch (e) {
      console.error(e)
      return null
    }
  })

  const [avatars, setAvatars] = useState(() => {
    try {
      const saved = localStorage.getItem('avatars')
      return saved ? JSON.parse(saved) : { family: defaultFamily(), friends: defaultFriends() }
    } catch (e) {
      console.error(e)
      return { family: defaultFamily(), friends: defaultFriends() }
    }
  })

  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('config')
      const parsed = saved ? JSON.parse(saved) : initialConfig()

      // Merge with bgImage and avatars loaded from localStorage
      const savedBg = localStorage.getItem('bgImage')
      const bgVal = savedBg ? JSON.parse(savedBg) : null

      const savedAvatars = localStorage.getItem('avatars')
      const avatarsVal = savedAvatars ? JSON.parse(savedAvatars) : null

      return {
        ...parsed,
        background: {
          ...(parsed.background || {}),
          dataUrl: bgVal !== null ? bgVal : (parsed.background?.dataUrl || null),
        },
        family: avatarsVal ? avatarsVal.family : (parsed.family || defaultFamily()),
        friends: avatarsVal ? avatarsVal.friends : (parsed.friends || defaultFriends()),
      }
    } catch (e) {
      console.error(e)
      return initialConfig()
    }
  })

  // 3. Add useEffect blocks in src/App.jsx to monitor config, bgImage, and avatars
  // and automatically save them as JSON strings to localStorage whenever they change.
  useEffect(() => {
    try {
      localStorage.setItem('config', JSON.stringify(config))
    } catch (e) {
      console.error(e)
    }
  }, [config])

  // Keep bgImage state in sync with config.background.dataUrl
  useEffect(() => {
    setBgImage(config.background.dataUrl)
  }, [config.background.dataUrl])

  useEffect(() => {
    try {
      localStorage.setItem('bgImage', JSON.stringify(bgImage))
    } catch (e) {
      console.error(e)
    }
  }, [bgImage])

  // Keep avatars state in sync with config.family and config.friends
  useEffect(() => {
    setAvatars({ family: config.family, friends: config.friends })
  }, [config.family, config.friends])

  useEffect(() => {
    try {
      localStorage.setItem('avatars', JSON.stringify(avatars))
    } catch (e) {
      console.error(e)
    }
  }, [avatars])

  return (
    <div className="flex h-screen w-full bg-ink overflow-hidden">
      <div className="w-[420px] shrink-0 h-full bg-ink border-r border-line overflow-y-auto sidebar-scroll p-5">
        <Controls config={config} setConfig={setConfig} />
      </div>
      <div className="flex-1 h-full p-6">
        <CanvasPreview config={config} />
      </div>
    </div>
  )
}

