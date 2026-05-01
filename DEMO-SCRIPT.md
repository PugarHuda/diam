# Diam — Demo Video Storyboard (4 min)

> Visual + recording companion to **`brand/PITCH-SCRIPT.md`**.
> The pitch script owns the voice-over. This doc owns the screen.
> Target runtime: **3:40** (20s buffer, 4:00 hard cap per hackathon brief).
> Format: 7 slides via `/slides` deck + 1 live (or pre-recorded) demo segment.

---

## Pre-recording checklist

### Environment
- [ ] OBS Studio: 1920×1080, 30fps, MP4 H.264, ~8 Mbps
- [ ] Microphone 4–6 inches from mouth, no AC/fan noise
- [ ] System notifications **off** (Slack, Telegram, Discord, mail)
- [ ] Browser zoom 100%, Chrome incognito for clean URL bar
- [ ] Disable browser autofill / password popups

### Deck setup (`/slides`)
- [ ] Open `https://private-otc.vercel.app/slides?slide=1`
- [ ] Press **`F`** for fullscreen
- [ ] Press **`T`** to hide the timer (judges shouldn't see it)
- [ ] Press **`R`** to reset both timers right before recording starts
- [ ] Verify slide-numbered URL works as a fail-safe nav

### Live dApp setup (for Slide 5 demo segment)
- [ ] Wallet 1 (Maker): funded with 0.05 ETH on Arbitrum Sepolia, has cUSDC + cETH minted, **OperatorAuth banner already clicked for both tokens** (so the live demo doesn't need a 60-day approval mid-recording)
- [ ] Wallet 2 (Taker): same — funded, balances minted, both operators authorized
- [ ] Tabs to keep ready in another window:
  - `https://private-otc.vercel.app/intents` — paginated orderbook (stays warm in cache)
  - `https://sepolia.arbiscan.io/address/0xBD27DABa875aF238Fc7f2848B23904c99Ae5A563` — PrivateOTC for "verified on-chain" cutaway
  - `https://sepolia.arbiscan.io/address/0xE011E57ff89a9b1450551A7cE402b75c5Bd27B85` — DiamReceipt
- [ ] **Pre-record a 25–30s demo clip** as fallback if live demo risks (network flake, MetaMask popup race) — drop into OBS as a scene cut

### Sanity
- [ ] Read pitch script through 3× before first take
- [ ] Pre-stage Wallet 1 on `/create/rfq` form with values pre-filled, ready to click submit on cue
- [ ] Record 3+ takes minimum — voice warms up by take 3
- [ ] On final take, slightly **over-articulate**; recording flattens delivery

---

## Slide-by-slide visual storyboard

> Voice-over text is in **`brand/PITCH-SCRIPT.md`** — read from there.
> This column is **what's on screen** at each timestamp.

### Slide 1 — TITLE  · `0:00 → 0:15` · 15s
- **Visual:** Diam title card. Dark bg, matrix-green accents, tagline "Your trade. Their guess. Nobody knows." displayed (do NOT read aloud).
- **Action:** 3-second silent hold on logo before first word. Then `→`.
- **Recording tip:** This is your "voice warm-up" frame — don't rush.

### Slide 2 — PROBLEM  · `0:15 → 0:55` · 40s
- **Visual:** Four EXPOSED red boxes (order size · side · counterparty · price). 95% stat lands big.
- **Action:** Eyes track the four boxes as you name each field. Pause on "fifty-million-dollar". Slow tempo on **95%**.
- **Recording tip:** Don't enumerate "Telegram, Genesis, Cumberland, FalconX" if running over budget — cut it.

### Slide 3 — SOLUTION  · `0:55 → 1:40` · 45s
- **Visual:** Maker → handle → Contract → handle → Taker flow diagram. Three pillars: TEE encryption / sealed-bid Vickrey / atomic settlement.
- **Action:** Trace the flow with cursor. Slow on "Nobody — not even the chain — sees the size."
- **Recording tip:** This is a 45s slide — take your time. Don't rush the pillar names.

### Slide 4 — STACK  · `1:40 → 1:55` · 15s
- **Visual:** Architecture: 4 packages (contracts / web / agents / mcp-server). Arbitrum Sepolia badge.
- **Action:** Quick pace — breadth, not depth. This is a transition slide into the demo.
- **Recording tip:** If at 2:00 already, you're 5s over — start cutting.

### Slide 5 — DEMO  · `1:55 → 2:55` · 60s · **THE WOW MOMENT**

This slide cuts away from the deck to live (or pre-recorded) dApp footage. Allocate **25–30s** to actual screen recording, the rest to voice.

**Demo segment shot list:**

| t | Visual | Voice cue |
|---|---|---|
| 0–4s | Open `/intents` — paginated orderbook with status filter row (Open / Filled / Cancelled / Pending). Click filter `status=open`. URL flips to `?status=open`. | "Live on Arbitrum Sepolia." |
| 4–7s | Open `/portfolio`. Click DECRYPT on cUSDC. Plaintext value reveals after a wallet signature. | "Balance is encrypted — I decrypt it locally with my wallet signature." |
| 7–14s | Cut to maker browser — `/create/rfq` form already pre-filled (cETH 50, cUSDC pair, 1H window). Click OPEN AUCTION. MetaMask popup, confirm. | "I post an RFQ. Encrypted via Nox in a TEE before it ever leaves the browser." |
| 14–22s | Cut to taker browser — `/rfq/[id]` page. Click SUBMIT SEALED BID, type bid, confirm in MetaMask. Repeat for second taker (or use bid that's already on-chain). | "Takers see the asset pair, not the size. They bid blind." |
| 22–28s | Back to maker — click COMPUTE SECOND-PRICE (`finalizeRFQ`), then DECRYPT BIDS, then PICK AS WINNER on the highest one. Vickrey reveal animation plays. | "Maker reveals — the contract returns only the winner address and the second-price clearing. Losing bids stay sealed forever." |
| 28–30s | Cutaway to Arbiscan tab: `Settled` event with `bytes32` amount. Highlight the handle. | (silence — let the Arbiscan tab speak) |

**Recording tips:**
- This is THE wow moment. If only one slide goes great, make it this one.
- **Strongly prefer pre-recorded** demo segment — live demo failure during recording is recoverable but eats takes.
- If timer goes amber at 0:48 (i.e. 12s left in slide budget), wrap demo voice-over fast.

### Slide 6 — CRAFT  · `2:55 → 3:30` · 35s · **ENGINEERING CREDIBILITY**
- **Visual:** Vickrey bug story slide. Display `[100, 300, 200]` bid array, then "Wrong" → "200" correction. Stat card: "100% logic coverage · 30+ Foundry tests · 0 Slither high/med · 1 dev / 5 days / 4 packages / Claude Code Opus 4.7".
- **Action:** Read the bid array clearly: "one-hundred, three-hundred, two-hundred". Pause on "Wrong." Land "**Without that mirror, that bug ships.**"
- **Recording tip:** This is the differentiator that separates demo-grade from production-grade. Don't apologize for using AI — it's a *Vibe Coding* challenge.

### Slide 7 — FIN  · `3:30 → 3:40` · 10s + Q&A hold
- **Visual:** Final card. "Diam." centered. Tagline below in three lines. URLs at bottom.
- **Action:** Tagline cadence is the close. Three deliberate beats: "Diam. *[beat]* Your trade. *[beat]* Their guess. *[beat]* Nobody knows."
- **Recording tip:** Hold this slide indefinitely for Q&A.

---

## Visual transitions

- **Cuts, not fades.** Hard cuts between slides — no music swells, no dissolves. This is institutional, not crypto-bro.
- **One cut into demo, one cut out.** Don't cut around inside the demo segment — keep continuous screen recording flow so judges follow the user journey.
- **Cursor visible.** Make sure system cursor is showing in OBS recording (some setups hide it for clean screenshots).

## Audio

- **Mono, 48kHz, –12 LUFS target.** Boost in post if needed.
- **No background music.** Voice carries. If you must, *very* quiet ambient pad (-30dB) under voice — never under demo segment narration.
- **De-ess + light compression** in post — voice should sit forward in the mix without harsh sibilance.

---

## Bonus: 60-second engineering credibility cut (for X post / longer technical demo)

> Standalone clip if the 4-min full pitch is too much for a tweet attachment.
> Strongest signal for technical judges — leads with the Vickrey bug.

| t | Visual | Voice |
|---|---|---|
| 0–12s | Terminal: `forge test --match-contract VickreyAlgorithm`. Highlight `testFuzz_pickTopTwo_uniqueBidsYieldStrictSecondMax` running 256 iterations — all green. | "I built a parallel Solidity mirror of the Vickrey algorithm and fuzzed both implementations against random bid sets." |
| 12–22s | `git log` → highlight the Vickrey bug fix commit. Diff: 3 lines changed in `_computeSecondPrice`. | "The mirror failed — proving the bug was in my algorithm, not the encryption layer." |
| 22–35s | Open `CHANGELOG.md` to the bug-fix entry. Highlight: bid `[100, 300, 200]` charged `100` instead of `200`. | "Fix is three lines. A nested `Nox.select` to handle bids landing between current highest and second." |
| 35–48s | GitHub Actions tab — green CI badge, all 4 jobs passing. | "215 web tests, 30 Foundry tests, 100% logic coverage." |
| 48–60s | Back to Diam landing page, then `/slides` deck slide 7. | "Diam. Your trade. Their guess. Nobody knows." |

---

## Post-recording checklist

- [ ] Export 1080p MP4 (H.264), target < 50 MB
- [ ] Test playback on mobile (judges might watch on phone)
- [ ] Trim leading/trailing dead air to ~0.5s
- [ ] Verify no MetaMask popup or notification leaked into frame
- [ ] Verify CHAINGPT_API_KEY / PRIVATE_KEY env values not visible
- [ ] Upload unlisted to YouTube (preferred) or Vimeo
- [ ] Drop URL into `X-POST.md` Tweet 1 placeholder
- [ ] Generate 30-second highlight clip (best moment from Slide 5 demo) for X attachment

---

## Cross-references

- **`brand/PITCH-SCRIPT.md`** — voice-over for every slide + Q&A prep + 60s elevator + 30s hook + 10s sound bite
- **`brand/PITCH-DECK-INSPIRATION.md`** (if exists) — design rationale for slides
- **`USAGE.md`** — feature-by-feature walkthrough used as reference for demo segment shot list
- **`CHANGELOG.md`** — engineering credibility narrative (Vickrey bug, OperatorAuth shipping, DiamReceipt)
