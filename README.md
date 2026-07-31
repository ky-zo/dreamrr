# dreamrr

A marketplace for dreams. Every red dot on the globe is one someone recorded and is willing to part with.

## Run it

```bash
pnpm install
echo "OPENAI_API_KEY=sk-..." > .env.local
pnpm dev
```

The AI sidebar **requires** `OPENAI_API_KEY`. Without it `/api/copilotkit` returns a 500 that says so —
there is no fallback, by design. The globe, the dream panel and buying all work without a key.

## Dropping in the real images

Both are wired up and degrade to a quiet paper placeholder until the files exist:

- `public/dreams/d-001.png` … `d-024.png` — the dream stills, roughly 4:3
- `public/people/p-01.png` … `p-12.png` — seller avatars, square

The paths live in `data/dreams.json` (`image`) and `data/people.json` (`avatar`). Change those
if you'd rather name the files something else.

## How it's put together

| | |
|---|---|
| `data/*.json` | The whole catalogue. 24 dreams, 12 sellers. No database. |
| `lib/globe-projection.ts` | cobe's projection maths, transcribed from its source and verified. |
| `components/globe/` | The globe, the dots, and the hover preview. |
| `components/dream-panel.tsx` | Selected dream: detail, seller profile, buy. |
| `components/copilot-dreams.tsx` | The one CopilotKit action — recommends 1–2 dreams as cards. |

### Why the dots aren't cobe markers

cobe draws to WebGL, so its markers can't be hovered, focused or given a tooltip. So we don't use
them: `lib/globe-projection.ts` reimplements cobe's own projection in JS, and the dots are real
`<button>` elements positioned over the canvas each frame. The dot you see and the dot you hover are
the same element, so they can't drift apart, and the whole thing is keyboard-navigable for free.

Those transforms are written directly to the DOM from a `requestAnimationFrame` loop rather than
through React state — at 60fps, state would re-render the tree sixty times a second.

## Buying

The Stripe-styled button runs a **mock** purchase against `app/api/checkout/route.ts`. No money moves
and no Stripe key is involved. To make it real, swap that route's body for a Stripe Checkout Session
and return `{ url }` to redirect to — nothing else needs to change.
