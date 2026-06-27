import React, { useState, useEffect } from 'react'
import Controls from './components/Controls'
import CanvasPreview from './components/CanvasPreview'
import { defaultFamily, defaultFriends } from './utils/gridLayouts'
import { Menu, X } from 'lucide-react'

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768
    }
    return true
  })

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
    <div className="flex h-screen w-full bg-ink overflow-hidden relative">
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-20 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar wrapper */}
      <div
        className={`fixed md:relative top-0 left-0 h-full shrink-0 bg-ink sidebar-scroll transition-all duration-300 z-30
          ${isSidebarOpen 
            ? 'w-[320px] md:w-[420px] border-r border-line p-5 translate-x-0 opacity-100 overflow-y-auto' 
            : 'w-0 p-0 border-r-0 translate-x-full opacity-0 overflow-hidden pointer-events-none md:translate-x-0 md:w-0 md:p-0 md:border-r-0 md:opacity-0 md:pointer-events-none'
          }
        `}
      >
        <button className="md:hidden absolute top-6 right-6 text-gray-400 hover:text-white z-50" onClick={() => setIsSidebarOpen(false)}><X size={24} /></button>
        <Controls config={config} setConfig={setConfig} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 h-full p-6 relative overflow-hidden flex flex-col transition-all duration-300">
        {/* Floating toggle button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute top-6 left-6 z-40 p-2.5 rounded-lg bg-panel hover:bg-panel2 border border-line text-gray-200 hover:text-white shadow-lg transition-all focus:outline-none animate-fade-in ${isSidebarOpen ? 'hidden md:block' : 'block'}`}
          title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="flex-1 h-full pt-12">
          <CanvasPreview config={config} />
        </div>
      </div>
    </div>
  )
}

