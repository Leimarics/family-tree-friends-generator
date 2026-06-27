import React, { useState } from 'react'
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
  const [config, setConfig] = useState(initialConfig)

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
