'use client'

import { useCallback, useState } from 'react'
import {
  Airplane, AirplaneTakeoff, Alarm, Ambulance, Anchor, AnchorSimple, ArrowClockwise,
  ArrowCounterClockwise, ArrowFatDown, ArrowFatRight, ArrowFatUp, ArrowLineDown, ArrowLineRight,
  ArrowRight, ArrowUpRight, ArrowsClockwise, ArrowsCounterClockwise, ArrowsHorizontal,
  ArrowsMerge, ArrowsOut, ArrowsSplit, Article, Atom, BagSimple, Bank, Barbell, Barricade, Bed,
  BellRinging, BellSimple, BellSlash, Binoculars, Bird, Bone, Book, BookBookmark, BookOpen,
  BookOpenText, Bookmark, Books, BowlFood, BowlSteam, Brain, Bridge, Briefcase, Broadcast,
  BugBeetle, Building, BuildingApartment, BuildingOffice, Buildings, Calendar, CalendarBlank,
  CalendarCheck, CalendarDots, CalendarHeart, CalendarPlus, CalendarX, Camera, Campfire,
  Certificate, ChartBar, ChartBarHorizontal, ChartLine, ChartPie, ChatCentered, ChatCircle,
  ChatDots, ChatTeardrop, ChatText, CheckCircle, CheckSquare, CircleHalf, CirclesFour,
  CirclesThreePlus, Circuitry, ClipboardText, Clock, ClockCountdown, ClockCounterClockwise,
  CloudFog, CloudRain, CloudSnow, CloudSun, CloudWarning, Code, Coin, Coins, Copy, Cpu, Crane,
  CraneTower, CreditCard, Crosshair, Crown, CrownSimple, Cube, CurrencyCircleDollar,
  CurrencyDollar, Detective, DeviceMobile, DeviceTablet, Diamond, Dna, Dog, Drop, Eye, EyeSlash,
  Factory, FileText, FilmSlate, Fingerprint, FirstAid, Flag, FlagBanner, Flame, Flask,
  FolderOpen, Footprints, ForkKnife, FunnelSimple, Gauge, Gavel, Gear, GearFine, GearSix, Globe,
  GlobeHemisphereEast, GlobeHemisphereWest, GlobeSimple, GraduationCap, GridFour, Hammer,
  HandCoins, HandHeart, Handshake, Heart, HeartBreak, HeartStraight, Heartbeat, HourglassHigh,
  HourglassMedium, House, HouseLine, IdentificationBadge, IdentificationCard, Image, ImageSquare,
  Info, Island, Key, Knife, Laptop, Leaf, Lightbulb, LightbulbFilament, Lightning, Link, Lock,
  LockKey, LockSimple, MagnetStraight, MagnifyingGlass, MapPin, MapTrifold, MaskHappy, Medal,
  Megaphone, MegaphoneSimple, Microphone, MicrophoneStage, Microscope, Monitor, Moon, Mountains,
  MusicNote, MusicNotes, NavigationArrow, Needle, Newspaper, NotePencil, Notepad, Nut,
  PaintBrush, PaintBrushBroad, Palette, PaperPlaneTilt, PencilSimple, Percent, Person,
  PersonSimpleRun, Pill, Planet, Plant, Presentation, PresentationChart, PuzzlePiece, Question,
  Quotes, Recycle, RoadHorizon, Robot, Rocket, RocketLaunch, Ruler, Scales, Scroll, ShareNetwork,
  Shield, ShieldCheck, ShieldSlash, ShieldStar, ShoppingCart, Sliders, SlidersHorizontal,
  Snowflake, Sparkle, Star, StarFour, Stethoscope, SuitcaseRolling, Sun, SunHorizon, Swatches,
  Sword, Syringe, Table, Tag, Target, Television, TestTube, Thermometer, ThermometerHot,
  ThumbsUp, Ticket, Timer, ToggleLeft, Tornado, Train, Translate, Tree, TreeEvergreen, TreePalm,
  TreeStructure, Trophy, Users, UsersFour, UsersThree, Virus, Wallet, Warning, WarningCircle,
  WarningOctagon, WaveSine, Waves, WifiHigh, WifiSlash, Wrench, XCircle
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { getWordIcon, getCustomSvgIcon, getWordImage } from '@/lib/wordIcon'
import IconZoom from './IconZoom'

type Props = {
  word: string
  emoji: string
  /** Tailwind text-size class for emoji, e.g. "text-8xl" */
  emojiClass?: string
  /** px size for Phosphor icon */
  iconSize?: number
  className?: string
}

// Static map of only the ~250 icons actually referenced by lib/wordIcon.ts +
// wordIconExtension.ts. Named imports (vs. `import * as Ph`) let webpack tree-shake
// the rest of the icon library out of the client bundle — a wildcard import here
// previously pulled the entire @phosphor-icons/react set (5MB+) into one chunk.
const ICON_MAP: Record<string, Icon> = {
  Airplane, AirplaneTakeoff, Alarm, Ambulance, Anchor, AnchorSimple, ArrowClockwise,
  ArrowCounterClockwise, ArrowFatDown, ArrowFatRight, ArrowFatUp, ArrowLineDown, ArrowLineRight,
  ArrowRight, ArrowUpRight, ArrowsClockwise, ArrowsCounterClockwise, ArrowsHorizontal,
  ArrowsMerge, ArrowsOut, ArrowsSplit, Article, Atom, BagSimple, Bank, Barbell, Barricade, Bed,
  BellRinging, BellSimple, BellSlash, Binoculars, Bird, Bone, Book, BookBookmark, BookOpen,
  BookOpenText, Bookmark, Books, BowlFood, BowlSteam, Brain, Bridge, Briefcase, Broadcast,
  BugBeetle, Building, BuildingApartment, BuildingOffice, Buildings, Calendar, CalendarBlank,
  CalendarCheck, CalendarDots, CalendarHeart, CalendarPlus, CalendarX, Camera, Campfire,
  Certificate, ChartBar, ChartBarHorizontal, ChartLine, ChartPie, ChatCentered, ChatCircle,
  ChatDots, ChatTeardrop, ChatText, CheckCircle, CheckSquare, CircleHalf, CirclesFour,
  CirclesThreePlus, Circuitry, ClipboardText, Clock, ClockCountdown, ClockCounterClockwise,
  CloudFog, CloudRain, CloudSnow, CloudSun, CloudWarning, Code, Coin, Coins, Copy, Cpu, Crane,
  CraneTower, CreditCard, Crosshair, Crown, CrownSimple, Cube, CurrencyCircleDollar,
  CurrencyDollar, Detective, DeviceMobile, DeviceTablet, Diamond, Dna, Dog, Drop, Eye, EyeSlash,
  Factory, FileText, FilmSlate, Fingerprint, FirstAid, Flag, FlagBanner, Flame, Flask,
  FolderOpen, Footprints, ForkKnife, FunnelSimple, Gauge, Gavel, Gear, GearFine, GearSix, Globe,
  GlobeHemisphereEast, GlobeHemisphereWest, GlobeSimple, GraduationCap, GridFour, Hammer,
  HandCoins, HandHeart, Handshake, Heart, HeartBreak, HeartStraight, Heartbeat, HourglassHigh,
  HourglassMedium, House, HouseLine, IdentificationBadge, IdentificationCard, Image, ImageSquare,
  Info, Island, Key, Knife, Laptop, Leaf, Lightbulb, LightbulbFilament, Lightning, Link, Lock,
  LockKey, LockSimple, MagnetStraight, MagnifyingGlass, MapPin, MapTrifold, MaskHappy, Medal,
  Megaphone, MegaphoneSimple, Microphone, MicrophoneStage, Microscope, Monitor, Moon, Mountains,
  MusicNote, MusicNotes, NavigationArrow, Needle, Newspaper, NotePencil, Notepad, Nut,
  PaintBrush, PaintBrushBroad, Palette, PaperPlaneTilt, PencilSimple, Percent, Person,
  PersonSimpleRun, Pill, Planet, Plant, Presentation, PresentationChart, PuzzlePiece, Question,
  Quotes, Recycle, RoadHorizon, Robot, Rocket, RocketLaunch, Ruler, Scales, Scroll, ShareNetwork,
  Shield, ShieldCheck, ShieldSlash, ShieldStar, ShoppingCart, Sliders, SlidersHorizontal,
  Snowflake, Sparkle, Star, StarFour, Stethoscope, SuitcaseRolling, Sun, SunHorizon, Swatches,
  Sword, Syringe, Table, Tag, Target, Television, TestTube, Thermometer, ThermometerHot,
  ThumbsUp, Ticket, Timer, ToggleLeft, Tornado, Train, Translate, Tree, TreeEvergreen, TreePalm,
  TreeStructure, Trophy, Users, UsersFour, UsersThree, Virus, Wallet, Warning, WarningCircle,
  WarningOctagon, WaveSine, Waves, WifiHigh, WifiSlash, Wrench, XCircle
}

/**
 * Renders the illustration for this sense of the word if one exists, else a Phosphor
 * icon if a mapping exists (abstract concepts), else a word-keyed illustration
 * (concrete words with no matching emoji glyph), else falls back to the emoji character.
 * `zoomable`: tap opens a large view (IconZoom). Only where the icon is not inside an answer
 * button and no timer runs — tapping must not cost a child an answer or game time.
 */
export default function WordIcon({ zoomable = false, ...props }: Props & { zoomable?: boolean }) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  if (!zoomable) return <IconGlyph {...props} />
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={`Phóng to hình ${props.word}`}
        className="relative inline-flex cursor-zoom-in rounded-2xl transition-transform active:scale-95">
        <IconGlyph {...props} />
        <span aria-hidden className="absolute -bottom-1 -right-1 flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-violet-200 bg-white shadow-sm">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round">
            <circle cx="10" cy="10" r="6" /><path d="M15 15l5 5M10 7.5v5M7.5 10h5" />
          </svg>
        </span>
      </button>
      {open && (
        <IconZoom label={`Hình ${props.word}`} onClose={close}>
          <IconGlyph word={props.word} emoji={props.emoji} className={props.className} large />
        </IconZoom>
      )}
    </>
  )
}

// Large = popup: 512px illustration (public/icons/words/zoom/, built by import-icons /
// build-icon-zoom), Phosphor and emoji scaled to fill the popup.
function IconGlyph({ word, emoji, emojiClass = 'text-8xl', iconSize = 100, className = '', large = false }: Props & { large?: boolean }) {
  const zoomImg = (src: string) =>
    <img src={src.replace('/icons/words/', '/icons/words/zoom/')} alt={word} width={512} height={512} className="h-full w-full object-contain" />

  const senseImage = getWordImage(word, emoji)
  if (senseImage) {
    return large ? zoomImg(senseImage)
      : <img src={senseImage} alt={word} width={iconSize} height={iconSize} style={{ height: iconSize, width: iconSize }} className={className} />
  }

  const iconName = getWordIcon(word)
  const IconComponent = iconName ? ICON_MAP[iconName] : undefined
  if (IconComponent) {
    return <IconComponent size={large ? '85%' : iconSize} weight="duotone" className={className} />
  }

  const customSvg = getCustomSvgIcon(word)
  if (customSvg) {
    return large ? zoomImg(customSvg)
      : <img src={customSvg} alt={word} style={{ height: iconSize, width: 'auto' }} className={className} />
  }

  return (
    <span className={`${large ? 'text-[10rem]' : emojiClass} leading-none select-none ${className}`}>
      {emoji}
    </span>
  )
}
