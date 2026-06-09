/**
 * Phase B: Phosphor icon overrides for abstract words (Ranger/Explorer/Scholar/Master)
 * When a word has an entry here, render a Phosphor icon instead of emoji.
 * Icon names match @phosphor-icons/react exports exactly.
 */

// Key: English word (lowercase), Value: Phosphor icon name
const WORD_ICONS: Record<string, string> = {
  // ── RANGER: Calendar/time cluster (📅 shared by 7 words) ─────────────────
  booking:       'CalendarCheck',
  reservation:   'CalendarPlus',
  appointment:   'CalendarDots',
  timetable:     'Table',
  schedule:      'CalendarBlank',
  decade:        'ClockCounterClockwise',
  weekly:        'Clock',
  agenda:        'Notepad',
  itinerary:     'Scroll',
  assignment:    'FileText',

  // ── RANGER: Behavior/virtue cluster (🙏 shared by 6 words) ──────────────
  ancestor:      'Tree',
  ecosystem:     'ArrowsClockwise',  // fix: was Recycle (dup w/ sustainable in same topic)
  habitat:       'Leaf',
  'natural selection': 'TreeEvergreen',
  organic:       'GlobeSimple',      // fix: was Leaf (dup w/ habitat in same topic)

  // ── EXPLORER: Strength/resilience cluster (💪 shared by 8 words) ─────────
  survive:       'Shield',
  confident:     'Star',
  challenge:     'Target',
  perseverance:  'Trophy',
  resilience:    'ShieldCheck',
  'self-esteem': 'Certificate',
  endurance:     'Medal',

  // ── EXPLORER: Conflict cluster (⚔️ shared by 8 words) ───────────────────
  defeat:        'Sword',
  confront:      'WarningCircle',
  opponent:      'Users',
  conquer:       'Flag',            // fix: was Crown (dup w/ empire+dynasty in history topic)
  warrior:       'Sword',
  compete:       'Trophy',
  rival:         'UsersThree',
  conflict:      'Warning',

  // ── EXPLORER: Cooperation cluster (🤝 shared by 7 words) ─────────────────
  loyal:         'Heart',
  alliance:      'Handshake',
  teamwork:      'UsersFour',
  trade:         'ArrowsHorizontal',
  customer:      'UsersThree',
  aid:           'HeartStraight',

  // ── EXPLORER: Ideas cluster (💡 shared by 6 words) ───────────────────────
  invention:     'Lightbulb',
  theory:        'Brain',
  influence:     'Lightning',
  innovation:    'LightbulbFilament',
  infer:         'Brain',           // fix: was MagnifyingGlass (dup w/ analyze in lab/critical-thinking)
  creative:      'StarFour',

  // ── EXPLORER: Data/analysis cluster (📊 shared by 6 words) ──────────────
  analyze:       'MagnifyingGlass',
  budget:        'ChartBar',
  data:          'Table',
  evaluate:      'Scales',

  // ── EXPLORER: Institutions cluster (🏛️ shared by 6 words) ───────────────
  debate:        'Users',           // fix: was Quotes (dup w/ argument in critical-thinking)
  republic:      'Globe',
  court:         'Scales',          // fix: was Gavel (dup w/ law+justice in law-justice topic)
  exhibition:    'Star',
  gallery:       'FolderOpen',

  // ── EXPLORER: Global cluster (🌐 shared by 5 words) ─────────────────────
  network:       'Globe',           // fix: was TreeStructure (dup w/ algorithm+organism in ai topic)
  equator:       'GlobeSimple',
  hemisphere:    'GlobeHemisphereEast',
  'human rights': 'ShieldCheck',
  cooperation:   'Handshake',

  // ── EXPLORER: Nature cluster ─────────────────────────────────────────────
  herbivore:     'Leaf',
  sustainable:   'Recycle',
  organism:      'TreeStructure',
  'artificial intelligence': 'Brain',
  algorithm:     'TreeStructure',
  circuit:       'Lightning',
  mutation:      'ArrowsClockwise',
  adaptation:    'ArrowCounterClockwise', // fix: was ArrowsClockwise (dup w/ mutation)
  electricity:   'Lightning',

  // ── EXPLORER: Legal/history cluster ──────────────────────────────────────
  bias:          'Warning',         // fix: was Scales (dup w/ evaluate in critical-thinking)
  law:           'Gavel',
  inequality:    'Scales',
  immune:        'ShieldCheck',
  leadership:    'Crown',
  empire:        'Crown',
  dynasty:       'Scroll',          // fix: was Crown (dup w/ empire in history topic)
  revolution:    'Flame',
  motivation:    'Flame',
  viral:         'Lightning',
  justice:       'Shield',          // fix: was Gavel (dup w/ law in law-justice topic)
  rights:        'ShieldCheck',     // fix: was Shield (dup w/ justice in law-justice topic)

  // ── SCHOLAR: Cooperation cluster (🤝 shared by 14 words) ─────────────────
  transaction:   'ArrowsHorizontal',
  empathy:       'Heart',
  coalition:     'UsersFour',
  pledge:        'Certificate',
  partnership:   'Handshake',
  tolerance:     'HeartStraight',
  negotiate:     'Quotes',
  mediation:     'Scales',
  collaborate:   'UsersFour',
  loan:          'ChartBar',
  sponsor:       'Star',
  commitment:    'Certificate',
  diplomacy:     'Globe',
  solidarity:    'HeartStraight',

  // ── SCHOLAR: Justice cluster (⚖️ shared by 11 words) ────────────────────
  impartial:     'Scales',
  equality:      'Scales',
  arbitration:   'Gavel',
  punishment:    'Gavel',
  fairness:      'Scales',
  balance:       'Scales',
  morality:      'Certificate',
  jurisdiction:  'LockKey',         // fix: was Gavel (dup in constitutional-law topic)
  'rule of law': 'Gavel',
  stability:     'ShieldCheck',     // fix: was Shield (dup w/ justice/rights)

  // ── SCHOLAR: Institution cluster (🏛️ shared by 8 words) ─────────────────
  subsidy:       'ChartBar',
  authority:     'Crown',
  heritage:      'BookOpen',
  architecture:  'Tree',
  municipality:  'Globe',
  civilization:  'BookOpen',
  diplomatic:    'Handshake',
  institution:   'BookOpenText',

  // ── SCHOLAR: Economics cluster (📊 shared by 7 words) ───────────────────
  circulation:   'ArrowsClockwise',
  forecast:      'ChartBar',
  hierarchy:     'TreeStructure',
  visualize:     'ChartBarHorizontal',
  demand:        'ArrowFatUp',      // fix: was ChartBar (dup w/ budget+forecast in econ topic)

  // ── SCHOLAR: Governance cluster (🌐 shared) ──────────────────────────────
  'gdp':         'ChartBar',
  sovereignty:   'Crown',
  diplomat:      'GlobeSimple',     // fix: was Globe (dup w/ diplomacy in some topics)
  outsource:     'ArrowRight',
  convention:    'Users',
  assimilate:    'ArrowsCounterClockwise',

  // ── MASTER: Research cluster (🔍 shared by 11 words) ─────────────────────
  synthesize:    'ArrowsMerge',
  'peer review': 'MagnifyingGlass',
  transparency:  'MagnifyingGlass',
  audit:         'MagnifyingGlass',
  'fact-check':  'CheckCircle',
  evidence:      'FileText',        // fix: was MagnifyingGlass (dup w/ analyze in lab/critical-thinking)
  etymology:     'BookOpen',
  'judicial review': 'ShieldCheck', // fix: was Gavel (dup w/ rule-of-law in constitutional-law)

  // ── MASTER: Research/academic cluster ───────────────────────────────────
  thesis:        'FileText',
  methodology:   'Notepad',
  citation:      'Quotes',
  abstract:      'FileText',
  paraphrase:    'Quotes',
  coherent:      'CheckCircle',
  argument:      'Quotes',
  critique:      'MagnifyingGlass',
  bibliography:  'Books',
  'academic integrity': 'ShieldCheck',
  'research ethics':    'ShieldCheck',
  credibility:   'Certificate',
  plagiarism:    'WarningCircle',
  accreditation: 'Certificate',
  ratify:        'CheckCircle',
  legitimacy:    'Certificate',
  compliance:    'CheckCircle',
  consent:       'CheckCircle',
  substantiate:  'MagnifyingGlass',
  'informed consent': 'CheckCircle',

  // ── MASTER: Social/political cluster ─────────────────────────────────────
  'civil society':    'Users',
  'social policy':    'Notepad',
  collaboration:      'UsersFour',
  concession:         'Handshake',
  NGO:                'HeartStraight',
  conformity:         'Users',
  demonstration:      'Flag',
  minority:           'UsersThree',
  'echo chamber':     'Quotes',
  rebuttal:           'ArrowsCounterClockwise',
  assimilation:       'ArrowsMerge',
  'social capital':   'Heart',
  'digital equity':   'Scales',
  multilateral:       'Globe',
  transnational:      'Globe',
  'minority language':'Translate',

  // ── MASTER: Governance cluster ────────────────────────────────────────────
  'separation of powers': 'Scales',
  legislature:    'Scroll',
  governance:     'Crown',
  'public service': 'Heart',
  'ethics committee': 'ShieldCheck',
  populism:       'Flag',
  sensationalism: 'Warning',
  advocacy:       'MagnifyingGlass',
  mobilize:       'Flag',
  whistleblower:  'WarningCircle',
  propaganda:     'Warning',
  protest:        'Flag',
  sanction:       'WarningCircle',
  discrimination: 'Scales',
  censorship:     'LockSimple',
  prejudice:      'Warning',
  corruption:     'Warning',
  fallacy:        'WarningCircle',

  // ── MASTER: Economic/social metrics ──────────────────────────────────────
  'public debt':  'ChartBar',
  'social mobility': 'ChartBar',
  scalable:       'ArrowsOut',
  yield:          'ChartBar',
  correlation:    'ArrowsHorizontal',

  // ── MASTER: Logic/reasoning ───────────────────────────────────────────────
  logical:        'Brain',
  coherence:      'CheckCircle',
  inference:      'ArrowRight',
  interdependence: 'ArrowsHorizontal',
  integration:    'ArrowsMerge',
  pivot:          'ArrowCounterClockwise',
  paradox:        'Question',
  implication:    'ArrowRight',
  assumption:     'Question',
  discourse:      'Quotes',

  // ── MASTER: Practical/vocational ─────────────────────────────────────────
  vocational:     'Certificate',
  pragmatic:      'Target',
  reform:         'ArrowsClockwise',
  incubator:      'Lightbulb',
  'corporate responsibility': 'HeartStraight',
  activism:       'Flag',
  fertilizer:     'Leaf',
  'stem cell':    'Brain',
  'clinical trial': 'Certificate',
  'evidence-based': 'MagnifyingGlass',
}

import { WORD_ICONS_EXTENDED } from './wordIconExtension'

const MERGED = { ...WORD_ICONS_EXTENDED, ...WORD_ICONS }

export function getWordIcon(word: string): string | null {
  return MERGED[word.toLowerCase()] ?? null
}
