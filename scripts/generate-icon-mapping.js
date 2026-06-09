/**
 * Generates Phosphor icon mapping for all 676 uncovered vocabulary words.
 * Run: node scripts/generate-icon-mapping.js
 * Output: lib/wordIconExtension.ts — imported by lib/wordIcon.ts
 */
const fs = require('fs'), path = require('path')

const MAPPINGS = {
  // ─── RANGER ───────────────────────────────────────────────────────────────
  // Animal World
  'camouflage':'Binoculars', 'mammal':'Dog', 'migrate':'AirplaneTakeoff',
  'reptile':'BugBeetle', 'wild':'Campfire',
  // Books & Stories
  'chapter':'BookOpen', 'character':'Detective', 'fiction':'BookBookmark',
  'illustrate':'Image', 'plot':'Article', 'publish':'Newspaper',
  'review':'Star', 'series':'Books',
  // City & Community
  'charity':'HandHeart', 'district':'MapPin', 'emergency':'Ambulance',
  'infrastructure':'Bridge', 'public':'Megaphone', 'resident':'House',
  'sidewalk':'Footprints',
  // Countries & Culture
  'multilingual':'Translate', 'tradition':'CrownSimple',
  // Crafts
  'carve':'Knife', 'clay':'BowlFood', 'mold':'GearSix', 'stitch':'Needle',
  'texture':'Fingerprint', 'thread':'Swatches', 'weave':'GridFour',
  // Daily Communication
  'disagree':'XCircle', 'explain':'ChatText', 'remind':'BellRinging',
  'request':'ChatDots', 'suggest':'Lightbulb',
  // Describing People
  'anxious':'WarningCircle', 'curly':'WaveSine', 'generous':'HandCoins',
  'reliable':'ShieldCheck',
  // Describing Places
  'crowded':'UsersFour', 'industrial':'Factory', 'landscape':'Mountains',
  'lively':'MusicNotes', 'neighborhood':'BuildingApartment',
  'pollution':'CloudWarning', 'rural':'TreePalm',
  'suburb':'BuildingOffice', 'urban':'Buildings',
  // Digital Skills
  'screenshot':'Camera', 'subscribe':'BellSimple',
  // Emotions
  'comfort':'HandHeart', 'grateful':'HeartStraight', 'mood':'ChatCircle',
  'proud':'Trophy', 'sympathy':'Heart', 'tense':'Warning',
  // Environment
  'carbon':'Atom', 'conservation':'Leaf', 'drought':'SunHorizon',
  'emission':'Factory', 'recycle':'Recycle', 'wildlife':'TreeEvergreen',
  // Festivals
  'blessing':'Sparkle', 'decorate':'Swatches', 'feast':'BowlSteam',
  'harvest festival':'Plant', 'lantern':'Lightbulb', 'lunar':'Moon',
  'parade':'MegaphoneSimple', 'pilgrimage':'Footprints', 'procession':'UsersThree',
  // Food & Restaurant
  'buffet':'BowlFood', 'menu':'Article', 'portion':'ForkKnife',
  // Friendship
  'bond':'Link', 'forgive':'HeartBreak', 'gossip':'ChatCircle',
  'reconcile':'Handshake', 'trust':'ShieldCheck',
  // Health
  'diagnosis':'Stethoscope', 'medicine':'Pill', 'prescription':'FirstAid',
  'symptom':'WarningCircle',
  // Hobbies
  'birdwatching':'Binoculars', 'gardening':'Plant', 'journaling':'NotePencil',
  'knitting':'Needle', 'painting':'PaintBrush',
  // Home
  'balcony':'BuildingApartment', 'heating':'ThermometerHot',
  'neighbor':'HouseLine', 'rent':'CurrencyDollar', 'switch':'ToggleLeft',
  // Money
  'afford':'Wallet', 'brand':'Tag', 'discount':'Percent',
  // Nature & Geography
  'altitude':'ArrowFatUp', 'canyon':'RoadHorizon', 'cliff':'Mountains',
  'desert':'ThermometerHot', 'earthquake':'Warning', 'glacier':'Snowflake',
  'horizon':'SunHorizon', 'rainforest':'CloudRain', 'valley':'ArrowFatDown',
  // School Subjects
  'chemistry':'Flask', 'geography':'Globe', 'literature':'Books',
  'physical education':'Barbell',
  // Jobs
  'architect':'Crane', 'carpenter':'Hammer', 'electrician':'Circuitry',
  'journalist':'Newspaper', 'photographer':'Camera',
  // Basic Science
  'classify':'FunnelSimple', 'conclusion':'CheckCircle', 'dissolve':'Drop',
  'experiment':'TestTube', 'hypothesis':'Question', 'measure':'Ruler',
  'pressure':'Gauge', 'result':'ChartLine', 'temperature':'Thermometer',
  // Social Media
  'caption':'Image', 'comment':'ChatText', 'follow':'BellSimple',
  'influencer':'MegaphoneSimple', 'like':'ThumbsUp',
  'post':'PaperPlaneTilt', 'privacy':'Lock', 'share':'ShareNetwork',
  // Sports
  'athletics':'Medal', 'champion':'Crown', 'qualify':'Star',
  'substitute':'ArrowsCounterClockwise', 'tournament':'FlagBanner', 'trophy':'Trophy',
  // Study Skills
  'deadline':'Alarm', 'distraction':'BellSlash', 'memorize':'Brain',
  'mind map':'TreeStructure', 'practice':'ArrowClockwise', 'take notes':'NotePencil',
  // Time
  'annual':'Calendar', 'century':'HourglassHigh', 'dawn':'SunHorizon',
  'duration':'HourglassMedium', 'era':'BookOpen', 'expire':'CalendarX',
  'instant':'Lightning', 'midnight':'Moon', 'monthly':'CalendarHeart',
  'postpone':'ClockCounterClockwise', 'routine':'ArrowsClockwise',
  // Travel
  'luggage':'SuitcaseRolling', 'passport':'IdentificationCard',
  // Transport
  'baggage claim':'BagSimple', 'boarding pass':'Ticket', 'commute':'Train',
  'delay':'ClockCountdown', 'departure':'AirplaneTakeoff',
  'roundtrip':'ArrowsHorizontal', 'transfer':'ArrowCounterClockwise',
  // Weather
  'arctic':'Snowflake', 'barometer':'Gauge', 'flood':'Waves',
  'foggy':'CloudFog', 'humidity':'Drop', 'hurricane':'Tornado',
  'mild':'CloudSun', 'sleet':'CloudSnow',
  // World Food
  'ferment':'BowlSteam', 'fusion':'ArrowsMerge',

  // ─── EXPLORER ──────────────────────────────────────────────────────────────
  // Achievement
  'accomplish':'CheckCircle', 'championship':'Trophy', 'dedication':'Heart',
  'talent':'StarFour', 'triumph':'CrownSimple',
  // AI & Digital Technology
  'automation':'GearSix', 'chatbot':'ChatCircle', 'code':'Code',
  'input':'ArrowLineRight', 'intelligence':'Cpu',
  'machine':'Gear', 'platform':'PresentationChart',
  // Architecture
  'blueprint':'MapTrifold', 'design':'Palette', 'foundation':'Building',
  'material':'Cube', 'proportion':'Ruler', 'renovation':'Wrench',
  'structure':'CraneTower',
  // Art & Creativity
  'canvas':'ImageSquare', 'composition':'Palette', 'contrast':'CircleHalf',
  'digital art':'Monitor', 'inspire':'Sparkle', 'masterpiece':'StarFour',
  'medium':'PaintBrushBroad', 'portrait':'Camera', 'sculpture':'Cube',
  'sketch':'PencilSimple',
  // Biology
  'bacteria':'Virus', 'cell':'Atom', 'enzyme':'Flask', 'hormone':'TestTube',
  'muscle':'Barbell', 'nerve':'Circuitry', 'oxygen':'Drop',
  'protein':'BowlFood', 'skeleton':'Bone', 'tissue':'Microscope',
  // Business
  'failure':'XCircle', 'fund':'Coins', 'investment':'ChartLine',
  'pitch':'Presentation', 'profit':'ChartLine', 'revenue':'CurrencyDollar',
  'scale':'ArrowsOut', 'startup':'Rocket', 'strategy':'Target',
  // Climate Change
  'climate':'ThermometerHot', 'deforestation':'TreeEvergreen',
  'renewable':'Recycle', 'species':'Bird',
  // Communication
  'broadcast':'Broadcast', 'persuade':'ChatDots',
  // Critical Thinking
  'logic':'TreeStructure', 'perspective':'Eye', 'source':'Bookmark',
  // Digital Life
  'bandwidth':'WifiHigh', 'encrypt':'LockKey', 'misinformation':'Warning',
  'screen time':'DeviceMobile', 'streaming':'Television', 'username':'IdentificationBadge',
  // Economy
  'capital':'Bank', 'currency':'CurrencyDollar', 'debt':'ChartBar',
  'economy':'ChartPie', 'inflation':'ChartLine', 'tax':'CurrencyCircleDollar',
  'wage':'Briefcase',
  // Engineering
  'adjust':'Gauge', 'assemble':'PuzzlePiece', 'component':'GearFine',
  'mechanism':'Gear', 'operate':'Wrench',
  // Environment & Conservation
  'biodiversity':'CirclesThreePlus',
  // Genetics
  'chromosome':'Dna', 'DNA':'Dna', 'evolution':'ArrowsCounterClockwise',
  'fossil':'Bone', 'gene':'Dna', 'trait':'FunnelSimple',
  'variation':'ArrowsSplit',
  // Geography
  'continent':'GlobeHemisphereWest', 'delta':'Waves', 'estuary':'AnchorSimple',
  'latitude':'NavigationArrow', 'longitude':'ArrowUpRight',
  'peninsula':'Island', 'plateau':'SunHorizon',
  // Global Issues
  'crisis':'Warning', 'hunger':'BowlFood', 'literacy':'BookOpen',
  'poverty':'Coins', 'treaty':'Scroll',
  // Heroes
  'determined':'Target', 'mission':'Rocket', 'protect':'Shield',
  // History
  'ancient':'HourglassMedium', 'civilisation':'BookOpenText',
  'colony':'Flag', 'invasion':'Sword',
  // Laboratory
  'discover':'Binoculars', 'investigate':'Detective', 'observe':'Eye',
  // Law & Justice
  'appeal':'ChatCentered', 'constitution':'Scroll', 'crime':'Warning',
  'defendant':'Person', 'jury':'UsersThree', 'trial':'Gavel',
  'verdict':'Gavel', 'witness':'Eye',
  // Literature
  'climax':'ArrowFatUp', 'critic':'MagnifyingGlass', 'dialogue':'ChatTeardrop',
  'narrative':'BookOpen', 'setting':'MapPin',
  // Medicine
  'antibiotic':'Pill', 'disease':'Virus', 'epidemic':'Virus',
  'infection':'Virus', 'prevention':'ShieldCheck', 'recovery':'Heart',
  'surgery':'Syringe', 'treatment':'Stethoscope', 'vaccine':'Syringe',
  // Mission & Tactics
  'endure':'Shield', 'overcome':'ArrowFatUp', 'sacrifice':'Heart',
  'superpower':'Lightning', 'transform':'ArrowsCounterClockwise',
  // Music
  'audience':'Users', 'compose':'MusicNotes', 'solo':'MicrophoneStage',
  // Nutrition
  'diet':'Scales', 'ingredient':'BowlFood', 'mineral':'Drop',
  'nutrition':'Nut', 'supplement':'Pill',
  // Psychology
  'behavior':'Brain', 'habit':'ArrowsClockwise', 'instinct':'Lightning',
  'trauma':'Warning',
  // Science
  'carnivore':'Knife',
  // Space
  'launch':'RocketLaunch', 'orbit':'ArrowsClockwise', 'spacecraft':'Rocket',
  // Sports
  'athlete':'Barbell', 'sportsmanship':'Handshake',
  'sprint':'ArrowFatRight', 'tactic':'Target', 'technique':'Wrench',
  // Technology
  'artificial':'Cpu', 'device':'DeviceMobile', 'program':'Code',
  'robot':'Robot', 'sensor':'Binoculars', 'software':'Laptop',

  // ─── SCHOLAR ──────────────────────────────────────────────────────────────
  // Advertising
  'campaign':'Megaphone', 'loyalty':'Heart', 'promote':'MegaphoneSimple',
  'target':'Crosshair',
  // Art & Culture
  'aesthetic':'Palette', 'curator':'FolderOpen', 'installation':'Cube',
  // Arts & Entertainment
  'award':'Medal', 'cast':'UsersThree', 'concert':'MicrophoneStage',
  'film':'FilmSlate', 'novel':'Book', 'performance':'MaskHappy',
  'remake':'ArrowCounterClockwise', 'screenplay':'NotePencil',
  'theatre':'BuildingOffice',
  // Business Management
  'dividend':'ChartLine', 'entrepreneur':'Rocket',
  'liability':'Warning', 'merger':'ArrowsMerge',
  // Career
  'appraisal':'ChartBar', 'feedback':'ChatText', 'productivity':'ChartLine',
  'promotion':'ArrowFatUp', 'resume':'IdentificationCard',
  // Conflict Resolution
  'compromise':'Handshake', 'dispute':'Warning', 'negotiation':'ChatDots',
  'resolution':'CheckCircle', 'tension':'WarningCircle',
  // Creativity
  'brainstorm':'Brain', 'breakthrough':'Lightning', 'concept':'Lightbulb',
  'generate':'Sparkle', 'implement':'Gear', 'improvise':'MusicNote',
  'inspiration':'StarFour', 'original':'Diamond', 'prototype':'Cube',
  'refine':'GearFine', 'unconventional':'ArrowsCounterClockwise',
  // Crime
  'arrest':'Barricade', 'fine':'CurrencyDollar', 'guilty':'WarningOctagon',
  'illegal':'XCircle', 'rehabilitation':'ArrowCounterClockwise',
  'sentence':'Scroll',
  // Digital Society
  'deepfake':'Warning', 'subscription':'BellRinging',
  // Economics
  'fiscal':'Bank', 'import':'ArrowLineDown',
  'interest rate':'Percent', 'monopoly':'Crown', 'recession':'ChartLine',
  // Environment Policy
  'carbon neutral':'Recycle', 'initiative':'Lightbulb',
  'offshore':'Anchor', 'regulation':'Gavel',
  // Ethics
  'consequence':'ArrowRight', 'controversial':'WarningCircle',
  'freedom':'Bird', 'impact':'Lightning', 'justify':'Scales',
  'obligation':'Certificate',
  // Family
  'divorce':'HeartBreak', 'value':'Diamond',
  // Global Issues
  'geopolitics':'Globe', 'humanitarian':'HandHeart',
  'migration':'AirplaneTakeoff',
  // Health Medicine
  'chronic':'Heartbeat', 'mortality':'Warning',
  'pandemic':'Virus', 'pharmaceutical':'Pill',
  // History
  'artifact':'HourglassMedium', 'chronology':'Calendar',
  'legacy':'BookOpen', 'uprising':'Flag',
  // Human Rights
  'asylum':'House', 'charter':'Scroll', 'dignity':'Certificate',
  'violation':'XCircle',
  // Literary Analysis
  'allegory':'Image', 'metaphor':'ArrowsMerge', 'motif':'Swatches',
  'prose':'Article', 'symbolism':'Sparkle', 'theme':'MagnifyingGlass',
  'verse':'MusicNote',
  // Media
  'broadcast':'Broadcast', 'correspondent':'PaperPlaneTilt',
  'coverage':'Newspaper', 'verify':'CheckCircle',
  // Personal Finance
  'credit':'CreditCard', 'income':'Coins',
  'insurance':'Shield', 'mortgage':'House', 'savings':'Coin',
  // Politics
  'democracy':'UsersThree', 'ideology':'Lightbulb',
  'policy':'Notepad', 'referendum':'CheckSquare',
  // Psychology
  'anxiety':'Warning', 'cognitive':'Brain', 'disorder':'WarningCircle',
  'stereotype':'WarningOctagon',
  // Social Behavior
  'interaction':'ArrowsHorizontal', 'norm':'Scales',
  'peer pressure':'Users', 'status':'Crown',
  // Space
  'constellation':'Star', 'galaxy':'Planet', 'nebula':'Sparkle',
  // Sports
  'stamina':'Heartbeat', 'tactics':'Target', 'training':'PersonSimpleRun',
  // Statistics
  'interpret':'MagnifyingGlass', 'margin':'Ruler', 'median':'Scales',
  'outlier':'Warning', 'proportion':'ChartPie',
  'survey':'ClipboardText', 'trend':'ChartLine',
  // Future Tech
  'machine learning':'Brain',
  // Tourism
  'accommodation':'Bed', 'authentic':'Certificate',
  'cultural exchange':'Globe', 'destination':'MapPin', 'diverse':'CirclesFour',
  'eco-tourism':'TreeEvergreen', 'impression':'Star', 'tourism':'Airplane',
  // Urban Development
  'construction':'Crane', 'density':'BuildingApartment',
  'gentrification':'ArrowFatUp',
  'urban sprawl':'MapTrifold', 'zoning':'MapPin',
  // Wellbeing
  'active':'Heartbeat', 'fitness':'Barbell', 'lifestyle':'Sun',
  'mindfulness':'Brain', 'productive':'CheckCircle', 'wellbeing':'Heart',

  // ─── MASTER ───────────────────────────────────────────────────────────────
  // Academic Discourse
  'critical thinking':'Brain', 'seminar':'Users',
  // Argumentation
  'counterargument':'ArrowsCounterClockwise',
  // Bioethics
  'gene editing':'Dna', 'genetic engineering':'Dna',
  'human dignity':'Certificate', 'moral':'Scales',
  // Business Ethics
  'accountability':'ChartBar', 'bribery':'HandCoins',
  'integrity':'ShieldCheck',
  // Constitutional Law
  'amendment':'NotePencil', 'civil liberties':'Shield',
  'democratic':'Users', 'due process':'Gavel',
  'fundamental rights':'ShieldStar', 'precedent':'BookBookmark',
  // Consumer Society
  'aspiration':'ArrowFatUp', 'consumption':'ShoppingCart',
  'materialism':'Coins',
  // Education System
  'assessment':'ChartBar', 'curriculum':'Books', 'dropout':'XCircle',
  'enrollment':'GraduationCap', 'scholarship':'Certificate',
  'tuition':'CurrencyDollar',
  // Environmental Governance
  'enforcement':'Gavel', 'mitigation':'ShieldCheck',
  'net-zero':'Recycle', 'protocol':'Notepad',
  'transition':'ArrowFatRight',
  // Food & Agriculture
  'agribusiness':'Factory', 'arable':'Plant', 'crop':'Leaf',
  'genetically modified':'Dna',
  // Geopolitics
  // (negotiation, tension, treaty already mapped)
  // Global Governance
  'peacekeeping':'Shield',
  // Globalisation
  'corporation':'Buildings', 'dominance':'Crown',
  'opportunity':'Rocket',
  // Immigration & Identity
  'diaspora':'Globe', 'identity':'IdentificationCard',
  'multiculturalism':'CirclesFour',
  // Innovation & Startups
  'accelerator':'RocketLaunch', 'disrupt':'Lightning',
  'funding':'Coins', 'iteration':'ArrowsClockwise',
  'valuation':'ChartBar', 'venture capital':'HandCoins',
  // Language & Communication
  'ambiguous':'Question', 'articulate':'MicrophoneStage',
  'dialect':'Globe', 'eloquent':'Microphone', 'fluency':'ChatText',
  // Language & Power
  'dominant':'Crown', 'representation':'Users',
  // Law & Justice
  'constitute':'Gavel', 'liable':'Warning',
  'penalty':'XCircle', 'statute':'Scroll',
  'testimony':'Microphone', 'verdict':'Gavel',
  // Macroeconomics
  'austerity':'ChartBar', 'market failure':'Warning',
  'privatization':'Buildings',
  // Medical Ethics
  'euthanasia':'Heart', 'experimental':'TestTube',
  'organ donation':'HeartStraight', 'patient rights':'Certificate',
  // Philosophy
  'consciousness':'Brain', 'dilemma':'Question',
  'doctrine':'BookOpen', 'rational':'Brain',
  // Political Philosophy
  'pluralism':'CirclesFour',
  // Social Psychology
  'attitude':'Brain',
  // Public Policy
  'access':'Key', 'welfare':'HandHeart',
  // Rhetoric
  'claim':'Quotes', 'persuasion':'MegaphoneSimple',
  // Science & Research
  'clinical':'Stethoscope', 'ethics':'Scales', 'finding':'MagnifyingGlass',
  'genome':'Dna', 'replicate':'Copy', 'sample':'Flask', 'significant':'Star',
  // Social Change
  'movement':'Flag', 'resistance':'Shield', 'transformation':'ArrowsMerge',
  // Sociology
  'marginalization':'Warning', 'privilege':'Crown', 'diversity':'CirclesFour',
  // Tech Ethics
  'AI':'Brain', 'surveillance':'Eye', 'disruption':'Lightning',
  // Remaining uncovered words (cross-level fill)
  'tempo':'Timer', 'stakeholder':'UsersFour',
  'competitive':'Sword', 'record':'ChartBar',
  'moderate':'Scales', 'regression':'ChartLine',
  'responsibility':'ShieldCheck', 'legislation':'Scroll',
  'variable':'Gauge', 'peer-reviewed':'ShieldCheck',
  'premise':'BookOpen', 'utilitarianism':'Scales',
  'outcome':'CheckCircle', 'conflict of interest':'Scales',
  'objectivity':'Scales', 'international law':'Globe',
  'NGO':'HeartStraight', 'perception':'Eye',
}

// ── Validate ────────────────────────────────────────────────────────────────
const phosphorContent = fs.readFileSync(
  path.join(__dirname,'..','node_modules/@phosphor-icons/react/dist/index.d.ts'), 'utf8')
const validIcons = new Set(
  [...phosphorContent.matchAll(/from '\.\/csr\/([^']+)'/g)].map(m => m[1])
)

let invalid = 0
for (const [w, icon] of Object.entries(MAPPINGS)) {
  if (!validIcons.has(icon)) { console.error('INVALID:', w, '→', icon); invalid++ }
}
if (!invalid) console.log('All', Object.keys(MAPPINGS).length, 'icons valid ✓')

// ── Write output ─────────────────────────────────────────────────────────────
const lines = Object.entries(MAPPINGS).map(([w,i]) => `  '${w}': '${i}',`).join('\n')
const out = `// AUTO-GENERATED — do not edit manually; run scripts/generate-icon-mapping.js
export const WORD_ICONS_EXTENDED: Record<string, string> = {\n${lines}\n}\n`
fs.writeFileSync(path.join(__dirname,'..','lib','wordIconExtension.ts'), out)
console.log('Written lib/wordIconExtension.ts')
