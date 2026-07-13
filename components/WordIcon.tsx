'use client'

import {
  Airplane, AirplaneTakeoff, Alarm, Ambulance, Anchor, AnchorSimple, ArrowClockwise,
  ArrowCounterClockwise, ArrowFatDown, ArrowFatRight, ArrowFatUp, ArrowLineDown, ArrowLineRight,
  ArrowRight, ArrowUpRight, ArrowsClockwise, ArrowsCounterClockwise, ArrowsHorizontal, ArrowsMerge,
  ArrowsOut, ArrowsSplit, Article, Atom, BagSimple, Bank, Barbell, Barricade, Bed, BellRinging,
  BellSimple, BellSlash, Binoculars, Bird, Bone, Book, BookBookmark, BookOpen, BookOpenText,
  Bookmark, Books, BowlFood, BowlSteam, Brain, Bridge, Briefcase, Broadcast, BugBeetle, Building,
  BuildingApartment, BuildingOffice, Buildings, Calendar, CalendarBlank, CalendarCheck, CalendarDots,
  CalendarHeart, CalendarPlus, CalendarX, Camera, Campfire, Certificate, ChartBar,
  ChartBarHorizontal, ChartLine, ChartPie, ChatCentered, ChatCircle, ChatDots, ChatTeardrop,
  ChatText, CheckCircle, CheckSquare, CircleHalf, CirclesFour, CirclesThreePlus, Circuitry,
  ClipboardText, Clock, ClockCountdown, ClockCounterClockwise, CloudFog, CloudRain, CloudSnow,
  CloudSun, CloudWarning, Code, Coin, Coins, Copy, Cpu, Crane, CraneTower, CreditCard, Crosshair,
  Crown, CrownSimple, Cube, CurrencyCircleDollar, CurrencyDollar, Detective, DeviceMobile, Diamond,
  Dna, Dog, Drop, Eye, Factory, FileText, FilmSlate, Fingerprint, FirstAid, Flag, FlagBanner, Flame,
  Flask, FolderOpen, Footprints, ForkKnife, FunnelSimple, Gauge, Gavel, Gear, GearFine, GearSix,
  Globe, GlobeHemisphereEast, GlobeHemisphereWest, GlobeSimple, GraduationCap, GridFour, Hammer,
  HandCoins, HandHeart, Handshake, Heart, HeartBreak, HeartStraight, Heartbeat, HourglassHigh,
  HourglassMedium, House, HouseLine, IdentificationBadge, IdentificationCard, Image, ImageSquare,
  Island, Key, Knife, Laptop, Leaf, Lightbulb, LightbulbFilament, Lightning, Link, Lock, LockKey,
  LockSimple, MagnifyingGlass, MapPin, MapTrifold, MaskHappy, Medal, Megaphone, MegaphoneSimple,
  Microphone, MicrophoneStage, Microscope, Monitor, Moon, Mountains, MusicNote, MusicNotes,
  NavigationArrow, Needle, Newspaper, NotePencil, Notepad, Nut, PaintBrush, PaintBrushBroad, Palette,
  PaperPlaneTilt, PencilSimple, Percent, Person, PersonSimpleRun, Pill, Planet, Plant, Presentation,
  PresentationChart, PuzzlePiece, Question, Quotes, Recycle, RoadHorizon, Robot, Rocket,
  RocketLaunch, Ruler, Scales, Scroll, ShareNetwork, Shield, ShieldCheck, ShieldStar, ShoppingCart,
  Snowflake, Sparkle, Star, StarFour, Stethoscope, SuitcaseRolling, Sun, SunHorizon, Swatches, Sword,
  Syringe, Table, Tag, Target, Television, TestTube, Thermometer, ThermometerHot, ThumbsUp, Ticket,
  Timer, ToggleLeft, Tornado, Train, Translate, Tree, TreeEvergreen, TreePalm, TreeStructure, Trophy,
  Users, UsersFour, UsersThree, Virus, Wallet, Warning, WarningCircle, WarningOctagon, WaveSine,
  Waves, WifiHigh, Wrench, XCircle,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { getWordIcon } from '@/lib/wordIcon'

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
  ArrowRight, ArrowUpRight, ArrowsClockwise, ArrowsCounterClockwise, ArrowsHorizontal, ArrowsMerge,
  ArrowsOut, ArrowsSplit, Article, Atom, BagSimple, Bank, Barbell, Barricade, Bed, BellRinging,
  BellSimple, BellSlash, Binoculars, Bird, Bone, Book, BookBookmark, BookOpen, BookOpenText,
  Bookmark, Books, BowlFood, BowlSteam, Brain, Bridge, Briefcase, Broadcast, BugBeetle, Building,
  BuildingApartment, BuildingOffice, Buildings, Calendar, CalendarBlank, CalendarCheck, CalendarDots,
  CalendarHeart, CalendarPlus, CalendarX, Camera, Campfire, Certificate, ChartBar,
  ChartBarHorizontal, ChartLine, ChartPie, ChatCentered, ChatCircle, ChatDots, ChatTeardrop,
  ChatText, CheckCircle, CheckSquare, CircleHalf, CirclesFour, CirclesThreePlus, Circuitry,
  ClipboardText, Clock, ClockCountdown, ClockCounterClockwise, CloudFog, CloudRain, CloudSnow,
  CloudSun, CloudWarning, Code, Coin, Coins, Copy, Cpu, Crane, CraneTower, CreditCard, Crosshair,
  Crown, CrownSimple, Cube, CurrencyCircleDollar, CurrencyDollar, Detective, DeviceMobile, Diamond,
  Dna, Dog, Drop, Eye, Factory, FileText, FilmSlate, Fingerprint, FirstAid, Flag, FlagBanner, Flame,
  Flask, FolderOpen, Footprints, ForkKnife, FunnelSimple, Gauge, Gavel, Gear, GearFine, GearSix,
  Globe, GlobeHemisphereEast, GlobeHemisphereWest, GlobeSimple, GraduationCap, GridFour, Hammer,
  HandCoins, HandHeart, Handshake, Heart, HeartBreak, HeartStraight, Heartbeat, HourglassHigh,
  HourglassMedium, House, HouseLine, IdentificationBadge, IdentificationCard, Image, ImageSquare,
  Island, Key, Knife, Laptop, Leaf, Lightbulb, LightbulbFilament, Lightning, Link, Lock, LockKey,
  LockSimple, MagnifyingGlass, MapPin, MapTrifold, MaskHappy, Medal, Megaphone, MegaphoneSimple,
  Microphone, MicrophoneStage, Microscope, Monitor, Moon, Mountains, MusicNote, MusicNotes,
  NavigationArrow, Needle, Newspaper, NotePencil, Notepad, Nut, PaintBrush, PaintBrushBroad, Palette,
  PaperPlaneTilt, PencilSimple, Percent, Person, PersonSimpleRun, Pill, Planet, Plant, Presentation,
  PresentationChart, PuzzlePiece, Question, Quotes, Recycle, RoadHorizon, Robot, Rocket,
  RocketLaunch, Ruler, Scales, Scroll, ShareNetwork, Shield, ShieldCheck, ShieldStar, ShoppingCart,
  Snowflake, Sparkle, Star, StarFour, Stethoscope, SuitcaseRolling, Sun, SunHorizon, Swatches, Sword,
  Syringe, Table, Tag, Target, Television, TestTube, Thermometer, ThermometerHot, ThumbsUp, Ticket,
  Timer, ToggleLeft, Tornado, Train, Translate, Tree, TreeEvergreen, TreePalm, TreeStructure, Trophy,
  Users, UsersFour, UsersThree, Virus, Wallet, Warning, WarningCircle, WarningOctagon, WaveSine,
  Waves, WifiHigh, Wrench, XCircle,
}

/**
 * Renders a Phosphor icon if a mapping exists for the word,
 * otherwise falls back to the emoji character.
 */
export default function WordIcon({ word, emoji, emojiClass = 'text-8xl', iconSize = 100, className = '' }: Props) {
  const iconName = getWordIcon(word)
  const IconComponent = iconName ? ICON_MAP[iconName] : undefined

  if (IconComponent) {
    return (
      <IconComponent
        size={iconSize}
        weight="duotone"
        className={className}
      />
    )
  }

  return (
    <span className={`${emojiClass} leading-none select-none ${className}`}>
      {emoji}
    </span>
  )
}
