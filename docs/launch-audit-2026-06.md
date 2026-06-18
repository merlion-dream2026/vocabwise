# VocabWise — Launch Readiness Audit (June 2026)

## Feature Inventory

| Section | Status | Scale |
|---|---|---|
| VocabWise Kids | ✅ Live | 6 levels × 30 topics = 180 topics, 2,300+ words |
| VocabWise Academic | ✅ Live (Books 1–2 full, Book 3 partial) | 120/180 topics seeded |
| Phonics module | ✅ Live | 31 lessons |
| Games (Kids) | ✅ Live | 21 game types |
| Exercises (Academic) | ✅ Live | E1–E8 exercise types |
| Pronunciation scoring | ✅ Live | Groq Whisper + Soundex |
| SRS / weak word tracking | ✅ Live | Full spaced repetition |
| Gamification | ✅ Live | XP, badges, streaks, confetti |
| Auth (full flow) | ✅ Live | Register → OTP → Login → Reset |
| Multi-child & PIN | ✅ Live | Up to 3 kids, parental lock |
| Referral system | ✅ Live | 2-tier (signup + paid) |
| Email system | ✅ Live | 11 template types |
| Push notifications | ✅ Live | 6 automated cron jobs |
| Superadmin console | ✅ Live | Full analytics, finance, fraud detection |
| PWA | ✅ Live | Installable, offline service worker |
| Payment | ⚠️ Manual | Bank transfer → admin activation |
| Battle/PvP | ❌ Not built | DB schema only |
| Book 3 (C1–C2) | ✅ Live | 60/60 topics seeded |

---

## Launch Readiness Score: 7.2 / 10

| Dimension | Score | Notes |
|---|---|---|
| Content depth | 9/10 | 180 Kids topics, 120 Academic topics, 31 phonics — excellent breadth |
| Technical stability | 7/10 | Core flows work; no automated tests; relies on manual QA |
| UX / onboarding | 6/10 | Functional but no guided first-session flow, no in-app tutorial |
| Business model | 6/10 | Manual payment is a real bottleneck for scale; no online checkout |
| Growth mechanics | 7/10 | Referral, streaks, email campaigns present; no social sharing |
| Mobile experience | 7/10 | PWA works but no native app; no App Store/Play Store presence |
| Analytics & retention | 7/10 | Backend analytics solid; no in-app engagement insights for users |
| Accessibility | 5/10 | No screen reader support, no font size controls |
| Security | 8/10 | Rate limiting, JWT, audit logging, fraud detection — solid foundation |
| Competition readiness | 6/10 | Missing social features, offline learning, adaptive difficulty |

---

## Competitive Comparison

### Benchmark Apps

| App | Strength | Weakness |
|---|---|---|
| Duolingo | Gamification king, streak cult, AI-adaptive | Shallow grammar, low IELTS-specific content |
| Quizlet | Best flashcard UX, social study sets | No curated curriculum, no speaking |
| Memrise | Native speaker video, spaced repetition | Expensive, no academic writing skills |
| Vocabulary.com | Adaptive difficulty, rich context | English UI only, no bilingual |
| Magoosh IELTS | Solid IELTS prep, structured lessons | No speaking AI, pricey |
| British Council IELTS | Authoritative brand | Dated UX, no gamification |
| Anki | Best SRS implementation | Steep learning curve, no curated content |

### Where VocabWise Wins
- Bilingual Vietnamese UI — unique in this competitive set
- Academic vocabulary depth — 3 CEFR-mapped books with reading + exercises
- Pronunciation AI — real Whisper transcription (Duolingo uses simpler scoring)
- All-in-one: Kids + Academic + Phonics in one account
- Price point — 59K/month vs. competitors charging 200K+

### Where VocabWise Lags
- No adaptive difficulty (same content for all users at same level)
- No community/social features (leaderboards, study groups)
- No offline mode for Academic content (Kids only partially offline)
- No gamified daily missions or quest system
- No progress certificates or printable achievements
- No onboarding quiz to auto-place users in the right level/book
- Manual-only payment (every competitor has automated checkout)

---

## Improvement Suggestions

### Priority Matrix

| # | Improvement | Importance | Impact | Effort | Category |
|---|---|---|---|---|---|
| 1 | Automated payment (MoMo/VNPAY/Stripe) | 🔴 Critical | 🔴 High | 🟡 Medium | Business |
| 2 | Onboarding flow — placement quiz + guided first session | 🔴 Critical | 🔴 High | 🟡 Medium | UX |
| 3 | ~~Complete Book 3~~ ✅ All 60 topics complete | — | — | — | — |
| 4 | In-app upgrade checkout (no bank transfer required) | 🔴 Critical | 🔴 High | 🟡 Medium | Business |
| 5 | Daily missions / quest system | 🟠 High | 🔴 High | 🟡 Medium | Retention |
| 6 | Level placement test for Academic | 🟠 High | 🔴 High | 🟢 Low | UX |
| 7 | Offline mode for Academic content | 🟠 High | 🟡 Medium | 🔴 High | Technical |
| 8 | Social sharing (share score, streak) | 🟠 High | 🟡 Medium | 🟢 Low | Growth |
| 9 | In-app progress certificate / badge sharing | 🟡 Medium | 🟡 Medium | 🟢 Low | Motivation |
| 10 | Leaderboard (family or class rankings) | 🟡 Medium | 🟡 Medium | 🟡 Medium | Social |
| 11 | Adaptive difficulty (harder words surface more) | 🟡 Medium | 🔴 High | 🔴 High | Learning |
| 12 | Teacher/class mode (assign topics to students) | 🟡 Medium | 🔴 High | 🔴 High | B2B |
| 13 | Native app (React Native or Capacitor wrapper) | 🟡 Medium | 🟡 Medium | 🔴 High | Platform |
| 14 | AI word explanation chatbot (ask about a word) | 🟡 Medium | 🟡 Medium | 🟡 Medium | AI |
| 15 | Font size / accessibility controls | 🟡 Medium | 🟢 Low | 🟢 Low | A11y |
| 16 | Parent weekly email with specific weak word list | 🟢 Low | 🟡 Medium | 🟢 Low | Retention |
| 17 | Export vocabulary list to Anki (flashcard import) | 🟢 Low | 🟢 Low | 🟢 Low | Power users |
| 18 | Dark mode | 🟢 Low | 🟢 Low | 🟢 Low | UX |

### Top 5 Quick Wins (Low Effort, High Value)

1. **Level placement quiz** — 10-question self-assessment that auto-suggests which book/level to start. Prevents wrong-level frustration.
2. **Social share card** — "I just finished Topic X with 100% score!" — auto-generated card for Zalo/Facebook. Zero backend work.
3. **Progress certificate PDF** — Generate a simple A4 certificate when a book/level is completed. Shareable by parents.
4. **Progress certificate PDF** — Generate a simple A4 certificate when a book/level is completed. Shareable by parents.
5. **Social share card** — Auto-generated result card for Zalo/Facebook after completing a topic.

---

## Launch Blocker Assessment

| Blocker | Risk | Recommended Action |
|---|---|---|
| Manual payment only | 🔴 HIGH — kills conversion at scale | Integrate MoMo/ZaloPay before public launch |
| No automated tests | 🟠 MEDIUM — regressions possible | Add E2E tests for auth + payment flow |
| Book 3 incomplete | ✅ Resolved — all 60 topics complete | — |
| No App Store presence | 🟠 MEDIUM — parents expect native apps | Publish PWA to Play Store via TWA |
| No onboarding tutorial | 🟠 MEDIUM — drop-off in first session | Add 3-step guided first session |

---

## Verdict

VocabWise is genuinely launch-ready for a **soft launch / beta** with an existing student base. The content quality, feature completeness, and backend infrastructure are well above average for a solo-built ed-tech product. The two gaps that must close before a **public marketing push** are: **(1) automated payment** to remove the manual bottleneck, and **(2) onboarding flow** to reduce first-session drop-off.

---

*Audit date: 2026-06-15*
