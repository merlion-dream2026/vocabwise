'use client'
import { useEffect, useState } from 'react'
import Mascot from '@/components/Mascot'
import { PRESS } from '@/components/TopicHub'
import { MASCOT_CHARACTERS, MASCOT_NAMES, type MascotCharacter } from '@/lib/mascots'

const BLURB: Record<MascotCharacter, string> = { rocky: 'Voi xanh', bubi: 'Cá heo xanh' }
const CARD: Record<MascotCharacter, string> = {
  rocky: 'border-sky-200 border-b-sky-400 bg-gradient-to-b from-sky-100 to-white',
  bubi: 'border-pink-200 border-b-pink-400 bg-gradient-to-b from-pink-100 to-white',
}

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
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/40 p-3">
      <div className="my-auto w-full max-w-md rounded-[2rem] border-2 border-b-[4px] border-white border-b-slate-300 bg-gradient-to-b from-purple-100 via-white to-white px-4 pb-4 pt-5 text-center shadow-2xl">
        <h2 id="mascot-pick-title" className="text-2xl font-bold text-slate-800">Chọn bạn đồng hành ✨</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">{childName} muốn học cùng ai nào?</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {MASCOT_CHARACTERS.map((m, k) => (
            <button key={m} type="button" disabled={saving !== null} onClick={() => pick(m)}
              className={`flex flex-col items-center gap-1.5 rounded-3xl border-2 border-b-[5px] p-2 pb-3 disabled:opacity-60 ${CARD[m]} ${PRESS}`}>
              <span className="mi-pop w-full" style={{ animationDelay: `${k * 120}ms` }}>
                <Mascot character={m} shot="pose-wave" size={180} fluid priority className="mx-auto block rounded-[1.4rem] shadow-md ring-4 ring-white" />
              </span>
              <span className="mt-1 text-lg font-bold text-slate-800">{MASCOT_NAMES[m]}</span>
              <span className="text-xs font-semibold text-slate-500">{saving === m ? 'Đang lưu...' : BLURB[m]}</span>
              <span className="mt-1 rounded-full border-b-[3px] border-amber-600 bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950">Chọn {MASCOT_NAMES[m]}</span>
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
            ? <Mascot character={o.id} shot="pose-idle" size={72} />
            : <span className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-gray-100 text-2xl" aria-hidden>❔</span>}
          <span className="text-xs font-bold text-gray-700">{o.label}</span>
        </button>
      ))}
    </div>
  )
}
