# Conference Awards Wheel — LED Backdrop

A full-screen live draw wheel for the ceremony's main LED wall, built from the supplied reference image (coloured segments, notched outer rim, hub and fixed pointer) and dressed in the conference artwork you just sent.

Confirmed for this build: **each winner is drawn at random from the companies still on the wheel**, and the ceremony starts on a **50-company sample roster with an editable roster and branding panel** so production can paste the real list later.

The wall is 2304 × 1280 (9:5), so the wheel is designed natively at that size — no scaling blur on stage. The supplied backgrounds are 16:9; each one fills the 9:5 wall with a minimal edge crop, which is invisible on this abstract artwork.

## The on-screen experience

- Before the first spin the wheel shows all 50 companies at once, evenly spaced, with a "Draw 1 of 15" counter and the event title.
- On **Start spin** the wheel accelerates, turns several full rotations, decelerates and settles so the winning segment sits exactly under the fixed pointer at the top — no snap, no landing between segments.
- The winning segment then stays lit while the rest of the wheel dims, and the company's full name appears in very large type beside it. The result stays until the operator advances.
- On **Advance** the winner is removed and the remaining companies are redistributed evenly around the same wheel before the next spin: 49, then 48 … down to 36 on the fifteenth spin.
- After the fifteenth reveal the final winner is removed too. The wheel closes with the 35 remaining companies, the counter reads complete, and spinning is disabled behind a clear "Draw complete" state.

## Branding from your artwork

- The charcoal background becomes the stage backdrop; the blue and teal versions are used for the winner reveal and the closing card. Exported from your master at the wall's native 2304 × 1280.
- Palette carried from the artwork: deep charcoal stage, conference blue, teal-green, cyan-blue and a light neutral. Segment colours cycle through that family so neighbouring companies always differ.
- Winning segment and reveal text sit on the light neutral with a soft brand-blue glow, so the name reads from the back of the room against the dark stage.
- Bold, wide-tracked display type for names and the draw counter; the exact brand typeface can be swapped once production confirms it.

## Operator controls

- **Start spin** — only available when the wheel is idle and draws remain; disabled while the wheel moves or a result is on screen.
- **Advance** — only available while a result is on screen; removes the winner and prepares the next spin.
- **Winners panel** — draw number, company name and time in reveal order, on the right of the wall and reviewable after the last draw. A single action copies the list for the production team, and the panel can be hidden for a wheel-only view.
- **Roster & branding panel** — paste the final company list (full name + short wheel name per line), set event title, colours and the LED wall pixel size, with warnings for blanks, duplicates or a list shorter than the number of draws. Changing the roster mid-draw is blocked; it applies on a reset.
- **Rehearsal reset** — clears all results and restores the full roster, behind a two-step confirmation so it cannot be triggered by a stray keypress during the show.
- A full-screen toggle and a discreet operator strip keep the wall clean while leaving both controls always reachable from the same machine.

## Reliability during the show

- Each winner is locked the moment a spin starts, so a company can never be drawn twice even if a save is still in flight.
- Results are recorded and reloaded from the project's backend, so a refresh, browser crash or reopening the wheel on another machine restores the same winners, remaining companies and draw number — including putting a result that was on screen back on screen.
- A small save-state indicator is always visible in the operator strip. If the backend cannot be reached, the draw continues uninterrupted, the state is held on the machine, and syncing retries automatically with the unsaved state clearly shown — the show is never blocked by the network and results are never silently lost.

## Readability

- Short approved names on the wheel, full company name on the reveal; long names shrink and wrap up to two lines instead of being clipped.
- Segment label size is driven by the segment count and the wall width, so a 50-segment wheel stays readable and a 36-segment wheel gains room rather than looking sparse.
- Final name legibility on the real wall remains your rehearsal check; once the wall's exact pixel size and typeface are confirmed I will retune sizes against it.

## Not included

Company logos on segments, audience voting or registration, video output routing, and a printed programme. The wheel runs on the operator's machine and is mirrored to the wall as a normal full-screen browser window.

## Build tasks

- [ ] Wheel renders all 50 companies before the first spin, evenly spaced, with a fixed pointer at the top.
- [ ] Start spin runs an accelerate–cruise–decelerate animation that lands the winning segment exactly under the pointer.
- [ ] Winner is highlighted while the rest dims, with the full company name shown large enough for the back of the room.
- [ ] Advance removes the winner, redistributes the remaining segments evenly and shows the next draw number (49, 48 … 36).
- [ ] After the fifteenth advance the wheel shows the final 35 companies and spinning is permanently disabled with a completed state.
- [ ] Start spin and Advance are mutually exclusive: spinning cannot restart while moving or while a result is displayed.
- [ ] Winners list is kept in reveal order and can be copied for the production team.
- [ ] Supplied charcoal, blue and teal artwork appears as the stage, reveal and closing backdrops, filling the 9:5 wall.
- [ ] Roster, branding and wall size can be edited with validation, and are blocked from changing mid-draw.
- [ ] Rehearsal reset restores the full roster only after explicit confirmation.
- [ ] Draw state survives refresh, crash and reopening elsewhere, with the on-screen result restored and no repeat winners.
- [ ] Save failures never interrupt the draw and are surfaced honestly in the operator strip.
- [ ] Layout fills the 9:5 LED wall at its native 2304 × 1280; every short name and reveal name stays legible.
