# CHAT-IT MOBILE (EXPO) PRD
Phase 1 Foundation Architecture PRD

Project:
Create a new mobile client in this project:

Recommended root folder:
chat-it/chat-it-mobile/

-----------------------------------
PROJECT OBJECTIVE
-----------------------------------

Build a new mobile client using:

- Expo React Native
- TypeScript
- Expo Router
- NativeWind
- Supabase (existing backend)
- Zustand
- TanStack React Query
- FlashList
- React Native Reanimated
- React Native Gesture Handler
- Firebase Cloud Messaging prep
- Expo Notifications prep

Important:

This is NOT a code conversion.

This is a frontend re-architecture using my React/Vite app as product reference.

Keep backend unchanged.

Reuse business logic where appropriate.

Rewrite UI and mobile architecture properly.

-----------------------------------
PHASE 1 GOAL
-----------------------------------

Do NOT build final polished UI first.

Build architecture + working screen skeletons.

Validate:

- Auth
- Navigation
- Realtime chats
- Performance
- Native structure
- State architecture
- Deep-link readiness

Minimal placeholder UI is expected.

Focus:
Function over beauty.

-----------------------------------
TECH STACK
-----------------------------------

Use:

npx create-expo-app@latest chat-it-mobile -t blank-typescript

Core stack:

Expo
Expo Router
TypeScript
NativeWind
Zustand
TanStack React Query
FlashList
Reanimated
Gesture Handler
Supabase

Recommended installs:

npm install nativewind zustand @tanstack/react-query @shopify/flash-list

npx expo install react-native-reanimated react-native-safe-area-context react-native-screens react-native-gesture-handler

Architecture must be mobile-native.

Never use:
- WebView
- Web wrappers
- web routing mentality

-----------------------------------
PERFORMANCE RULES
-----------------------------------

Prioritize:

- Fast startup
- Smooth chat scrolling
- Minimal re-renders
- Low memory usage
- Efficient realtime subscriptions
- Virtualized chat rendering
- Pagination
- Optimistic updates

Prefer better architecture over copying old patterns.

-----------------------------------
PHASE 1 SUCCESS CRITERIA
-----------------------------------

Must verify:

Auth works
Session persists
Chats load fast
Realtime messaging works
Navigation stable
Deep linking path exists
Performance acceptable
Architecture scalable

Only then start UI polish.

-----------------------------------
EXPO ROUTER STRUCTURE
-----------------------------------

app/
├── _layout.tsx
├── index.tsx
│
├── (auth)/
│   ├── _layout.tsx
│   ├── welcome.tsx
│   ├── login.tsx
│   ├── otp.tsx
│   └── setup-profile.tsx
│
├── (tabs)/
│   ├── _layout.tsx
│   │
│   ├── chats/
│   │   ├── index.tsx
│   │   ├── [chatId].tsx
│   │   ├── info.tsx
│   │   ├── media.tsx
│   │   ├── search.tsx
│   │   └── archived.tsx
│   │
│   ├── compose/
│   │   ├── index.tsx
│   │   ├── new-chat.tsx
│   │   └── new-group.tsx
│   │
│   ├── pulse/
│   │   └── index.tsx
│   │
│   └── settings/
│       ├── index.tsx
│       ├── account.tsx
│       ├── privacy.tsx
│       └── appearance.tsx
│
├── profile/
│   ├── index.tsx
│   └── [userId].tsx
│
├── admin/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── users.tsx
│   ├── reports.tsx
│   └── settings.tsx

-----------------------------------
FLOATING DOCK (KEEP)
-----------------------------------

Navigation concept:

Chats    +    Pulse

Custom floating dock lives in:

app/(tabs)/_layout.tsx

Use simple placeholder dock initially.

Do not overdesign now.

-----------------------------------
FEATURE MODULE STRUCTURE
-----------------------------------

Outside app:

features/
├── auth/
├── chat/
├── profile/
├── pulse/
└── admin/

components/
hooks/
services/
store/
lib/
types/

Chat feature:

features/chat/
├── components/
├── hooks/
├── api/
├── store/
└── types/

Feature-based architecture.

No component soup.

-----------------------------------
MAP EXISTING APP TO NEW APP
-----------------------------------

LandingPage -> welcome
AuthPage -> login

ChatsPage -> chats/index
ChatScreen -> chats/[chatId]

GroupInfoPage -> chats/info
GroupMediaPage -> chats/media
SearchPage -> chats/search

AddContactPage -> compose/new-chat
NewGroupPage -> compose/new-group

OwnProfilePage -> profile/index
UserProfilePage -> profile/[userId]

SettingsPage -> settings/index

Admin pages -> admin stack

Reuse architecture.

Do not blindly port code.

-----------------------------------
BUILD ORDER
-----------------------------------

Sprint 1
- project setup
- navigation
- auth
- session persistence

Sprint 2
- chats feed
- chat thread
- realtime
- message sending

Sprint 3
- chat info
- search
- archive
- new chat

Sprint 4
- profile
- settings
- pulse placeholder
- admin placeholder

Sprint 5
Optimization audit

Only then move to UI polish.

-----------------------------------
FIRST FILES TO CREATE
-----------------------------------

Only create these first:

welcome
login
chats/index
chats/[chatId]
settings/index
profile/index
compose/new-chat
layout files

Stop there.

Validate architecture.

Then continue.

-----------------------------------
PLACEHOLDER UI RULE
-----------------------------------

Every screen initially includes:

- screen title
- back button
- basic data render
- loading state
- error state
- simple test actions

No fancy UI.

Ugly but correct > pretty broken.

-----------------------------------
DO NOT BUILD YET
-----------------------------------

Postpone:

- premium visuals
- glassmorphism
- complex animations
- advanced pulse
- labs
- discover
- voice rooms
- calls
- advanced admin
- futuristic compose interactions

Later.

-----------------------------------
DO NOT MOVE TO PHASE 2 UNTIL
-----------------------------------

All true:

Auth stable
Chat stable
Realtime stable
Navigation stable
Performance acceptable
No architecture regrets

Then begin premium UI phase.

-----------------------------------
GUIDING PRINCIPLE
-----------------------------------

Make it work.

Make it fast.

Make it scalable.

Then make it beautiful.

In that order.

---

## My repo structure would be:

```text
chat-it/          # current web app
chat-it/chat-it-mobile/   # new Expo app
```

Perfect.

Monorepo-ish without complexity.

---