/**
 * Phase B: Emoji patches for Ranger / Explorer / Scholar / Master
 * Strategy: for each conflict group, primary word keeps emoji; others get reassigned.
 * Many abstract words already have Phosphor icon overrides in lib/wordIcon.ts —
 * they're included anyway for consistency (emoji = fallback for unsupported devices).
 */
const fs = require('fs')
const path = require('path')
const DATA_PATH = path.join(__dirname, '..', 'data', 'words.json')
const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

const PATCHES = {
  // ─────────────────────────────── RANGER ──────────────────────────────────
  ranger: [
    // 📅 cluster (7): booking keeps; others get calendar/time variants
    { word: 'reservation',   emoji: '🗓️' },
    { word: 'appointment',   emoji: '📆' },
    { word: 'timetable',     emoji: '📐' },
    { word: 'schedule',      emoji: '📝' },   // notepad
    { word: 'decade',        emoji: '🔟' },   // 10
    { word: 'weekly',        emoji: '🗒️' },

    // 🙏 cluster (6): apologize keeps
    { word: 'patient',       emoji: '🕰️' },   // waiting = patience
    { word: 'respect',       emoji: '🎖️' },   // medal = honor
    { word: 'ancestor',      emoji: '🌳' },   // family tree
    { word: 'blessing',      emoji: '🌟' },
    { word: 'grateful',      emoji: '🤗' },

    // 📋 cluster (6): menu keeps
    { word: 'prescription',  emoji: '💊' },
    { word: 'plot',          emoji: '📖' },   // book = story plot

    // 🌿 cluster (6): recovery keeps (healing = growing back)
    { word: 'herb',          emoji: '🍃' },
    { word: 'habitat',       emoji: '🌲' },
    { word: 'ecosystem',     emoji: '♻️' },
    { word: 'balcony',       emoji: '🏗️' },
    { word: 'wild',          emoji: '🦁' },

    // 🗺️ cluster (5): geography keeps
    { word: 'mind map',      emoji: '🧠' },
    { word: 'adventure',     emoji: '⛺' },
    { word: 'peninsula',     emoji: '🏝️' },
    { word: 'terrain',       emoji: '⛰️' },

    // 🎨 cluster (5): art keeps
    { word: 'painting',      emoji: '🖼️' },
    { word: 'mold',          emoji: '🫙' },
    { word: 'pattern',       emoji: '🔲' },
    { word: 'dye',           emoji: '🟣' },

    // ✅ cluster (5): agree keeps
    { word: 'reliable',      emoji: '🔒' },
    { word: 'conclusion',    emoji: '💡' },
    { word: 'subscribe',     emoji: '🔔' },
    { word: 'qualify',       emoji: '🥇' },

    // ⚡ cluster (5): lightning keeps
    { word: 'electrician',   emoji: '🔌' },
    { word: 'conflict',      emoji: '💢' },
    { word: 'electricity',   emoji: '🔋' },
    { word: 'instant',       emoji: '⏱️' },

    // 🔄 cluster (5): update keeps
    { word: 'transfer',      emoji: '🚌' },
    { word: 'roundtrip',     emoji: '🎫' },
    { word: 'substitute',    emoji: '👥' },
    { word: 'routine',       emoji: '⏰' },

    // 🏛️ cluster (4): history keeps
    { word: 'public',        emoji: '👥' },
    { word: 'century',       emoji: '📅' },
    { word: 'era',           emoji: '🏺' },

    // 📚 cluster (4): librarian keeps (person = librarian)
    { word: 'revise',        emoji: '✏️' },
    { word: 'publish',       emoji: '📰' },
    { word: 'series',        emoji: '📕' },

    // 🤝 cluster (4): bargain keeps
    { word: 'trust',         emoji: '🤲' },
    { word: 'reconcile',     emoji: '🕊️' },
    { word: 'volunteer',     emoji: '🙌' },

    // 🌊 cluster (4): ocean keeps
    { word: 'coastal',       emoji: '🏖️' },
    { word: 'flood',         emoji: '🌧️' },
    { word: 'tide',          emoji: '🌕' },

    // 🧳 cluster (3): luggage keeps
    { word: 'immigrant',     emoji: '✈️' },
    { word: 'baggage claim', emoji: '🏷️' },

    // 😤 cluster (3): complain keeps
    { word: 'stubborn',      emoji: '🐂' },
    { word: 'proud',         emoji: '🦁' },

    // 📝 cluster (3): request keeps
    { word: 'summarize',     emoji: '📃' },
    { word: 'caption',       emoji: '🖼️' },

    // 🔔 cluster (3): remind keeps
    { word: 'notification',  emoji: '📲' },
    { word: 'doorbell',      emoji: '🚪' },

    // 🔧 cluster (3): mechanic keeps
    { word: 'repair',        emoji: '🪛' },
    { word: 'glue',          emoji: '🧱' },

    // 🏋️ cluster (3): athletic keeps
    { word: 'training',      emoji: '🎽' },
    { word: 'practice',      emoji: '🏃' },

    // 🔍 cluster (3): mystery keeps
    { word: 'diagnosis',     emoji: '🩺' },
    { word: 'evidence',      emoji: '📋' },

    // 🏔️ cluster (3): scenic keeps
    { word: 'valley',        emoji: '🌄' },
    { word: 'canyon',        emoji: '🗺️' },

    // 💬 cluster (3): argument keeps
    { word: 'communicate',   emoji: '📞' },
    { word: 'comment',       emoji: '💭' },

    // 👤 cluster (3): account keeps
    { word: 'character',     emoji: '🎭' },
    { word: 'profile',       emoji: '📛' },

    // ⏰ cluster (3): delay keeps
    { word: 'deadline',      emoji: '🚨' },
    { word: 'punctual',      emoji: '🕐' },

    // 💪 cluster (3): competitive keeps
    { word: 'confident',     emoji: '🌟' },
    { word: 'cope',          emoji: '🛡️' },

    // 🚶 cluster (3): pedestrian keeps
    { word: 'procession',    emoji: '🎊' },
    { word: 'sidewalk',      emoji: '🛤️' },

    // 🛫 cluster (2): airport keeps
    { word: 'departure',     emoji: '🧳' },

    // 📕 cluster (2): passport keeps
    { word: 'fiction',       emoji: '📖' },

    // 🎁 cluster (2): souvenir keeps
    { word: 'generous',      emoji: '🤲' },

    // 🗂️ cluster (2): visa keeps
    { word: 'classify',      emoji: '📊' },
  ],

  // ─────────────────────────────── EXPLORER ────────────────────────────────
  explorer: [
    // 💪 cluster (8): muscle keeps
    { word: 'survive',       emoji: '🛡️' },
    { word: 'confident',     emoji: '⭐' },
    { word: 'challenge',     emoji: '🎯' },
    { word: 'perseverance',  emoji: '🏆' },
    { word: 'resilience',    emoji: '🌱' },
    { word: 'self-esteem',   emoji: '💎' },
    { word: 'endurance',     emoji: '🏅' },

    // ⚔️ cluster (8): sword/conflict - warrior keeps ⚔️
    { word: 'defeat',        emoji: '❌' },
    { word: 'confront',      emoji: '⚠️' },
    { word: 'opponent',      emoji: '👥' },
    { word: 'conquer',       emoji: '🚩' },
    { word: 'compete',       emoji: '🏆' },
    { word: 'rival',         emoji: '🤺' },
    { word: 'conflict',      emoji: '💢' },

    // 🤝 cluster (7): teamwork keeps
    { word: 'loyal',         emoji: '❤️' },
    { word: 'alliance',      emoji: '🤜' },
    { word: 'trade',         emoji: '💱' },
    { word: 'customer',      emoji: '🛒' },
    { word: 'sportsmanship', emoji: '🏅' },
    { word: 'aid',           emoji: '🆘' },

    // 💡 cluster (6): invention keeps
    { word: 'theory',        emoji: '🧠' },
    { word: 'influence',     emoji: '🌊' },
    { word: 'innovation',    emoji: '🚀' },
    { word: 'infer',         emoji: '🔎' },
    { word: 'creative',      emoji: '🎨' },

    // 📊 cluster (5): data keeps
    { word: 'analyze',       emoji: '🔍' },
    { word: 'budget',        emoji: '💰' },
    { word: 'scale',         emoji: '📏' },
    { word: 'evaluate',      emoji: '⚖️' },

    // 🏛️ cluster (6): debate keeps
    { word: 'republic',      emoji: '🌍' },
    { word: 'court',         emoji: '⚖️' },
    { word: 'column',        emoji: '🏟️' },
    { word: 'exhibition',    emoji: '🖼️' },
    { word: 'gallery',       emoji: '🗿' },

    // 🌿 cluster (4): organic keeps
    { word: 'habitat',       emoji: '🌲' },
    { word: 'ecosystem',     emoji: '♻️' },
    { word: 'natural selection', emoji: '🦕' },

    // 🌐 cluster (5): network keeps
    { word: 'equator',       emoji: '🌍' },
    { word: 'hemisphere',    emoji: '🗺️' },
    { word: 'human rights',  emoji: '🛡️' },
    { word: 'cooperation',   emoji: '🤜' },

    // 🌱 cluster (4): herbivore keeps
    { word: 'recovery',      emoji: '🌿' },
    { word: 'sustainable',   emoji: '♻️' },
    { word: 'organism',      emoji: '🔬' },

    // 🤖 cluster (4): robot keeps
    { word: 'algorithm',     emoji: '💻' },
    { word: 'chatbot',       emoji: '💬' },
    { word: 'artificial intelligence', emoji: '🧠' },

    // ⚡ cluster (4): lightning keeps
    { word: 'circuit',       emoji: '🔌' },
    { word: 'nerve',         emoji: '🧠' },
    { word: 'penalty',       emoji: '🟥' },
    { word: 'mutation',      emoji: '🔄' },

    // 💻 cluster (4): software keeps
    { word: 'code',          emoji: '⌨️' },
    { word: 'digital art',   emoji: '🖌️' },

    // 🧠 cluster (4): intelligence keeps
    { word: 'artificial',    emoji: '🤖' },
    { word: 'memory',        emoji: '💾' },
    { word: 'tactic',        emoji: '♟️' },

    // 🛡️ cluster (4): protect keeps
    { word: 'immune',        emoji: '💉' },
    { word: 'invasion',      emoji: '⚔️' },
    { word: 'prevention',    emoji: '🚫' },

    // 🔍 cluster (4): discover keeps
    { word: 'perspective',   emoji: '👁️' },
    { word: 'diagnose',      emoji: '🩺' },
    { word: 'evidence',      emoji: '📋' },

    // 👁️ cluster (4): observe keeps
    { word: 'witness',       emoji: '🗣️' },
    { word: 'perception',    emoji: '🌀' },

    // 📋 cluster (4): trial keeps
    { word: 'appeal',        emoji: '⚖️' },
    { word: 'prescription',  emoji: '💊' },

    // 🌍 cluster (3): conservation keeps
    { word: 'continent',     emoji: '🗺️' },
    { word: 'migration',     emoji: '🦅' },

    // ⚖️ cluster (3): bias keeps
    { word: 'law',           emoji: '⚖️' },
    { word: 'inequality',    emoji: '📉' },

    // ❌ cluster (3): misinformation keeps
    { word: 'fallacy',       emoji: '🚫' },

    // 👑 cluster (4): leadership keeps
    { word: 'empire',        emoji: '🏰' },
    { word: 'dynasty',       emoji: '📜' },
    { word: 'masterpiece',   emoji: '🖼️' },

    // 💊 cluster (4): hormone keeps
    { word: 'treatment',     emoji: '🏥' },
    { word: 'antibiotic',    emoji: '🦠' },
    { word: 'supplement',    emoji: '🥗' },

    // 🔥 cluster (4): revolution keeps
    { word: 'climax',        emoji: '⭐' },
    { word: 'motivation',    emoji: '💪' },
    { word: 'calorie',       emoji: '🍔' },

    // 💀 cluster (2): extinct keeps
    { word: 'skeleton',      emoji: '🦴' },

    // 🔬 cluster (3): species keeps
    { word: 'cell',          emoji: '🧬' },
    { word: 'DNA',           emoji: '🧬' },

    // 🎯 cluster (3): determined keeps
    { word: 'accomplish',    emoji: '✅' },
    { word: 'technique',     emoji: '🔧' },

    // 🚀 cluster (3): mission keeps
    { word: 'launch',        emoji: '🛸' },
    { word: 'startup',       emoji: '💡' },

    // 🏗️ cluster (2): construct keeps
    { word: 'structure',     emoji: '🏛️' },

    // 📐 cluster (3): design keeps
    { word: 'blueprint',     emoji: '🗺️' },
    { word: 'composition',   emoji: '🖼️' },

    // 🏭 cluster (2): manufacture keeps
    { word: 'pollution',     emoji: '💨' },
  ],

  // ─────────────────────────────── SCHOLAR ─────────────────────────────────
  scholar: [
    // 🤝 cluster (14): transaction keeps
    { word: 'empathy',       emoji: '❤️' },
    { word: 'coalition',     emoji: '👥' },
    { word: 'pledge',        emoji: '📜' },
    { word: 'partnership',   emoji: '🤜' },
    { word: 'sportsmanship', emoji: '🏅' },
    { word: 'tolerance',     emoji: '🕊️' },
    { word: 'negotiate',     emoji: '💬' },
    { word: 'mediation',     emoji: '⚖️' },
    { word: 'alliance',      emoji: '🛡️' },
    { word: 'collaborate',   emoji: '👥' },
    { word: 'loan',          emoji: '💰' },
    { word: 'sponsor',       emoji: '🏆' },
    { word: 'commitment',    emoji: '📌' },

    // ⚖️ cluster (9): bias keeps
    { word: 'impartial',     emoji: '🎯' },
    { word: 'inequality',    emoji: '📉' },
    { word: 'equality',      emoji: '🟰' },
    { word: 'justice',       emoji: '⚖️' },
    { word: 'arbitration',   emoji: '🔨' },
    { word: 'punishment',    emoji: '🚫' },
    { word: 'balance',       emoji: '🌗' },
    { word: 'fairness',      emoji: '🎗️' },

    // 🏛️ cluster (7): subsidy keeps
    { word: 'authority',     emoji: '👑' },
    { word: 'heritage',      emoji: '🏺' },
    { word: 'architecture',  emoji: '🏗️' },
    { word: 'municipality',  emoji: '🌆' },
    { word: 'civilization',  emoji: '📜' },
    { word: 'diplomatic',    emoji: '🤝' },

    // 📊 cluster (7): circulation keeps
    { word: 'forecast',      emoji: '📈' },
    { word: 'record',        emoji: '🏆' },
    { word: 'hierarchy',     emoji: '🌲' },
    { word: 'visualize',     emoji: '📉' },
    { word: 'budget',        emoji: '💰' },
    { word: 'demand',        emoji: '📦' },

    // 🌐 cluster (7): GDP keeps
    { word: 'sovereignty',   emoji: '👑' },
    { word: 'diplomat',      emoji: '✈️' },
    { word: 'outsource',     emoji: '🏭' },
    { word: 'convention',    emoji: '📋' },
    { word: 'netizen',       emoji: '💻' },
    { word: 'assimilate',    emoji: '🔄' },

    // 🎭 cluster (7): behavior keeps
    { word: 'exhibition',    emoji: '🖼️' },
    { word: 'genre',         emoji: '📚' },
    { word: 'deepfake',      emoji: '🎭' },
    { word: 'anonymous',     emoji: '👤' },
    { word: 'improvise',     emoji: '🎵' },
    { word: 'cast',          emoji: '🎬' },

    // 🔄 cluster (7): reform keeps
    { word: 'chronic',       emoji: '🩺' },
    { word: 'motif',         emoji: '🎨' },
    { word: 'orbit',         emoji: '🌍' },
    { word: 'interaction',   emoji: '💬' },
    { word: 'recovery',      emoji: '🌱' },
    { word: 'adaptation',    emoji: '🦋' },

    // 🚫 cluster (5): censorship keeps
    { word: 'sanction',      emoji: '🚨' },
    { word: 'discrimination',emoji: '⚠️' },
    { word: 'taboo',         emoji: '🔕' },
    { word: 'illegal',       emoji: '❌' },

    // 🌟 cluster (5): feature keeps
    { word: 'dignity',       emoji: '🎗️' },
    { word: 'original',      emoji: '💎' },
    { word: 'wellbeing',     emoji: '🌈' },
    { word: 'performance',   emoji: '🎭' },

    // 🛡️ cluster (5): immune keeps
    { word: 'moderate',      emoji: '⚖️' },
    { word: 'insurance',     emoji: '📋' },
    { word: 'prevention',    emoji: '🚫' },
    { word: 'protect',       emoji: '🔒' },

    // ⚡ cluster (5): agility keeps
    { word: 'productivity',  emoji: '📈' },
    { word: 'dispute',       emoji: '💬' },
    { word: 'brainstorm',    emoji: '💡' },
    { word: 'violence',      emoji: '💢' },

    // 📉 cluster (4): recession keeps
    { word: 'mortality',     emoji: '⚠️' },
    { word: 'regression',    emoji: '📊' },
    { word: 'investment',    emoji: '💰' },

    // 🏆 cluster (4): monopoly keeps
    { word: 'masterpiece',   emoji: '🖼️' },
    { word: 'tournament',    emoji: '🥇' },
    { word: 'award',         emoji: '🎖️' },

    // 💵 cluster (4): currency keeps
    { word: 'dividend',      emoji: '📈' },
    { word: 'salary',        emoji: '💼' },
    { word: 'fine',          emoji: '🚫' },

    // 👁️ cluster (3): perception keeps
    { word: 'perspective',   emoji: '🌀' },
    { word: 'surveillance',  emoji: '📷' },

    // 🔥 cluster (4): motivation keeps
    { word: 'competitive',   emoji: '🏆' },
    { word: 'viral',         emoji: '📣' },
    { word: 'burnout',       emoji: '😮‍💨' },

    // 🌀 cluster (4): disorder keeps
    { word: 'abstract',      emoji: '🎭' },
    { word: 'unconventional',emoji: '🔀' },
    { word: 'influence',     emoji: '🌊' },

    // 📜 cluster (4): constitution keeps
    { word: 'narrative',     emoji: '📖' },
    { word: 'charter',       emoji: '📋' },
    { word: 'resolution',    emoji: '✅' },

    // 💡 cluster (4): ideology keeps
    { word: 'innovation',    emoji: '🚀' },
    { word: 'theme',         emoji: '📖' },
    { word: 'inspiration',   emoji: '✨' },

    // 🌿 cluster (4): sustainable keeps
    { word: 'carbon neutral',emoji: '🌍' },
    { word: 'authentic',     emoji: '💎' },
    { word: 'lifestyle',     emoji: '🌈' },

    // 📋 cluster (3): regulation keeps
    { word: 'appraisal',     emoji: '📊' },
    { word: 'responsibility',emoji: '⚖️' },

    // ⭐ cluster (4): protagonist keeps
    { word: 'constellation', emoji: '🌌' },
    { word: 'outlier',       emoji: '📊' },

    // 📈 cluster (4): promotion keeps
    { word: 'escalate',      emoji: '⬆️' },
    { word: 'trend',         emoji: '📊' },
    { word: 'income',        emoji: '💵' },

    // 💬 cluster (4): feedback keeps
    { word: 'negotiation',   emoji: '🤝' },
    { word: 'persuade',      emoji: '🗣️' },
    { word: 'controversial', emoji: '⚠️' },

    // ✍️ cluster (3): editorial keeps
    { word: 'prose',         emoji: '📝' },
    { word: 'ratify',        emoji: '✅' },

    // ✅ cluster (3): verify keeps
    { word: 'qualify',       emoji: '🥇' },
    { word: 'productive',    emoji: '📈' },

    // 🏷️ cluster (3): tariff keeps
    { word: 'stereotype',    emoji: '⚠️' },
    { word: 'brand',         emoji: '✨' },

    // 💰 cluster (3): fiscal keeps
    { word: 'revenue',       emoji: '📈' },
    { word: 'afford',        emoji: '💳' },

    // 📣 cluster (2): campaign keeps
    { word: 'advocacy',      emoji: '📢' },

    // 🚀 cluster (3): initiative keeps
    { word: 'entrepreneur',  emoji: '💡' },
    { word: 'breakthrough',  emoji: '💥' },
  ],

  // ─────────────────────────────── MASTER ──────────────────────────────────
  master: [
    // 🔍 cluster (8): analyze keeps
    { word: 'evidence',      emoji: '📋' },
    { word: 'etymology',     emoji: '📖' },
    { word: 'judicial review',emoji: '⚖️' },
    { word: 'transparency',  emoji: '🔎' },
    { word: 'peer review',   emoji: '👥' },
    { word: 'audit',         emoji: '📊' },
    { word: 'fact-check',    emoji: '✅' },

    // ⚖️ cluster (10): evaluate keeps
    { word: 'morality',      emoji: '🎗️' },
    { word: 'jurisdiction',  emoji: '🔑' },
    { word: 'rule of law',   emoji: '⚖️' },
    { word: 'equality',      emoji: '🟰' },
    { word: 'stability',     emoji: '🏛️' },
    { word: 'rights',        emoji: '🛡️' },
    { word: 'bias',          emoji: '⚠️' },
    { word: 'international law', emoji: '🌍' },
    { word: 'justice',       emoji: '🔨' },

    // ✅ cluster (9): conclusion keeps
    { word: 'peer-reviewed', emoji: '🔬' },
    { word: 'accreditation', emoji: '🎓' },
    { word: 'ratify',        emoji: '📜' },
    { word: 'legitimacy',    emoji: '👑' },
    { word: 'compliance',    emoji: '📋' },
    { word: 'credibility',   emoji: '💎' },
    { word: 'consent',       emoji: '🤝' },
    { word: 'substantiate',  emoji: '🔍' },

    // 🤝 cluster (9): civil society keeps
    { word: 'social policy', emoji: '📋' },
    { word: 'collaboration', emoji: '👥' },
    { word: 'alliance',      emoji: '🛡️' },
    { word: 'diplomacy',     emoji: '🌍' },
    { word: 'concession',    emoji: '🕊️' },
    { word: 'NGO',           emoji: '❤️' },
    { word: 'cooperation',   emoji: '🤜' },
    { word: 'solidarity',    emoji: '✊' },

    // 📊 cluster (5): variable keeps
    { word: 'utilitarianism',emoji: '💭' },
    { word: 'public debt',   emoji: '💰' },
    { word: 'inequality',    emoji: '📉' },

    // 🔗 cluster (6): synthesize keeps
    { word: 'logical',       emoji: '🧠' },
    { word: 'coherence',     emoji: '✅' },
    { word: 'inference',     emoji: '💭' },
    { word: 'interdependence',emoji: '🔗' },
    { word: 'integration',   emoji: '🔀' },

    // ⚡ cluster (7): lean keeps
    { word: 'disruption',    emoji: '💥' },
    { word: 'transition',    emoji: '🔄' },
    { word: 'intervention',  emoji: '🚨' },
    { word: 'tension',       emoji: '⚠️' },
    { word: 'conflict of interest', emoji: '⚖️' },
    { word: 'impulse',       emoji: '💢' },

    // 🌐 cluster (6): bilingual keeps
    { word: 'multilateral',  emoji: '🌍' },
    { word: 'social capital',emoji: '❤️' },
    { word: 'digital equity',emoji: '💻' },
    { word: 'transnational', emoji: '✈️' },
    { word: 'minority language', emoji: '🗣️' },

    // 🏛️ cluster (6): separation of powers keeps
    { word: 'legislature',   emoji: '📜' },
    { word: 'governance',    emoji: '👑' },
    { word: 'public service',emoji: '🏛️' },
    { word: 'ethics committee', emoji: '⚖️' },
    { word: 'institution',   emoji: '🏢' },

    // 📋 cluster (5): abstract keeps
    { word: 'liable',        emoji: '⚖️' },
    { word: 'enrollment',    emoji: '🎓' },
    { word: 'accountability',emoji: '📊' },
    { word: 'informed consent', emoji: '✅' },

    // 👥 cluster (5): peer review keeps (different word)
    { word: 'stakeholder',   emoji: '👤' },
    { word: 'demonstration', emoji: '📢' },
    { word: 'minority',      emoji: '🔵' },
    { word: 'conformity',    emoji: '👥' },

    // 🔄 cluster (6): pivot keeps
    { word: 'paradox',       emoji: '❓' },
    { word: 'adaptation',    emoji: '🦋' },
    { word: 'echo chamber',  emoji: '🔊' },
    { word: 'rebuttal',      emoji: '↩️' },
    { word: 'assimilation',  emoji: '🔀' },

    // 🚫 cluster (4): sanction keeps
    { word: 'discrimination',emoji: '⚠️' },
    { word: 'censorship',    emoji: '🔇' },
    { word: 'prejudice',     emoji: '🚧' },

    // 📌 cluster (4): citation keeps
    { word: 'premise',       emoji: '💭' },
    { word: 'claim',         emoji: '🗣️' },
    { word: 'assertion',     emoji: '❗' },

    // 💬 cluster (4): argument keeps
    { word: 'fluency',       emoji: '🗣️' },
    { word: 'negotiation',   emoji: '🤝' },
    { word: 'discourse',     emoji: '📢' },

    // 📜 cluster (5): legislation keeps
    { word: 'constitution',  emoji: '📋' },
    { word: 'protocol',      emoji: '🔒' },
    { word: 'treaty',        emoji: '🤝' },
    { word: 'heritage',      emoji: '🏺' },

    // ⚠️ cluster (4): constitute keeps
    { word: 'plagiarism',    emoji: '🚫' },
    { word: 'corruption',    emoji: '🔴' },
    { word: 'fallacy',       emoji: '❌' },

    // 🎓 cluster (4): scholarship keeps
    { word: 'academic integrity', emoji: '🛡️' },
    { word: 'research ethics', emoji: '⚖️' },

    // 📏 cluster (3): discipline keeps
    { word: 'compliance',    emoji: '📝' },
    { word: 'regulation',    emoji: '📋' },

    // 🌟 cluster (5): virtue keeps
    { word: 'fundamental rights', emoji: '🛡️' },
    { word: 'human dignity', emoji: '❤️' },
    { word: 'opportunity',   emoji: '🚀' },
    { word: 'wellbeing',     emoji: '🌈' },

    // 🎯 cluster (4): critique keeps
    { word: 'articulate',    emoji: '🗣️' },
    { word: 'outcome',       emoji: '✅' },
    { word: 'objectivity',   emoji: '⚖️' },

    // 📚 cluster (4): bibliography keeps
    { word: 'curriculum',    emoji: '📝' },
    { word: 'doctrine',      emoji: '📜' },
    { word: 'precedent',     emoji: '⚖️' },
  ],
}

// Apply patches
let totalPatched = 0
const errors = []

for (const [level, patches] of Object.entries(PATCHES)) {
  const levelData = data[level]
  if (!levelData) { errors.push('Level not found: ' + level); continue }

  for (const patch of patches) {
    let matched = 0
    for (const topic of levelData.topics) {
      for (const word of topic.words) {
        if (word.word === patch.word) {
          word.emoji = patch.emoji
          matched++
          totalPatched++
        }
      }
    }
    if (matched === 0) errors.push('[' + level + '] Not found: "' + patch.word + '"')
  }
}

// Validate: conflicts remaining per level
console.log('\n=== VALIDATION ===')
let totalRemaining = 0
for (const level of ['ranger','explorer','scholar','master']) {
  const levelData = data[level]
  const emojiMap = {}
  for (const topic of levelData.topics) {
    for (const word of topic.words) {
      if (!emojiMap[word.emoji]) emojiMap[word.emoji] = []
      emojiMap[word.emoji].push(word.word)
    }
  }
  const conflicts = Object.entries(emojiMap)
    .filter(([,ws]) => new Set(ws).size > 1)
  const unique = Object.values(emojiMap).filter(ws => new Set(ws).size === 1).length
  const total = levelData.topics.reduce((s, t) => s + t.words.length, 0)
  console.log(level + ': ' + unique + '/' + total + ' unique | ' + conflicts.length + ' conflict groups remain')
  totalRemaining += conflicts.length
}

if (errors.length) {
  console.log('\n=== WORD NOT FOUND (' + errors.length + ') ===')
  errors.slice(0, 20).forEach(e => console.log(' ', e))
}

console.log('\n=== SUMMARY ===')
console.log('Patched:', totalPatched, '| Remaining conflicts:', totalRemaining, '| Errors:', errors.length)

fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2))
console.log('✓ Saved')
