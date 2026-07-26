import React, { useState, useEffect, useRef } from 'react'
import Controls from './components/Controls'
import CanvasPreview from './components/CanvasPreview'
import { defaultFamily, defaultFriends } from './utils/gridLayouts'
import { Menu, X } from 'lucide-react'

function migrateTextProp(val, defaultText, defaultFontFamily, defaultFontSize, defaultFill, defaultFontStyle = 'normal') {
  if (!val) {
    return {
      text: defaultText,
      x: undefined,
      y: undefined,
      scaleX: 1,
      scaleY: 1,
      fontFamily: defaultFontFamily,
      fontSize: defaultFontSize,
      fill: defaultFill,
      fontStyle: defaultFontStyle,
      enabled: true,
    }
  }
  if (typeof val === 'string') {
    return {
      text: val,
      x: undefined,
      y: undefined,
      scaleX: 1,
      scaleY: 1,
      fontFamily: defaultFontFamily,
      fontSize: defaultFontSize,
      fill: defaultFill,
      fontStyle: defaultFontStyle,
      enabled: true,
    }
  }
  // Reset legacy hardcoded defaults to undefined so they compute dynamically
  const isLegacyX = val.x === 0 || val.x === 40
  const isLegacyY = val.y === 50 || val.y === 90 || val.y === 120 || val.y === 1000
  return {
    text: val.text !== undefined ? val.text : defaultText,
    x: (val.x !== undefined && !isLegacyX) ? val.x : undefined,
    y: (val.y !== undefined && !isLegacyY) ? val.y : undefined,
    scaleX: val.scaleX !== undefined ? val.scaleX : 1,
    scaleY: val.scaleY !== undefined ? val.scaleY : 1,
    fontFamily: val.fontFamily !== undefined ? val.fontFamily : defaultFontFamily,
    fontSize: val.fontSize !== undefined ? val.fontSize : defaultFontSize,
    fill: val.fill !== undefined ? val.fill : defaultFill,
    fontStyle: val.fontStyle !== undefined ? val.fontStyle : defaultFontStyle,
    enabled: val.enabled !== undefined ? val.enabled : true,
  }
}

function initialConfig() {
  return {
    template: 'family', // 'family' | 'friends'
    orientation: 'portrait', // 'portrait' | 'landscape'

    mainCaption: { text: 'Trip to Goa', x: undefined, y: undefined, scaleX: 1, scaleY: 1, fontFamily: 'Arial', fontSize: 40, fill: '#1A1A1A', fontStyle: 'bold', enabled: true },
    date: { text: 'June 2026', x: undefined, y: undefined, scaleX: 1, scaleY: 1, fontFamily: 'Arial', fontSize: 20, fill: '#5A5A5A', fontStyle: 'normal', enabled: true },
    secondaryCaption: { text: 'The Solanki Family', x: undefined, y: undefined, scaleX: 1, scaleY: 1, fontFamily: 'Arial', fontSize: 30, fill: '#2E2E2E', fontStyle: 'italic', enabled: true },
    promoMessage: { text: 'Created with love.\nMaking memories last forever.', x: undefined, y: undefined, scaleX: 1, scaleY: 1, fontFamily: 'Arial', fontSize: 20, fill: '#444444', fontStyle: 'normal', enabled: true },

    background: {
      dataUrl: null,
      opacity: 1,
      brightness: 0,
    },

    frame: {
      enabled: false,
      color: '#1F2430',
      width: 10,
    },

    logo: {
      dataUrl: null,
      x: undefined,
      y: undefined,
      scaleX: 1,
      scaleY: 1,
      enabled: true,
    },

    motto: {
      text: 'Your Motto Here',
      x: undefined,
      y: undefined,
      scaleX: 1,
      scaleY: 1,
      fontFamily: 'Arial',
      fontSize: 18,
      fill: '#1A1A1A',
      fontStyle: 'normal',
      enabled: true,
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

  const stageRef = useRef(null)
  const [exportFormat, setExportFormat] = useState('png')
  const [isExporting, setIsExporting] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [croppingId, setCroppingId] = useState(null)

  const handleExport = () => {
    setIsExporting(true)
    // Defer one tick so any pending filter caching settles before capture.
    requestAnimationFrame(() => {
      if (!stageRef.current) return
      const uri = stageRef.current.toDataURL({
        pixelRatio: 3,
        mimeType: exportFormat === 'jpeg' ? 'image/jpeg' : 'image/png',
        quality: 0.95,
      })
      const link = document.createElement('a')
      const fileName = (config.mainCaption?.text || config.secondaryCaption?.text || 'poster')
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase() + '.' + (exportFormat === 'jpeg' ? 'jpg' : 'png')
      link.download = fileName
      link.href = uri
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setIsExporting(false)
    })
  }

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

      const logoVal = parsed.logo || {}
      const isOldDefault = logoVal.x === 400 && logoVal.y === 1100
      const activeX = isOldDefault ? undefined : logoVal.x
      const activeY = isOldDefault ? undefined : logoVal.y
      return {
        ...parsed,
        mainCaption: migrateTextProp(parsed.mainCaption, 'Trip to Goa', 'Arial', 40, '#1A1A1A', 'bold'),
        date: migrateTextProp(parsed.date, 'June 2026', 'Arial', 20, '#5A5A5A', 'normal'),
        secondaryCaption: migrateTextProp(parsed.secondaryCaption, 'The Solanki Family', 'Arial', 30, '#2E2E2E', 'italic'),
        promoMessage: migrateTextProp(parsed.promoMessage, 'Created with love.\nMaking memories last forever.', 'Arial', 20, '#444444', 'normal'),
        background: {
          ...(parsed.background || {}),
          dataUrl: bgVal !== null ? bgVal : (parsed.background?.dataUrl || null),
        },
        logo: {
          dataUrl: logoVal.dataUrl !== undefined ? logoVal.dataUrl : null,
          x: activeX !== undefined ? activeX : undefined,
          y: activeY !== undefined ? activeY : undefined,
          scaleX: logoVal.scaleX !== undefined ? logoVal.scaleX : 1,
          scaleY: logoVal.scaleY !== undefined ? logoVal.scaleY : 1,
          enabled: logoVal.enabled !== undefined ? logoVal.enabled : true,
        },
        motto: (() => {
          const rawMotto = parsed.motto !== undefined
            ? parsed.motto
            : (logoVal.fallbackText !== undefined ? logoVal.fallbackText : 'Your Motto Here')
          const migrated = migrateTextProp(rawMotto, 'Your Motto Here', 'Arial', 18, '#1A1A1A', 'normal')
          if (parsed.motto === undefined && logoVal.mottoEnabled !== undefined) {
            migrated.enabled = logoVal.mottoEnabled
          }
          return migrated
        })(),
        family: (() => {
          const rawFamily = avatarsVal ? avatarsVal.family : (parsed.family || defaultFamily())
          const cleanFamily = {}
          for (const key in rawFamily) {
            cleanFamily[key] = (rawFamily[key] || []).map(slot => ({
              ...slot,
              opacity: slot.opacity !== undefined ? slot.opacity : 100,
              brightness: slot.brightness !== undefined ? slot.brightness : 0,
              fontFamily: slot.fontFamily !== undefined ? slot.fontFamily : 'Arial',
              fontSize: slot.fontSize !== undefined ? slot.fontSize : 16,
              fill: slot.fill !== undefined ? slot.fill : '#2A2A2A',
              stroke: slot.stroke !== undefined ? slot.stroke : '#000000',
              fillEnabled: slot.fillEnabled !== undefined ? slot.fillEnabled : true,
              fontStyle: slot.fontStyle !== undefined ? slot.fontStyle : 'normal',
              photoX: slot.photoX !== undefined ? slot.photoX : 0,
              photoY: slot.photoY !== undefined ? slot.photoY : 0,
              circleEnabled: slot.circleEnabled !== undefined ? slot.circleEnabled : true,
              labelEnabled: slot.labelEnabled !== undefined ? slot.labelEnabled : true,
              circleX: slot.circleX === 0 ? undefined : slot.circleX,
              circleY: slot.circleY === 0 ? undefined : slot.circleY,
              labelX: slot.labelX === 0 ? undefined : slot.labelX,
              labelY: slot.labelY === 0 ? undefined : slot.labelY,
              circleScaleX: slot.circleScaleX !== undefined ? slot.circleScaleX : 1,
              circleScaleY: slot.circleScaleY !== undefined ? slot.circleScaleY : 1,
              labelScaleX: slot.labelScaleX !== undefined ? slot.labelScaleX : 1,
              labelScaleY: slot.labelScaleY !== undefined ? slot.labelScaleY : 1,
            }))
          }
          return cleanFamily
        })(),
        friends: (() => {
          const rawFriends = avatarsVal ? avatarsVal.friends : (parsed.friends || defaultFriends())
          return {
            ...rawFriends,
            list: (rawFriends.list || []).map(slot => ({
              ...slot,
              opacity: slot.opacity !== undefined ? slot.opacity : 100,
              brightness: slot.brightness !== undefined ? slot.brightness : 0,
              fontFamily: slot.fontFamily !== undefined ? slot.fontFamily : 'Arial',
              fontSize: slot.fontSize !== undefined ? slot.fontSize : 16,
              fill: slot.fill !== undefined ? slot.fill : '#2A2A2A',
              stroke: slot.stroke !== undefined ? slot.stroke : '#000000',
              fillEnabled: slot.fillEnabled !== undefined ? slot.fillEnabled : true,
              fontStyle: slot.fontStyle !== undefined ? slot.fontStyle : 'normal',
              photoX: slot.photoX !== undefined ? slot.photoX : 0,
              photoY: slot.photoY !== undefined ? slot.photoY : 0,
              circleEnabled: slot.circleEnabled !== undefined ? slot.circleEnabled : true,
              labelEnabled: slot.labelEnabled !== undefined ? slot.labelEnabled : true,
              circleX: slot.circleX === 0 ? undefined : slot.circleX,
              circleY: slot.circleY === 0 ? undefined : slot.circleY,
              labelX: slot.labelX === 0 ? undefined : slot.labelX,
              labelY: slot.labelY === 0 ? undefined : slot.labelY,
              circleScaleX: slot.circleScaleX !== undefined ? slot.circleScaleX : 1,
              circleScaleY: slot.circleScaleY !== undefined ? slot.circleScaleY : 1,
              labelScaleX: slot.labelScaleX !== undefined ? slot.labelScaleX : 1,
              labelScaleY: slot.labelScaleY !== undefined ? slot.labelScaleY : 1,
            }))
          }
        })(),
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
    <div className="flex h-[100dvh] w-full bg-ink overflow-hidden relative">
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
        <Controls
          config={config}
          setConfig={setConfig}
          exportFormat={exportFormat}
          setExportFormat={setExportFormat}
          isExporting={isExporting}
          handleExport={handleExport}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          croppingId={croppingId}
          setCroppingId={setCroppingId}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 h-full min-h-0 p-3 md:p-6 relative overflow-hidden flex flex-col transition-all duration-300">
        {/* Floating toggle button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute top-3 left-3 md:top-6 md:left-6 z-40 p-2.5 rounded-lg bg-panel hover:bg-panel2 border border-line text-gray-200 hover:text-white shadow-lg transition-all focus:outline-none animate-fade-in ${isSidebarOpen ? 'hidden md:block' : 'block'}`}
          title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="flex-1 h-full min-h-0 pt-10 md:pt-12 overflow-hidden flex flex-col">
          <CanvasPreview
            config={config}
            setConfig={setConfig}
            stageRef={stageRef}
            selectedId={selectedId}
            selectShape={setSelectedId}
            croppingId={croppingId}
            setCroppingId={setCroppingId}
          />
        </div>
      </div>
    </div>
  )
}

