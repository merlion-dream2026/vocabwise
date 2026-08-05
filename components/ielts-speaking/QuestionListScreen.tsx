'use client'

import { useState, type ChangeEvent } from 'react'
import StepDots from '@/components/ielts-speaking/StepDots'
import {
  buildPart1Batch,
  buildPart2Batch,
  buildPart3Batch,
  type BatchQuestion,
} from '@/components/ielts-speaking/batchQuestion'
import {
  IELTS_LINKED_SETS,
  IELTS_PART1_TOPICS,
  getLinkedSetById,
} from '@/lib/ieltsSpeakingQuestionBank'
import type { IeltsSpeakingPart } from '@/lib/ieltsSpeakingTypes'

type Props = {
  part: IeltsSpeakingPart
  onBack: () => void
  onSubmit: (batch: BatchQuestion[]) => void
}

function groupSetsByFamily(): Array<[string, typeof IELTS_LINKED_SETS]> {
  const groups = new Map<string, typeof IELTS_LINKED_SETS>()
  for (const set of IELTS_LINKED_SETS) {
    const list = groups.get(set.family)
    if (list) list.push(set)
    else groups.set(set.family, [set])
  }
  return Array.from(groups.entries())
}

const LINKED_SETS_BY_FAMILY = groupSetsByFamily()

const PART_LABEL: Record<IeltsSpeakingPart, string> = {
  1: 'Part 1 · Personal interview',
  2: 'Part 2 · Long turn',
  3: 'Part 3 · Discussion',
}

export default function QuestionListScreen({ part, onBack, onSubmit }: Props) {
  const initialTopic = IELTS_PART1_TOPICS[0]?.topic ?? 'Home'
  const initialSet = IELTS_LINKED_SETS[0]
  const initialGroup = initialSet.part3Groups[0]

  const [part1Topic, setPart1Topic] = useState(initialTopic)
  const [linkedSetId, setLinkedSetId] = useState(initialSet.id)
  const [part3GroupId, setPart3GroupId] = useState(initialGroup.id)

  const selectedSet = getLinkedSetById(linkedSetId) ?? initialSet
  const selectedGroup = selectedSet.part3Groups.find(group => group.id === part3GroupId) ?? selectedSet.part3Groups[0]

  const selectLinkedSet = (nextSetId: string) => {
    const nextSet = getLinkedSetById(nextSetId) ?? initialSet
    setLinkedSetId(nextSet.id)
    setPart3GroupId(nextSet.part3Groups[0].id)
  }

  const batch: BatchQuestion[] = part === 1
    ? buildPart1Batch(part1Topic)
    : part === 2
      ? buildPart2Batch(linkedSetId)
      : buildPart3Batch(linkedSetId, selectedGroup.id)

  return (
    <div>
      <StepDots current={2} />
      <div className="mb-4 flex items-center gap-2">
        <button type="button" onClick={onBack} aria-label="Quay lại" className="text-xl text-indigo-400 hover:text-indigo-600">
          ←
        </button>
        <p className="text-sm font-black text-gray-700">{PART_LABEL[part]}</p>
      </div>

      <section className="rounded-3xl border-2 border-indigo-100 bg-white p-4 shadow-sm sm:p-5">
        {part === 1 && (
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-gray-500">Chọn chủ đề</p>
            <select
              value={part1Topic}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => setPart1Topic(event.target.value)}
              className="mt-2 w-full rounded-xl border-2 border-indigo-100 bg-white px-3 py-3 text-sm font-black text-indigo-800 outline-none transition-colors focus:border-indigo-400"
            >
              {IELTS_PART1_TOPICS.map(item => (
                <option key={item.id} value={item.topic}>
                  {String(item.number).padStart(2, '0')} · {item.topic} ({item.questionCount})
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-gray-400">80 chủ đề · 401 câu hỏi</p>
          </div>
        )}

        {(part === 2 || part === 3) && (
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-gray-500">Chọn linked set</p>
            <select
              value={linkedSetId}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => selectLinkedSet(event.target.value)}
              className="mt-2 w-full rounded-xl border-2 border-indigo-100 bg-white px-3 py-3 text-sm font-black text-indigo-800 outline-none transition-colors focus:border-indigo-400"
            >
              {LINKED_SETS_BY_FAMILY.map(([family, sets]) => (
                <optgroup key={family} label={family}>
                  {sets.map(set => (
                    <option key={set.id} value={set.id}>
                      Set {String(set.number).padStart(2, '0')} · {set.linkedTopic}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-gray-400">60 sets · Part 2 cue card liên kết tự nhiên với hai nhóm câu hỏi Part 3</p>
          </div>
        )}

        {part === 3 && (
          <div className="mt-3">
            <p className="text-xs font-black uppercase tracking-wide text-gray-500">Chọn nhóm thảo luận</p>
            <select
              value={selectedGroup.id}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => setPart3GroupId(event.target.value)}
              className="mt-2 w-full rounded-xl border-2 border-cyan-100 bg-white px-3 py-3 text-sm font-black text-cyan-800 outline-none transition-colors focus:border-cyan-400"
            >
              {selectedSet.part3Groups.map(group => (
                <option key={group.id} value={group.id}>
                  Group {group.id} · {group.theme}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-4 space-y-2">
          <p className="text-xs font-black uppercase tracking-wide text-gray-500">
            Danh sách câu hỏi ({batch.length})
          </p>
          {batch.map((question, index) => (
            <div key={question.questionId} className="rounded-2xl border border-indigo-100 bg-indigo-50/50 px-3 py-2.5">
              <p className="text-xs font-black text-indigo-400">Câu {index + 1}</p>
              <p className="mt-0.5 text-sm font-bold leading-snug text-gray-800">{question.question}</p>
              {question.questionDetails && (
                <ul className="mt-1.5 space-y-0.5 text-xs text-gray-500">
                  {question.questionDetails.map(point => <li key={point}>• {point}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onSubmit(batch)}
          className="mt-4 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-sm font-black text-white shadow-md shadow-indigo-100 transition-all active:scale-[0.98]"
        >
          Trả lời →
        </button>
      </section>
    </div>
  )
}
