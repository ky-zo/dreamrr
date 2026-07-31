# dreamrr

**A marketplace for dreams.** Every red dot on the globe is a dream someone recorded and is willing
to sell. Spin the globe, find one, buy it — or sell your own and watch what your subconscious clears
for on the open market.

Built for the hackathon on **[Lovart](https://lovart.ai)** (every image and video you see) and
**[CopilotKit](https://copilotkit.ai)** (the assistant that actually drives the app).

```bash
pnpm install
echo "OPENAI_API_KEY=sk-..." > .env.local
pnpm dev
```

## Try this first

Open the app and answer the assistant's one question — *creator or dreamer?*

- **"i'm a dreamer"** → ask for *"something calm, nothing scary"*. The assistant doesn't describe
  dreams back at you; it renders a swipeable deck of real listings in the chat, and whichever card
  is in front lights up on the globe.
- **"i'm a creator"** → ask *"how much did I make this month?"* or *"what's selling right now?"*.
  You get a ledger and a market ticker rendered in the chat, not a paragraph of numbers.

## Lovart — the entire visual identity

Every dream in the catalogue was art-directed on a Lovart canvas: a 1950s-style movie poster for the
dream, the stills that go with it, and a short video clip generated from the poster — *Escape the
Police with a Dragon*, *Touching Grass*, *Running Away from the VC*, *falling*.

![The Lovart canvas the dream posters, stills and clips were generated on](docs/lovart-canvas.png)

The joke only lands because the art is consistent. Prompting each dream as a period movie poster,
in one place, is what gave 24 unrelated dreams a single house style — and what let us go from poster
→ still → video without redrawing anything. Exports live in `public/dreams/`.

## CopilotKit — generative UI, not a chatbot

The assistant has no prose answers. Every question resolves to a React component rendered inside the
chat, sharing state with the page:

| Action | What it renders |
|---|---|
| `recommendDreams` | A deck of 1–4 dream cards; the front card drives the globe |
| `showEarningsDashboard` | The seller's ledger — gross, payout, months behind it |
| `showMarketTrends` | Live market: which dream categories are rising or crashing |

Wiring, all in `components/copilot-*.tsx`:

- `useCopilotReadable` puts the whole catalogue, the market and the user's earnings in context, so
  the model answers from real data rather than inventing listings.
- `useCopilotAction` with a `render` returns a component — the instructions say *always use the
  action instead of describing dreams in prose*, which is what makes it feel like an app.
- `useCopilotChatSuggestions` (`before-first-message`) makes the opening a two-button fork that
  disappears once taken.
- `CopilotRuntime` + `OpenAIAdapter` in `app/api/copilotkit/route.ts`.

## The globe

cobe renders to WebGL, so its built-in markers can't be hovered, focused, or given a tooltip.
`lib/globe-projection.ts` reimplements cobe's own projection in JS and the dots are real `<button>`
elements positioned over the canvas each frame — so the dot you see is the dot you hover, and the
whole map is keyboard-navigable. Transforms are written straight to the DOM from a
`requestAnimationFrame` loop; at 60fps React state would re-render the tree sixty times a second.

## What's real and what isn't

- **Real:** the catalogue, the globe, the assistant, every generated image and clip.
- **Mocked:** checkout. `app/api/checkout/route.ts` is a Stripe-styled stub — no money moves. Swap
  its body for a Checkout Session returning `{ url }` and nothing else changes.
- No database. `data/*.json` is the whole marketplace: 24 dreams, 12 sellers.

Next 16 · React 19 · Tailwind 4 · CopilotKit 1.64 · cobe.
