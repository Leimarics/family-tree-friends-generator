import React, { useRef } from 'react'
import { Plus, Trash2, Upload, Moon, Image as ImageIcon, Frame as FrameIcon } from 'lucide-react'
import { fileToDataUrl, isImageFile } from '../utils/fileToDataUrl'
import { GROUP_LIMITS, makeSlot } from '../utils/gridLayouts'

export default function Controls({ config, setConfig }) {
  const update = (patch) => setConfig((prev) => ({ ...prev, ...patch }))

  const updateFamilyGroup = (groupKey, nextList) =>
    setConfig((prev) => ({ ...prev, family: { ...prev.family, [groupKey]: nextList } }))

  const updateFriends = (nextList) =>
    setConfig((prev) => ({ ...prev, friends: { ...prev.friends, list: nextList } }))

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h1 className="text-xl font-semibold text-white">Poster Generator</h1>
        <p className="text-sm text-gray-400 mt-1">Family Tree &amp; Friends&apos; Frenzy layouts</p>
      </div>

      <Section title="Layout">
        <div className="flex gap-2 mb-3">
          <SegmentButton
            active={config.template === 'family'}
            onClick={() => update({ template: 'family' })}
          >
            Family Tree
          </SegmentButton>
          <SegmentButton
            active={config.template === 'friends'}
            onClick={() => update({ template: 'friends' })}
          >
            Friends&apos; Frenzy
          </SegmentButton>
        </div>
        <div className="flex gap-2">
          <SegmentButton
            active={config.orientation === 'portrait'}
            onClick={() => update({ orientation: 'portrait' })}
          >
            Portrait
          </SegmentButton>
          <SegmentButton
            active={config.orientation === 'landscape'}
            onClick={() => update({ orientation: 'landscape' })}
          >
            Landscape
          </SegmentButton>
        </div>
        <button
          onClick={() => {
            localStorage.clear()
            window.location.reload()
          }}
          className="w-full mt-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors border border-dashed border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
        >
          Start Fresh (Clear Memory)
        </button>
      </Section>

      <Section title="Captions">
        <Field label="Main caption">
          <input
            type="text"
            value={config.mainCaption}
            onChange={(e) => update({ mainCaption: e.target.value })}
            placeholder="e.g. Trip to Goa"
            className="input"
          />
        </Field>
        <Field label="Date">
          <input
            type="text"
            value={config.date}
            onChange={(e) => update({ date: e.target.value })}
            placeholder="e.g. June 2026"
            className="input"
          />
        </Field>
        <Field label="Secondary caption">
          <input
            type="text"
            value={config.secondaryCaption}
            onChange={(e) => update({ secondaryCaption: e.target.value })}
            placeholder="e.g. The Solanki Family"
            className="input"
          />
        </Field>
        <Field label="Promo message (bottom, 2-3 lines)">
          <textarea
            value={config.promoMessage}
            onChange={(e) => update({ promoMessage: e.target.value })}
            rows={3}
            className="input resize-none"
          />
        </Field>
      </Section>

      <Section title="Background">
        <UploadRow
          label={config.background.dataUrl ? 'Replace background' : 'Upload background'}
          onFile={async (file) => {
            const dataUrl = await fileToDataUrl(file)
            update({ background: { ...config.background, dataUrl } })
          }}
        />
        {config.background.dataUrl && (
          <button
            className="text-xs text-red-400 hover:text-red-300 mt-1"
            onClick={() => update({ background: { ...config.background, dataUrl: null } })}
          >
            Remove background
          </button>
        )}
        <SliderField
          label="Opacity (faint ↔ solid)"
          value={config.background.opacity}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => update({ background: { ...config.background, opacity: v } })}
          display={`${Math.round(config.background.opacity * 100)}%`}
        />
        <SliderField
          label="Brightness (dark ↔ bright)"
          value={config.background.brightness}
          min={-80}
          max={80}
          step={5}
          onChange={(v) => update({ background: { ...config.background, brightness: v } })}
          display={config.background.brightness}
        />
      </Section>

      <Section title="Avatar fix-up">
        <p className="text-xs text-gray-400 mb-2">
          Uploaded avatars sometimes render with inconsistent contrast. Toggle this to apply a
          uniform darken filter across every avatar at once.
        </p>
        <ToggleRow
          icon={<Moon size={16} />}
          label="Mark all avatars dark"
          checked={config.darkenAllAvatars}
          onChange={(v) => update({ darkenAllAvatars: v })}
        />
      </Section>

      <Section title="Photo frame border">
        <ToggleRow
          icon={<FrameIcon size={16} />}
          label="Enable border"
          checked={config.frame.enabled}
          onChange={(v) => update({ frame: { ...config.frame, enabled: v } })}
        />
        {config.frame.enabled && (
          <>
            <Field label="Border color">
              <input
                type="color"
                value={config.frame.color}
                onChange={(e) => update({ frame: { ...config.frame, color: e.target.value } })}
                className="h-10 w-full rounded-md border border-line bg-panel2 cursor-pointer"
              />
            </Field>
            <SliderField
              label="Border width"
              value={config.frame.width}
              min={2}
              max={40}
              step={1}
              onChange={(v) => update({ frame: { ...config.frame, width: v } })}
              display={`${config.frame.width}px`}
            />
          </>
        )}
      </Section>

      <Section title="Logo">
        <UploadRow
          label={config.logo.dataUrl ? 'Replace logo' : 'Upload logo'}
          onFile={async (file) => {
            const dataUrl = await fileToDataUrl(file)
            update({ logo: { ...config.logo, dataUrl } })
          }}
        />
        {config.logo.dataUrl && (
          <button
            className="text-xs text-red-400 hover:text-red-300 mt-1"
            onClick={() => update({ logo: { ...config.logo, dataUrl: null } })}
          >
            Remove logo
          </button>
        )}
        {!config.logo.dataUrl && (
          <Field label="Fallback text (shown until logo is uploaded)">
            <input
              type="text"
              value={config.logo.fallbackText}
              onChange={(e) => update({ logo: { ...config.logo, fallbackText: e.target.value } })}
              className="input"
            />
          </Field>
        )}
      </Section>

      {config.template === 'family' ? (
        <>
          <AvatarGroupEditor
            title="Parents"
            hint="Father / Mother (or first parent)"
            list={config.family.parents}
            max={GROUP_LIMITS.parents}
            onChange={(next) => updateFamilyGroup('parents', next)}
          />
          <AvatarGroupEditor
            title="Other relatives"
            hint="Uncle, Aunt, Grandfather, Grandmother, cousins…"
            list={config.family.relatives}
            max={GROUP_LIMITS.relatives}
            onChange={(next) => updateFamilyGroup('relatives', next)}
            freeLabel
          />
          <AvatarGroupEditor
            title="Children"
            hint="Up to 5"
            list={config.family.children}
            max={GROUP_LIMITS.children}
            onChange={(next) => updateFamilyGroup('children', next)}
            autoLabel={(i) => `Child #${i + 1}`}
          />
        </>
      ) : (
        <AvatarGroupEditor
          title="Friends"
          hint="Up to 8"
          list={config.friends.list}
          max={GROUP_LIMITS.friends}
          onChange={updateFriends}
          autoLabel={(i) => `Friend #${i + 1}`}
        />
      )}
    </div>
  )
}

/* ---------- Layout primitives ---------- */

function Section({ title, children }) {
  return (
    <div className="bg-panel border border-line rounded-xl p-4">
      <h2 className="text-sm font-semibold text-gray-200 mb-3 uppercase tracking-wide">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-400">{label}</span>
      {children}
    </label>
  )
}

function SegmentButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors border ${
        active
          ? 'bg-accent text-white border-accent'
          : 'bg-panel2 text-gray-300 border-line hover:border-gray-500'
      }`}
    >
      {children}
    </button>
  )
}

function SliderField({ label, value, min, max, step, onChange, display }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{label}</span>
        <span>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  )
}

function ToggleRow({ icon, label, checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full bg-panel2 border border-line rounded-md px-3 py-2"
    >
      <span className="flex items-center gap-2 text-sm text-gray-200">
        {icon}
        {label}
      </span>
      <span
        className={`w-9 h-5 rounded-full relative transition-colors ${
          checked ? 'bg-accent' : 'bg-line'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : ''
          }`}
        />
      </span>
    </button>
  )
}

function UploadRow({ label, onFile }) {
  const inputRef = useRef(null)
  return (
    <div>
      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 w-full justify-center bg-panel2 hover:bg-[#2E3340] border border-dashed border-line rounded-md px-3 py-3 text-sm text-gray-300"
      >
        <Upload size={16} />
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file && isImageFile(file)) onFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

/* ---------- Avatar group editor (parents / relatives / children / friends) ---------- */

function AvatarGroupEditor({ title, hint, list, max, onChange, freeLabel, autoLabel }) {
  const addSlot = () => {
    if (list.length >= max) return
    const label = autoLabel ? autoLabel(list.length) : ''
    onChange([...list, makeSlot(label)])
  }

  const removeSlot = (id) => onChange(list.filter((s) => s.id !== id))

  const updateSlot = (id, patch) =>
    onChange(list.map((s) => (s.id === id ? { ...s, ...patch } : s)))

  return (
    <Section title={`${title} (${list.length}/${max})`}>
      {hint && <p className="text-xs text-gray-500 -mt-1 mb-1">{hint}</p>}
      {list.map((slot, i) => (
        <AvatarSlotRow
          key={slot.id}
          slot={slot}
          index={i}
          freeLabel={freeLabel}
          editableLabel={true}
          autoLabel={autoLabel}
          onLabelChange={(label) => updateSlot(slot.id, { label })}
          onFile={async (file) => {
            const dataUrl = await fileToDataUrl(file)
            updateSlot(slot.id, { dataUrl })
          }}
          onRemove={() => removeSlot(slot.id)}
        />
      ))}
      <button
        onClick={addSlot}
        disabled={list.length >= max}
        className="flex items-center justify-center gap-1 text-sm text-accent hover:text-white disabled:opacity-40 disabled:cursor-not-allowed border border-dashed border-line rounded-md py-2"
      >
        <Plus size={15} /> Add {title.toLowerCase()}
      </button>
    </Section>
  )
}

function AvatarSlotRow({ slot, index, editableLabel, freeLabel, autoLabel, onLabelChange, onFile, onRemove }) {
  const inputRef = useRef(null)
  const placeholderText = freeLabel
    ? 'e.g. Uncle, Grandma…'
    : autoLabel
    ? autoLabel(index)
    : `Item #${index + 1}`

  return (
    <div className="flex items-center gap-2 bg-panel2 border border-line rounded-md p-2">
      <button
        onClick={() => inputRef.current?.click()}
        className="w-11 h-11 rounded-full border border-line flex items-center justify-center overflow-hidden shrink-0 bg-[#1A1D24]"
        title="Upload avatar"
      >
        {slot.dataUrl ? (
          <img src={slot.dataUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={16} className="text-gray-500" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file && isImageFile(file)) onFile(file)
          e.target.value = ''
        }}
      />

      {editableLabel ? (
        <input
          type="text"
          value={slot.label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder={placeholderText}
          className="input flex-1"
        />
      ) : (
        <span className="flex-1 text-sm text-gray-300">{slot.label}</span>
      )}

      <button onClick={onRemove} className="text-gray-500 hover:text-red-400 shrink-0">
        <Trash2 size={16} />
      </button>
    </div>
  )
}
