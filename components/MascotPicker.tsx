'use client'
import { useEffect, useState } from 'react'
import Mascot from '@/components/Mascot'
import { PRESS } from '@/components/TopicHub'
import { MASCOT_CHARACTERS, MASCOT_NAMES, type MascotCharacter } from '@/lib/mascots'

const BLURB: Record<MascotCharacter, string> = { rocky: 'Voi xanh', bubi: 'Cá heo xanh' }

// One-time "pick your companion" dialog, shown by ChildMascotProvider while children.mascot is NULL.
export function MascotPickDialog({ childName, onChoose, onLater }: {
  childName: string
  onChoose: (m: MascotCharacter) => Promise<boolean>
  onLater: () => void
}) {
  const [saving, setSaving] = useState<MascotCharacter | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onLater() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onLater])

  async function pick(m: MascotCharacter) {
    setSaving(m); setFailed(false)
    const ok = await onChoose(m)
    if (!ok) { setSaving(null); setFailed(true) }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="mascot-pick-title"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-3xl border-2 border-b-[4px] border-slate-200 border-b-slate-300 bg-white p-5 text-center">
        <h2 id="mascot-pick-title" className="text-xl font-bold text-slate-800">Chọn bạn đồng hành</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">{childName} muốn học cùng ai nào?</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {MASCOT_CHARACTERS.map(m => (
            <button key={m} type="button" disabled={saving !== null} onClick={() => pick(m)}
              className={`flex flex-col items-center gap-2 rounded-3xl border-2 border-b-[4px] border-purple-200 border-b-purple-300 bg-purple-50 p-3 disabled:opacity-60 ${PRESS}`}>
              <Mascot character={m} shot="pose-wave" size={100} priority />
              <span className="text-base font-bold text-slate-800">{MASCOT_NAMES[m]}</span>
              <span className="text-xs font-semibold text-slate-500">{saving === m ? 'Đang lưu...' : BLURB[m]}</span>
            </button>
          ))}
        </div>
        {failed && <p role="alert" className="mt-3 text-sm font-semibold text-red-500">Chưa lưu được, thử lại nhé.</p>}
        <button type="button" onClick={onLater} disabled={saving !== null}
          className="mt-3 rounded-full px-4 py-1.5 text-sm font-bold text-slate-400 hover:text-slate-600">
          Để sau
        </button>
        <p className="text-[11px] font-semibold text-slate-400">Đổi bạn đồng hành bất cứ lúc nào ở Dashboard → Sửa hồ sơ bé</p>
      </div>
    </div>
  )
}

// Compact picker for the add/edit child forms. `null` = let the child pick on first visit.
export function MascotOptions({ value, onChange }: {
  value: MascotCharacter | null
  onChange: (m: MascotCharacter | null) => void
}) {
  const opts: { id: MascotCharacter | null; label: string }[] = [
    { id: null, label: 'Để bé chọn' },
    ...MASCOT_CHARACTERS.map(m => ({ id: m, label: MASCOT_NAMES[m] })),
  ]
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Bạn đồng hành">
      {opts.map(o => (
        <button key={o.id ?? 'unset'} type="button" role="radio" aria-checked={value === o.id} onClick={() => onChange(o.id)}
          className={`flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-2 transition-all ${value === o.id ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
          {o.id
            ? <Mascot character={o.id} shot="pose-idle" size={44} />
            : <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-2xl" aria-hidden>❔</span>}
          <span className="text-xs font-bold text-gray-700">{o.label}</span>
        </button>
      ))}
    </div>
  )
}
