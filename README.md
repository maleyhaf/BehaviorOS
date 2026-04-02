# BehaviorOS

> A real-time decision game where an opponent system learns how you play and changes the rules accordingly.

## Concept

You are not just clicking shapes. You are being *adapted to*.

The system tracks your behavior (reaction time, risk appetite, patience) and modifies the game in response — faster decay, more decoys, traps for risk-takers. The rules are reactive to you.

## Architecture

```
src/
├── types/index.ts           — all TypeScript interfaces
├── engine/
│   ├── shapeEngine.ts       — spawn, update, hit-test shapes
│   ├── playerModel.ts       — infer behavioral traits from events
│   ├── adaptiveOpponent.ts  — rule engine that adjusts game params
│   └── reportGenerator.ts   — build end-screen session report
├── hooks/
│   └── useGameEngine.ts     — game loop, wires all engines together
└── components/
    ├── GameCanvas.tsx        — canvas renderer for shapes
    ├── BehaviorOSPanel.tsx   — live diagnostic overlay
    └── EndScreen.tsx         — session report screen
```

### The feedback loop

```
Player clicks → Event logger → Player model update
→ Adaptive opponent adjusts modifiers → Game state changes
→ New shape behavior → Player reacts again
```

## Getting started

```bash
npx create-react-app adaptive-system --template typescript
# or
npm create vite@latest adaptive-system -- --template react-ts

cd adaptive-system
# Copy src/ files over
npm run dev
```

## Behavior traits tracked

| Trait | High | Low |
|-------|------|-----|
| **Impulsivity** | Clicks fast/early | Waits before clicking |
| **Risk tolerance** | Chases large shapes | Prefers small safe clicks |
| **Patience** | Waits for optimal timing | Clicks at first opportunity |
| **Consistency** | Stable reaction times | Erratic pattern |

## Adaptation rules

| Trigger | System response |
|---------|----------------|
| High impulsivity | More decoy shapes |
| High patience | Shapes expire faster |
| High risk tolerance | Large shape traps |
| Low risk tolerance | Fewer high-reward opportunities |
| High consistency | Growth speed increases |
| Many clicks + low impulsivity | Higher spawn rate |

## Build phases

- **Phase 1** — Core game: shapes spawn, grow, expire, click to score ✅
- **Phase 2** — Event logger + player model live updates ✅
- **Phase 3** — Adaptive opponent rule engine ✅
- **Phase 4** — End screen + BehaviorOS diagnostic panel ✅
- **Phase 5** — Backend (Node/Express + PostgreSQL) for session persistence

## Optional upgrades

- Timeline graphs on end screen (Recharts or D3)
- Replay mode — visualize your session after the fact
- Heatmap of click positions
- Backend: server-controlled modifiers for "remote adaptive system" framing
