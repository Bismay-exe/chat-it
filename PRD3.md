

Use this as your `UI-PRD.md`.

---

# CHAT-IT MOBILE — PHASE 2 UI SYSTEM PRD

## Objective

Transform the **validated functional app** into a **cohesive, premium mobile UI system** without breaking existing logic.

This phase focuses on:

* consistency
* usability
* performance-safe UI
* scalable design system

NOT feature expansion.

---

# CORE RULE

```text
Do NOT rewrite logic.
Do NOT rebuild architecture.
Do NOT break working flows.

Only replace UI layer incrementally.
```

---

# DESIGN PRINCIPLES

1. Mobile-first (no web patterns)
2. Minimal but expressive
3. Dark-first design
4. High readability (chat-first)
5. Smooth but not over-animated
6. Consistency > creativity
7. Performance-aware UI

---

# DESIGN STYLE DIRECTION

Tone:

* modern messaging app
* subtle glass / layered surfaces
* soft depth (not heavy blur everywhere)
* clean typography
* minimal clutter

Avoid:

* WhatsApp clone UI
* Material UI look
* Overuse of gradients
* Over-animation

---

# DESIGN TOKENS (DEFINE FIRST)

## Colors

```text
Background
Surface
SurfaceSecondary
Primary
PrimarySoft
TextPrimary
TextSecondary
TextMuted
Border
Error
Success
```

Rules:

* Dark theme first
* High contrast for chat readability
* Avoid pure black (#000) → use near-black

---

## Typography

Use custom font (already set up)

Define:

```text
Heading (large)
Subheading
Body
Caption
Small
Button
```

Rules:

* max 2–3 weights
* no random font sizes
* consistent hierarchy

---

## Spacing System

Use fixed scale:

```text
4 / 8 / 12 / 16 / 20 / 24 / 32
```

Rules:

* no arbitrary spacing
* align everything to scale

---

## Radius System

```text
Small (8)
Medium (12)
Large (16)
Pill (full)
```

---

# BASE UI COMPONENTS (BUILD FIRST)

Create reusable primitives:

## Core

```text
Text
Button
Input
Avatar
Card
Divider
Badge
IconButton
```

---

## Layout

```text
ScreenContainer
Section
Row
Column
Spacer
```

---

## Feedback

```text
Loader
EmptyState
ErrorState
```

---

# CHAT-SPECIFIC COMPONENTS

These define your app quality.

```text
ChatListItem
MessageBubble (incoming/outgoing)
MessageComposer
ChatHeader
TypingIndicator
UnreadBadge
```

Rules:

* must be reusable
* no inline styles inside screens
* no duplication

---

# NAVIGATION UI

## Floating Dock

Structure:

```text
Chats   +   Pulse
```

Requirements:

* floating pill
* safe area aware
* subtle shadow/elevation
* active state indicator

Do NOT:

* use default tab bar
* overload with more tabs

---

# SCREEN IMPLEMENTATION ORDER

## Phase 2.1 (CRITICAL)

Only build:

### 1. Chats Feed

### 2. Chat Thread

These must be polished first.

---

## Chats Feed Requirements

* clean list layout
* avatar + name + preview + timestamp
* unread badge
* subtle separators or cards
* smooth scroll (FlashList)

---

## Chat Thread Requirements

* clear message grouping
* proper spacing between messages
* distinct incoming vs outgoing
* readable timestamps
* composer fixed at bottom

---

## Phase 2.2

After chats:

```text
Chat Info
Profile
Settings
```

---

## Phase 2.3

Then:

```text
Pulse
Admin
```

Lowest priority.

---

# UI MIGRATION STRATEGY

Do NOT rewrite screens.

Do:

```text
Replace component → test → continue
```

Example:

* replace MessageBubble only
* test
* then replace ChatListItem

Incremental.

---

# ANIMATION GUIDELINES

Use:

* React Native Reanimated
* react-native-gesture-handler

Start with:

* press feedback
* small transitions
* list interactions

Avoid:

* heavy motion
* complex choreography

---

# PERFORMANCE RULES (UI PHASE)

* no unnecessary re-renders
* memoize heavy components
* avoid inline functions in lists
* use FlashList properly
* avoid deep component trees

If UI causes lag → rollback.

---

# THEMING (OPTIONAL LATER)

Do NOT implement full theming now.

Only:

* dark theme

Light mode later.

---

# ACCESSIBILITY (BASIC)

* readable font sizes
* touch targets >= 44px
* contrast sufficient

---

# DO NOT BUILD (YET)

```text
Advanced animations
Complex gradients
Glass everywhere
Pulse redesign
Labs
Discover
Voice features
```

---

# SUCCESS CRITERIA (PHASE 2)

You are done when:

```text
Chats feel smooth and premium
Chat thread is clean and readable
No UI lag
No visual inconsistency
Design system is reusable
```

NOT when “it looks cool.”

---

# FINAL PRINCIPLE

```text
System first
Components second
Screens third
```

Not the other way around.

---

# WHAT THIS PHASE IS REALLY ABOUT

Turning this:

```text
Working app
```

Into this:

```text
Working + cohesive + premium-feeling app
```

---

If you follow this properly, your app will feel like:

* a real product
  not
* a side project with fancy screens

---