# Schedule Card — change request for Claude

## What I want
Change the **ScheduleCard** on the Agenda (Emploi du temps) timeline so the **time no longer lives in the left gutter**. Move it **inside the card**, into a bottom meta row, next to the status pill. This is the "Option 4" layout.

### Why
On narrow phones — and worse with the OS large-text accessibility setting on — the fixed **52px gutter** can't hold the time, so `08:00` clips to `08:…`. The gutter has a fixed width but its text can grow with the system font, so it will always be the failure point. Putting the time inside the flexible card fixes this permanently.

---

## The new card layout (Option 4)
Remove the left **gutter** entirely. Keep the **connector** (the dot + vertical line spine) — that stays to the left of the card. Inside the card, top to bottom:

```
TimelineRow
├─ Connector (24 wide)   dot 12 + 2px line   ← KEEP
└─ ScheduleCard (flex:1)
    ├─ 5px colour rail (absolute, inset-inline-start:0)   ← KEEP
    └─ Body (padding 14 / 16 / 14 / 18)
        ├─ Title            ← now the FIRST element, full width
        ├─ Prof · Room      (sub line)
        └─ Meta row         flex · align center · gap 8 · marginTop 11
            ├─ Time pill     mono "13:00 – 14:30"   surface2 bg, radius full, pad 5/12
            └─ Status pill   "En cours" / "À venir" / "Terminé"
```

So the **full time range** ("13:00 – 14:30") shows as a mono pill at the bottom-left, and the status pill sits right after it.

### The rules that actually kill the truncation bug
In the meta row, these flex rules are the whole point — please apply exactly:

```jsx
// Title (above the meta row) — this is the ONLY thing allowed to shrink/truncate
<Text numberOfLines={2} style={{ flexShrink: 1 }}>{title}</Text>

// Meta row
<View style={{ flexDirection:'row', alignItems:'center', gap:8, marginTop:11 }}>
  <View style={{ flexShrink:0 }}>            {/* time pill NEVER shrinks */}
    <Text numberOfLines={1} style={{ fontFamily:'DM Mono', fontSize:13, fontWeight:'600' }}>
      {start} – {end}
    </Text>
  </View>
  <View style={{ flexShrink:0 }}>            {/* status pill NEVER shrinks */}
    <Text numberOfLines={1}>{statusLabel}</Text>
  </View>
</View>
```

`flexShrink:0` on the time + status pills, `flexShrink:1` + `numberOfLines={2}` on the title. The title wraps to 2 lines or ellipsizes; the time is always whole.

### Cleanups that come with removing the gutter
- Delete the gutter View and its width (was 52). The row is now just `[Connector 24][Card flex:1]`.
- The start-time that used to render in the gutter is **gone** — it's replaced by the full range pill inside the card, so no duplicate time.
- Keep the connector dot top-aligned with the card's top (dot `top ≈ 16`, matching card paddingTop 14 + a hair).

---

## Keep the live "ongoing class" animation
When `now` is between the course start and end (`status === 'live'`), the card shows it's happening right now. Two parts:

**1. Connector dot — pulsing ring.** The 12px dot is jade (`#1D9E75`). Add a ring that scales out and fades, looping. In RN use `Animated`/Reanimated:
- A jade ring (2px border, same centre as the dot) animates `scale: 0.85 → 2.0` and `opacity: 0.85 → 0`, duration ~1.9s, easing ease-out, `loop`.
- Keep a static 2px jade ring behind it so the dot reads as "haloed" even between pulses.

**2. Status pill — "En cours" with a blinking dot.** The live status pill (jade-faint bg `rgba(29,158,117,0.14)`, text `#0F6E56`) gets a small 6px jade dot before the label that blinks: `opacity 1 → 0.25 → 1`, ~1.6s, ease-in-out, `loop`.

Respect reduced-motion: if the user has reduce-motion on, drop both animations and just show the static haloed dot + solid "En cours" dot.

---

## Don't change
- Card radius (16–18 / rTile), shadow, the 5px colour rail, course-colour palette.
- The pinned header (title, week nav, day strip, day subtitle) and the gap rows ("Pause de …").
- Type sizes: title 15.5/700, prof·room 14/500, time pill DM Mono 13/600, status 11/700.
- Past classes still render muted (flat surface, hollow dot, "Terminé").

## Acceptance check
On a 320px-wide device with the system font at 130%, the time must read in full ("13:00 – 14:30"), with the **course title** being the only thing that wraps or ellipsizes. The live class must show the pulsing ring + blinking "En cours" dot.
