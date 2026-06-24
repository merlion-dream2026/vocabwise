export type MatchingItem   = { id: number; word: string }
export type MatchingOption = { id: string; text: string }
export type MCQItem        = { id: number; sentence: string; options: string[]; answer: string }
export type MCQMeaningItem = { id: number; word: string; options: string[]; answer: string }
export type GapFillItem    = { id: number; sentence: string; answer: string }
export type TFNGItem       = { id: number; statement: string; answer: 'True' | 'False' | 'Not Given' }
export type WordFormItem   = { id: number; sentence: string; base_word: string; answer: string }
export type SentenceItem   = { id: number; words: string[]; answer: string }
export type ErrorFixItem   = {
  id: number; sentence: string; highlighted: string
  options: { A: string; B: string; C: string }; answer: string
  explanation: string; explanation_vi?: string
}

export type Exercise =
  | { type: 'E1'; instruction: string; items: MatchingItem[]; options: MatchingOption[] }
  | { type: 'E2'; instruction: string; items: MCQMeaningItem[] }
  | { type: 'E3'; instruction: string; items: MCQItem[] }
  | { type: 'E4'; instruction: string; word_bank: string[]; items: GapFillItem[] }
  | { type: 'E5'; instruction: string; items: TFNGItem[] }
  | { type: 'E6'; instruction: string; items: WordFormItem[] }
  | { type: 'E7'; instruction: string; items: SentenceItem[] }
  | { type: 'E8'; instruction: string; items: ErrorFixItem[] }

export type ExercisesData = {
  combo: string
  ex1_matching?:       { type: 'E1'; instruction: string; items: MatchingItem[]; options: MatchingOption[] }
  ex1_tfng?:           { type: 'E5'; instruction: string; items: TFNGItem[] }
  ex2_mcq_context?:    { type: 'E3'; instruction: string; items: MCQItem[] }
  ex3_gap_fill?:       { type: 'E4'; instruction: string; word_bank: string[]; items: GapFillItem[]; note?: string }
  ex4_word_forms?:     { type: 'E6'; instruction: string; items: WordFormItem[] }
  ex4_reordering?:     { type: 'E7'; instruction: string; items: SentenceItem[] }
  ex5_error_fix?:      { type: 'E8'; instruction: string; items: ErrorFixItem[] }
  ex5_collocation?:    { type: 'E8'; instruction: string; items: ErrorFixItem[] }
  // Bonus exercises — optional, added per topic after user approval
  ex6_odd?:            { type: 'E_ODD'; instruction: string; items: OddItem[] }
  ex6_sd?:             { type: 'E_SD';  instruction: string; items: SDItem[]  }
  ex6_cat?:            { type: 'E_CAT'; instruction: string; categories: string[]; items: CatItem[] }
  ex6_sub?:            { type: 'E_SUB'; instruction: string; items: SubItem[] }
  ex6_col?:            { type: 'E_COL'; instruction: string; items: ColItem[] }
}

export type ExScores = { ex1: number; ex2: number; ex3: number; ex4: number; ex5: number }

// ── Bonus exercise item types (ex6) ──

export type OddItem = { id: number; words: string[]; answer: string; reason: string; reason_vi?: string }
export type SDItem  = { id: number; a: string; b: string; answer: 'S' | 'D'; explanation: string }
export type CatItem = { id: number; word: string; answer: string }
export type SubItem = { id: number; sentence: string; highlighted: string; options: string[]; answer: string }
export type ColItem = { id: number; sentence: string; options: string[]; answer: string; collocation: string }
