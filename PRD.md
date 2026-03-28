# PRD — Chat-It Web App

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Supabase Schema](#4-supabase-schema)
5. [Authentication](#5-authentication)
6. [Pages & Routes](#6-pages--routes)
   - 6.1 [Landing Page `/`](#61-landing-page-)
   - 6.2 [Auth Page `/auth`](#62-auth-page-auth)
   - 6.3 [Chats Page `/chats`](#63-chats-page-chats)
   - 6.4 [Chat Screen `/chats/:id`](#64-chat-screen-chatsid)
   - 6.5 [Search Page `/search`](#65-search-page-search)
   - 6.6 [Add Contact Page `/add`](#66-add-contact-page-add)
   - 6.7 [New Group Page `/add/new-group`](#67-new-group-page-addnew-group)
   - 6.8 [Group Info Page `/chats/:id/info`](#68-group-info-page-chatsidinfo)
   - 6.9 [Group Media Page `/chats/:id/media`](#69-group-media-page-chatsidmedia)
   - 6.10 [User Profile Page `/profile/:id`](#610-user-profile-page-profileid)
   - 6.11 [Own Profile Page `/profile`](#611-own-profile-page-profile)
   - 6.12 [Settings Page `/settings`](#612-settings-page-settings)
   - 6.13 [Account Page `/account`](#613-account-page-account)
   - 6.14 [Lists Page `/chats/lists`](#614-lists-page-chatslists)
   - 6.15 [Archived Page `/archived`](#615-archived-page-archived)
   - 6.16 [Archived Settings Page `/archived/settings`](#616-archived-settings-page-archivedsettings)
   - 6.17 [Announcements Page `/announcements`](#617-announcements-page-announcements)
   - 6.18 [Announcements Settings Page `/announcements/settings`](#618-announcements-settings-page-announcementssettings)
   - 6.19 [Invite Friend Page `/invite`](#619-invite-friend-page-invite)
7. [Component Library](#7-component-library)
8. [Real-time Features](#8-real-time-features)
9. [Mobile Layout & Navigation](#9-mobile-layout--navigation)
10. [Row-Level Security Policies](#10-row-level-security-policies)
11. [File & Media Storage](#11-file--media-storage)
12. [Notifications](#12-notifications)
13. [Group Permissions Model](#13-group-permissions-model)
14. [Non-Functional Requirements](#14-non-functional-requirements)
15. [Future Features (Deferred)](#15-future-features-deferred)
16. [Directory Structure](#16-directory-structure)

---

## 1. Project Overview

**App Name:** Chat-It  
**Tagline:** Simple, real-time, organised chat.  
**Goal:** A full-featured real-time messaging web app supporting 1-on-1 and group conversations, custom lists, announcements, archiving, and group media browsing — built as a mobile-first, responsive PWA.

### Core User Flows

| Flow | Description |
|------|-------------|
| Sign Up / Log In | Email + password auth via Supabase |
| Find & Add Contacts | Search platform users or public groups |
| Chat 1-on-1 | Real-time DM, media, theme |
| Group Chat | Create group, manage permissions, announcements |
| Organise Chats | Lists (Unread, Favourite, Groups, custom) |
| Announcements | Time-boxed group announcements |
| Settings | Profile, account, lists, archive |

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 19 + Vite (latest) |
| Language | TypeScript 5.x (strict mode) |
| Styling | Tailwind CSS v4.2.2 |
| Backend / DB / Auth | Supabase (via MCP) |
| Real-time | Supabase Realtime (Postgres Changes + Presence) |
| Storage | Supabase Storage |
| State Management | Zustand |
| Routing | React Router v7 |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Date/Time | date-fns |
| Image Upload | react-dropzone |
| Notifications | Sonner (toast library) |

### Vite Config Notes

- Use `@vitejs/plugin-react` (SWC)
- Path alias: `@/` → `src/`
- Environment variables via `.env.local` — `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

---

## 3. Architecture Overview

```
src/
├── main.tsx                  # Entry point
├── App.tsx                   # Router + global providers
├── lib/
│   ├── supabase.ts           # Supabase client init
│   └── utils.ts              # Helper utilities
├── hooks/                    # Custom React hooks
├── stores/                   # Zustand stores
├── components/               # Reusable UI components
├── pages/                    # Route-level page components
├── types/                    # Global TypeScript types
└── assets/                   # Static assets
```

### Global Providers (in `App.tsx`)

Wrap the entire app with:

1. `AuthProvider` — listens to `supabase.auth.onAuthStateChange`, exposes `useAuth()`
2. `ThemeProvider` — manages per-chat theme overrides
3. `Toaster` — Sonner toast container

### Protected Routes

All routes except `/` and `/auth` must require an authenticated session. Redirect unauthenticated users to `/auth`. Redirect authenticated users away from `/auth` to `/chats`.

---

## 4. Supabase Schema

### Table: `profiles`

```sql
id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
username     text UNIQUE NOT NULL
full_name    text NOT NULL
avatar_url   text
about        text DEFAULT ''
social_links jsonb DEFAULT '[]'   -- array of { platform, url }
created_at   timestamptz DEFAULT now()
updated_at   timestamptz DEFAULT now()
```

### Table: `chats`

```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
type         text NOT NULL CHECK (type IN ('direct', 'group'))
created_at   timestamptz DEFAULT now()
created_by   uuid REFERENCES profiles(id)
```

### Table: `group_info`

One row per group chat.

```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
chat_id       uuid REFERENCES chats(id) ON DELETE CASCADE UNIQUE
name          text NOT NULL
avatar_url    text
about         text DEFAULT ''
is_public     boolean DEFAULT false
created_at    timestamptz DEFAULT now()
updated_at    timestamptz DEFAULT now()
```

### Table: `group_permissions`

One row per group chat. Stores which default member actions are enabled.

```sql
id                        uuid PRIMARY KEY DEFAULT gen_random_uuid()
chat_id                   uuid REFERENCES chats(id) ON DELETE CASCADE UNIQUE
can_edit_group_settings   boolean DEFAULT false
can_send_messages         boolean DEFAULT true
can_add_members           boolean DEFAULT true
can_invite_via_link       boolean DEFAULT true
require_admin_approval    boolean DEFAULT false
```

### Table: `chat_members`

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
chat_id     uuid REFERENCES chats(id) ON DELETE CASCADE
user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE
role        text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member'))
joined_at   timestamptz DEFAULT now()
is_muted    boolean DEFAULT false
UNIQUE(chat_id, user_id)
```

### Table: `messages`

```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
chat_id      uuid REFERENCES chats(id) ON DELETE CASCADE
sender_id    uuid REFERENCES profiles(id)
content      text
type         text NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'file', 'audio', 'announcement'))
media_url    text
file_name    text
reply_to_id  uuid REFERENCES messages(id)
is_deleted   boolean DEFAULT false
created_at   timestamptz DEFAULT now()
updated_at   timestamptz DEFAULT now()
```

### Table: `message_reads`

Tracks per-user read status.

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
message_id  uuid REFERENCES messages(id) ON DELETE CASCADE
user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE
read_at     timestamptz DEFAULT now()
UNIQUE(message_id, user_id)
```

### Table: `announcements`

```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
chat_id      uuid REFERENCES chats(id) ON DELETE CASCADE
created_by   uuid REFERENCES profiles(id)
title        text NOT NULL
body         text NOT NULL
expires_at   timestamptz NOT NULL
created_at   timestamptz DEFAULT now()
```

### Table: `lists`

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE
name        text NOT NULL
is_default  boolean DEFAULT false  -- true for Unread, Favourite, Groups
sort_order  int DEFAULT 0
created_at  timestamptz DEFAULT now()
```

### Table: `chat_list_memberships`

Associates a specific chat with a user-defined list.

```sql
id       uuid PRIMARY KEY DEFAULT gen_random_uuid()
list_id  uuid REFERENCES lists(id) ON DELETE CASCADE
chat_id  uuid REFERENCES chats(id) ON DELETE CASCADE
user_id  uuid REFERENCES profiles(id) ON DELETE CASCADE
UNIQUE(list_id, chat_id, user_id)
```

### Table: `archived_chats`

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE
chat_id     uuid REFERENCES chats(id) ON DELETE CASCADE
archived_at timestamptz DEFAULT now()
UNIQUE(user_id, chat_id)
```

### Table: `cleared_chats`

Tracks per-user "clear chat" actions (soft delete for client display only).

```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id      uuid REFERENCES profiles(id) ON DELETE CASCADE
chat_id      uuid REFERENCES chats(id) ON DELETE CASCADE
cleared_at   timestamptz DEFAULT now()
UNIQUE(user_id, chat_id)
```

### Table: `chat_themes`

Per-user per-chat theme override.

```sql
id        uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id   uuid REFERENCES profiles(id) ON DELETE CASCADE
chat_id   uuid REFERENCES chats(id) ON DELETE CASCADE
theme     text NOT NULL DEFAULT 'default'
UNIQUE(user_id, chat_id)
```

---

## 5. Authentication

### Implementation

- Use `supabase.auth.signUp({ email, password })` for registration.
- Use `supabase.auth.signInWithPassword({ email, password })` for login.
- Use `supabase.auth.signOut()` for logout.
- No magic link, no OTP, no OAuth providers.
- On successful `signUp`, a database trigger automatically creates a row in `profiles` with a derived username (from email prefix) and full_name.
- Listen to `supabase.auth.onAuthStateChange` in `AuthProvider` to keep session state.

### Auth Page `/auth`

Two tabs: **Login** and **Sign Up**.

**Login form fields:**
- Email (type email, required)
- Password (type password, required)
- Submit button: "Log In"
- Error display below the form

**Sign Up form fields:**
- Full Name (required)
- Username (required, unique — validate on blur via Supabase query)
- Email (required)
- Password (min 8 chars)
- Confirm Password (must match)
- Submit button: "Create Account"
- Error display below the form

**Validation:** Use React Hook Form + Zod schemas. Show inline field errors. Show toast on success/failure.

---

## 6. Pages & Routes

### 6.1 Landing Page `/`

A basic placeholder page. Display the app logo, name "Chat-It", and a "Get Started" button linking to `/auth`. No further design required at this stage.

---

### 6.2 Auth Page `/auth`

See [Section 5](#5-authentication) above. Full-page centered layout. Two tabs (Login / Sign Up) using Tailwind tab styling.

---

### 6.3 Chats Page `/chats`

This is the main hub. Layout:

#### Desktop Layout
- Sidebar (left, fixed width ~320px): list filters + chat list
- Main panel (right): renders selected `ChatScreen` or empty state

#### Mobile Layout
- Full-screen chat list view (bottom dock navigation)
- Navigating to a chat opens full-screen ChatScreen with back button

#### Top Bar
- App name / logo (left)
- Icons row (right): Search icon (→ `/search`), Add icon (→ `/add`), Settings icon (→ `/settings`)

#### Filter Tabs (horizontal scrollable row)

Tabs in order:
1. **All** — all non-archived chats
2. **Unread** — chats with unread messages
3. **Favourite** — chats in user's Favourite list
4. **Groups** — only group chats
5. **[Custom Lists]** — any custom lists the user has created (dynamically appended)
6. **+** — tapping this opens the Lists page `/chats/lists` inline or navigates to it

#### Chat List Item (each row)

For each chat in the filtered list:
- Avatar (circular, 48px) — group avatar or other user's avatar
- **Name** (bold) — group name or other user's full name
- **Last message preview** — truncated to 1 line, show "You: " prefix if sent by current user
- **Timestamp** — relative (e.g. "2m", "Yesterday", date)
- **Unread count badge** — shown if unread > 0, green circle
- **Muted icon** — if muted, show a muted bell icon
- Long-press / right-click context menu on a chat item:
  - Archive
  - Mute / Unmute
  - Add to list (opens list picker sheet)
  - Delete chat (clears for self only)

---

### 6.4 Chat Screen `/chats/:id`

Used for both 1-on-1 and group chats. The UI is the same; the only difference is the dropdown menu options.

#### Top Bar

- **Back arrow** (mobile only)
- **Avatar** (circular, 36px, tappable → opens profile or group info)
- **Name** (bold) + **subtitle** — for DM: "online" / "last seen X"; for group: "N members"
- **Icons row (right):**
  - Video call icon (future/placeholder)
  - Phone call icon (future/placeholder)
  - Three-dot menu icon → opens dropdown

#### Dropdown Menu

**For DM chats:**
- Search
- Media (→ `/chats/:id/media`)
- Chat Theme
- More → sub-dropdown:
  - Clear Chat (for self only — inserts row in `cleared_chats`)
  - Add to List (opens list picker sheet)
  - Export Chat *(disabled, future feature — show greyed out with "Coming Soon" label)*

**For Group chats:**
- Add Members
- Group Info (→ `/chats/:id/info`)
- Group Media (→ `/chats/:id/media`)
- Search
- Mute Notifications (toggle)
- Chat Theme
- More → sub-dropdown:
  - Clear Chat (for self only)
  - Export Chat *(disabled)*
  - Add to List
  - Exit Group → shows confirmation dialog: "Exit Group" / "Cancel"

#### Messages Area

- Scrollable, newest at bottom
- Auto-scroll to bottom on new message
- Messages grouped by date with date separator (e.g. "Today", "Yesterday", "March 25")
- **Sent message bubble:** right-aligned, primary colour, shows read receipt icons (single tick = sent, double tick = delivered, double blue tick = read)
- **Received message bubble:** left-aligned, white/neutral
- Each bubble shows: sender avatar (group only), sender name (group only), content, timestamp (HH:mm AM/PM)
- Long-press a message → context menu: Reply, Copy, Delete (own messages only — soft delete)
- Reply preview bar shown above composer when replying
- If `cleared_chats` row exists for this user+chat, messages sent before `cleared_at` are hidden client-side (filter in query)

#### Message Composer (bottom bar)

- Attach icon (left) → opens file/image picker
- Text input (multiline, auto-grow)
- Emoji button
- Send button (right, active when input is non-empty or file selected)
- Voice note button (future/placeholder)

#### Search Mode (in-chat)

Triggered from dropdown. Shows a search bar at top. Highlights matched messages. Previous/Next navigation arrows.

---

### 6.5 Search Page `/search`

Accessed via search icon on Chats page.

#### Layout

- Search bar (autofocused)
- Results list below

#### Search Logic

1. **If query matches a user's existing chat list** (username, full name, group name) → show those results first under section header "Your Chats"
2. **Platform-wide results** (if no local match, or always shown after local) → under section header "On Chat-It":
   - Other platform users (search `profiles` by `username` or `full_name`)
   - Public groups (search `group_info` where `is_public = true` by `name`)

#### Result Row

- Avatar
- Name (bold)
- Subtitle: username for users / "Group · N members" for groups
- Tapping a user → navigate to their DM chat (create chat if none exists) or to their profile
- Tapping a group → if member: open group chat; if not member: open group info with "Join" option (only for public groups)

---

### 6.6 Add Contact Page `/add`

#### Layout

- Top: Page title "New Chat"
- Search input (same logic as Search Page)
- Results list
- Two fixed buttons at bottom:
  1. **New Group** (→ `/add/new-group`)
  2. **Invite New User** (→ `/invite` or copy invite link)

#### Behaviour

Same platform-wide search as `/search`. Tapping a user opens or creates the DM chat and navigates to `/chats/:id`.

---

### 6.7 New Group Page `/add/new-group`

Two-step flow.

#### Step 1 — Select Members

- Title: "Add Members"
- Search input to filter contacts
- List of all users the current user has previously chatted with (all direct chat partners), showing checkbox or selection ring on avatar
- Selected members shown as a horizontal scrollable strip at the bottom with small avatar + name (truncated), each with an ✕ to deselect
- **Next** button (active only when ≥1 member selected) → Step 2

#### Step 2 — Group Setup

- Title: "New Group"
- **Group Photo:** circular tap target, opens image picker → uploads to Supabase Storage
- **Group Name:** text input (required)
- **About:** textarea (optional)
- **Privacy toggle:** "Public Group" / "Private Group" (boolean `is_public`)
- **Group Permissions button** → opens Group Permissions sheet (see below)
- **Selected Members strip** (non-interactive display at bottom):
  - Shows count ("3 members selected")
  - Horizontal row of circular avatars with name beneath each
  - **Group Permissions Settings** button in this section too (alternative access)
- **Create Group** button → on success: inserts `chats`, `group_info`, `group_permissions`, `chat_members` rows; navigates to `/chats/:newGroupId`

#### Group Permissions Sheet (modal/bottom sheet)

Title: "Group Permissions"

Toggle rows — **Members can:**

| Setting | Default | Description |
|---------|---------|-------------|
| Edit group settings | OFF | Name, icon, description, pin/delete own messages |
| Send new messages | ON | Members can post in the group |
| Add other members | ON | Members can invite existing contacts |
| Invite via link or QR code | ON | Members can share invite link/QR |

Toggle rows — **Admin controls:**

| Setting | Default | Description |
|---------|---------|-------------|
| Approve new members | OFF | When ON, admins must approve join requests |

All settings stored in `group_permissions` table.

---

### 6.8 Group Info Page `/chats/:id/info`

Accessed from group chat dropdown → "Group Info".

#### Layout (top to bottom)

1. **Group Avatar** — full-width hero image or large circular, tappable to update (admin only)
2. **Group Name** — large bold text (editable inline for admins)
3. **Members count** — e.g. "3 members" (subtitle)
4. **Action Buttons row** (4 buttons in a row):
   - **Message** — scrolls back to chat
   - **Mute** — toggle mute
   - **Add** — opens add members flow
   - **Leave** — shows confirmation dialog "Leave Group?" / "Cancel"
5. **Description section** — multiline text (editable for admins), labelled "Description"
6. **Created by** line — "Created by You" or "Created by {full_name}, {Day} at {HH:mm AM/PM}"
7. **Members list** — list of all group members showing:
   - Circular avatar (40px)
   - Full name (bold)
   - Username (subtitle)
   - Role badge ("Admin" pill) if admin
   - Long-press / three-dot on member row → for admins: "Make Admin", "Remove from Group"; for self: "Leave Group"

#### Top-Right Three-dot Menu (admin only)

- **Group Permissions** (→ Group Permissions Sheet)
- **Delete Group** → confirmation dialog "Delete Group? This cannot be undone." / "Cancel" → on confirm: soft-deletes or hard-deletes the group chat

---

### 6.9 Group Media Page `/chats/:id/media`

Three tab categories displayed as a tab bar:

| Tab | Content |
|-----|---------|
| **Media** | Grid of image/video thumbnails from messages in this chat |
| **Docs** | List of file attachments (name, size, date) |
| **Links** | List of URLs extracted from messages (preview card: title, domain, date) |

Tapping a media item → full-screen viewer with prev/next swipe.

---

### 6.10 User Profile Page `/profile/:id`

Accessed by tapping the other user's avatar in a DM chat header.

Same layout as Group Info but for a user — without any group-exclusive features.

#### Layout (top to bottom)

1. **Avatar** — large circular (not editable here)
2. **Full Name** — large bold
3. **Username** — @username subtitle
4. **Action Buttons row** (2–3 buttons):
   - **Message** — navigates to DM with this user
   - **Mute** — toggle mute notifications from this user
5. **About** section — the user's about text
6. **Social Links** — list of clickable social links (icon + label)

---

### 6.11 Own Profile Page `/profile`

Accessible from Settings → Profile. Fully editable version of the profile.

#### Layout (top to bottom)

1. **Avatar** — tappable, opens image picker → uploads to Supabase Storage → updates `profiles.avatar_url`
2. **Full Name** — inline editable text field
3. **Username** — inline editable, real-time uniqueness check
4. **About** — multiline editable textarea
5. **Social Links section:**
   - List of existing social links (platform name + URL)
   - "Add Social Link" button → opens modal with platform name input + URL input
   - Edit / Delete each link
6. **Save Changes** button → updates `profiles` table row

---

### 6.12 Settings Page `/settings`

Full-page list of settings options.

| Option | Destination | Notes |
|--------|-------------|-------|
| Profile | `/profile` | User's own profile |
| Account | `/account` | Email, password, delete |
| Lists | `/chats/lists` | Manage chat lists |
| Archived | `/archived` | Archived chats |
| Announcements | `/announcements` | All announcements |
| Invite a Friend | `/invite` | Share invite link |

Each item: icon + label + right chevron. Standard list layout.

---

### 6.13 Account Page `/account`

Three sections:

#### Email Address
- Shows current email
- "Change Email" button → modal with: new email input, current password confirmation, submit

#### Password
- "Change Password" button → modal with: current password, new password, confirm new password, submit
- Calls `supabase.auth.updateUser({ password })`

#### Delete Account
- "Delete Account" button — **destructive**, red text
- Confirmation dialog: "Are you sure? This will permanently delete all your data and cannot be undone."
- On confirm: deletes all user data (cascade via DB triggers), calls `supabase.auth.admin.deleteUser()` or a server-side function

---

### 6.14 Lists Page `/chats/lists`

Accessible from Settings → Lists, or from the `+` tab in the chats filter.

#### Layout

- **"Create New List"** button at top (+ icon)
  - Opens modal with: List Name input, submit
  - Creates a row in `lists` table with `is_default = false`

- **"Your Lists"** section below the button:
  - Shows all lists (default + custom) in user's `sort_order`
  - **Default lists (non-deletable):**
    - Unread
    - Favourite
    - Groups
  - **Custom lists:** fully deletable

- **Edit Mode** (triggered by pen/edit icon top-right):
  - Drag handle visible on each row → user can drag to reorder (updates `sort_order`)
  - Delete icon appears on custom lists (not defaults)
  - Confirmation before delete: "Delete list '{name}'? Chats in this list won't be deleted."

---

### 6.15 Archived Page `/archived`

Lists all chats in `archived_chats` for the current user. Same chat list row UI as the main chats list.

- Top bar: "Archived" title + settings icon (→ `/archived/settings`)
- Tapping a chat → opens the chat screen normally
- Swipe left / long-press → "Unarchive"

---

### 6.16 Archived Settings Page `/archived/settings`

Simple settings page with one key toggle:

| Setting | Default | Description |
|---------|---------|-------------|
| Keep chats archived | OFF | When ON, new messages in archived chats do NOT auto-unarchive them |

---

### 6.17 Announcements Page `/announcements`

Accessible from Settings, and from the mobile bottom dock.

#### Layout

- Page title: "Announcements"
- Settings icon (top right → `/announcements/settings`)
- **Card grid / list of announcement cards**, one per announcement across all groups the user is a member of

#### Announcement Card

- Group name + group avatar (top-left)
- Announcement title (bold)
- Announcement body (truncated, expandable)
- **Expires at** timestamp prominently shown
- **Status badge:**
  - "Active" (green) — if `expires_at` is in the future
  - "Closed" (grey) — if `expires_at` is in the past
- Tapping card → opens announcement detail modal/sheet with full body text

#### Creating an Announcement (from group chat)

- Only available to admins, OR members who have been granted announcement permission
- "New Announcement" option in group chat dropdown → opens create sheet:
  - Title (required)
  - Body (required)
  - Expires At (date + time picker, required)
  - Submit → inserts row in `announcements`, sends a message of type `announcement` in the chat

---

### 6.18 Announcements Settings Page `/announcements/settings`

Simple settings page:

| Setting | Default | Description |
|---------|---------|-------------|
| Notifications for announcements | ON | Push/in-app notification when a new announcement is created in a group you're in |

---

### 6.19 Invite Friend Page `/invite`

- Page title: "Invite a Friend"
- Displays a generated invite link (static app URL or dynamic referral link)
- "Copy Link" button
- "Share" button (uses Web Share API on supported browsers)
- QR code of the invite link displayed below

---

## 7. Component Library

All components should be placed in `src/components/`. Use strict TypeScript props interfaces for every component.

### Layout Components

| Component | Description |
|-----------|-------------|
| `AppShell` | Top-level layout wrapper. Sidebar + main panel on desktop. Full-screen stack on mobile. |
| `BottomDock` | Mobile-only fixed bottom navigation (Chats, Announcements) |
| `Sidebar` | Desktop left panel. Contains chat list filters + chat list. |
| `TopBar` | Per-page top navigation bar with back, title, action icons |

### Chat Components

| Component | Description |
|-----------|-------------|
| `ChatListItem` | Single row in the chat list |
| `MessageBubble` | Single message bubble (sent/received variants) |
| `MessageComposer` | Bottom input bar with attach, emoji, send |
| `ReplyPreview` | Preview bar above composer when replying |
| `DateSeparator` | Date divider in message stream |
| `ReadReceipt` | Single/double/blue tick icons |
| `AnnouncementBubble` | Special in-chat bubble for announcement messages |

### UI Primitives

| Component | Description |
|-----------|-------------|
| `Avatar` | Circular avatar with fallback initials |
| `Badge` | Unread count badge |
| `BottomSheet` | Mobile-style sheet from bottom (Group Permissions, etc.) |
| `ConfirmDialog` | Reusable confirmation modal |
| `DropdownMenu` | Three-dot dropdown menu |
| `ListPicker` | Sheet to pick which list to add a chat to |
| `TabBar` | Horizontal scrollable filter tabs |
| `Toggle` | On/off toggle switch |
| `SearchInput` | Styled search input with clear button |
| `EmptyState` | Illustration + message for empty lists/search |
| `SkeletonLoader` | Loading skeletons for chat list and messages |

---

## 8. Real-time Features

Use Supabase Realtime subscriptions.

### Subscriptions Needed

| Channel | Table | Event | Handler |
|---------|-------|-------|---------|
| `messages:chat_id=<id>` | `messages` | INSERT, UPDATE | Append new message to UI; update existing (edits/deletes) |
| `chat_members:user_id=<me>` | `chat_members` | INSERT | New group joined — refresh chat list |
| `chats:member` | Via `chat_members` JOIN | INSERT | New DM started by someone else |
| `announcements:chat_id=<id>` | `announcements` | INSERT | Show toast "New Announcement in {group}" |

### Presence

For each open DM chat, use Supabase Presence to track:
- Whether the other user is currently online
- Whether they are currently viewing this chat (for "read receipt" logic)

Show "online" / "last seen X" in the chat screen subtitle using presence data.

### Unread Count

- Computed by comparing the latest message `created_at` in each chat vs the latest row in `message_reads` for the current user in that chat.
- Updated reactively via real-time subscription on `messages`.

---

## 9. Mobile Layout & Navigation

### Bottom Dock (mobile only)

Fixed bottom navigation bar with two items:

| Tab | Icon | Route |
|-----|------|-------|
| Chats | Chat bubble icon | `/chats` |
| Announcements | Megaphone icon | `/announcements` |

Active state: filled icon + label, brand colour underline.

### Navigation Stack (mobile)

- Chats list → Chat Screen: push navigation (back arrow returns to list)
- Chat Screen → Profile/Group Info: push navigation
- Settings → sub-pages: push navigation
- Modals/sheets: overlay (not stack push)

### Responsive Breakpoints

| Breakpoint | Behaviour |
|------------|-----------|
| `< 768px` (mobile) | Single-column stack, bottom dock |
| `≥ 768px` (tablet/desktop) | Sidebar + main panel side-by-side |

---

## 10. Row-Level Security Policies

All tables must have RLS enabled. Key policies:

### `profiles`
- SELECT: anyone authenticated
- UPDATE: only `auth.uid() = id`

### `chats`
- SELECT: only if user is a member (`chat_members.user_id = auth.uid()`)
- INSERT: any authenticated user

### `group_info`
- SELECT: members of the chat, OR `is_public = true` for anyone authenticated
- UPDATE: only admins of the chat

### `messages`
- SELECT: only members of `chat_id`
- INSERT: only members of `chat_id` (and only if `group_permissions.can_send_messages = true` for groups, or they are admin)
- UPDATE/DELETE: only `sender_id = auth.uid()`

### `chat_members`
- SELECT: only members of the same chat
- INSERT: admins can add members; self can join public groups
- DELETE: self (leave); admins can remove others

### `announcements`
- SELECT: only members of `chat_id`
- INSERT: only admins OR members where permission is granted

### `lists`
- All operations: only `user_id = auth.uid()`

### `archived_chats`, `cleared_chats`, `chat_themes`, `chat_list_memberships`
- All operations: only `user_id = auth.uid()`

---

## 11. File & Media Storage

### Supabase Storage Buckets

| Bucket | Access | Contents |
|--------|--------|----------|
| `avatars` | Public | User and group avatars |
| `chat-media` | Private (members only) | Images, videos, files sent in chats |

### Upload Flow

1. User selects file via `react-dropzone` or native picker
2. Client uploads to `chat-media/{chatId}/{uuid}.{ext}` using `supabase.storage.from('chat-media').upload()`
3. On success, get signed URL (for private bucket) or public URL
4. Insert message row with `type = 'image'|'video'|'file'` and `media_url` set

### Limits

- Max file size: 50MB per file
- Supported image types: JPEG, PNG, WebP, GIF
- Supported video types: MP4, MOV, WebM
- All other files treated as generic "Doc" type

---

## 12. Notifications

### In-App (Toast)

Use **Sonner** for:
- New message received (when app is open but chat is not active)
- New announcement
- Group invite received
- Member added/removed from group

### Browser Push Notifications (future/deferred)

Not implemented in v1. Leave a stub in the codebase.

---

## 13. Group Permissions Model

Permissions are stored in `group_permissions`. When a member attempts a restricted action, check the corresponding permission column before executing.

### Enforcement Points

| Action | Permission Column | Bypass |
|--------|------------------|--------|
| Send a message | `can_send_messages` | Admins always can |
| Edit group name/icon/about | `can_edit_group_settings` | Admins always can |
| Add members | `can_add_members` | Admins always can |
| Generate invite link | `can_invite_via_link` | Admins always can |
| Join via invite link | `require_admin_approval` (if true, creates a join request) | Admins approve |

### Admin Role

- First creator of a group is auto-assigned `role = 'admin'`
- Admins can promote/demote other members
- Admins are never affected by member-level permission restrictions

---

## 14. Non-Functional Requirements

| Category | Requirement |
|----------|------------|
| **Performance** | Paginate message history (50 messages/page, infinite scroll upward). Paginate chat list (20 chats/page). |
| **Security** | All Supabase requests use anon key + RLS. No sensitive keys in client bundle. |
| **Offline** | Show cached last state when offline. Display "You are offline" banner. Disable send when offline. |
| **Accessibility** | All interactive elements keyboard navigable. ARIA labels on icon-only buttons. Sufficient colour contrast. |
| **Error Handling** | Every Supabase call wrapped in try/catch. User-facing error toasts for failures. No raw error objects in UI. |
| **Loading States** | Skeleton loaders for chat list, message list, profile pages. Spinner on send button while sending. |
| **Code Quality** | ESLint + Prettier configured. Strict TypeScript. No `any` types. All components in separate files. |

---

## 15. Future Features (Deferred)

These are explicitly OUT OF SCOPE for v1 but should be noted:

- Voice and video calling
- Voice notes / audio messages
- Export chat
- Browser push notifications
- End-to-end encryption
- Message reactions / emoji reactions
- Polls in groups
- Pinned messages
- Disappearing messages
- Multi-device sync conflict resolution
- QR code-based contact adding (skeleton only)

---

## 16. Directory Structure

```
chat-it/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── vite-env.d.ts
│   │
│   ├── lib/
│   │   ├── supabase.ts          # createClient() export
│   │   └── utils.ts             # cn(), formatDate(), etc.
│   │
│   ├── types/
│   │   ├── database.ts          # Generated Supabase types
│   │   ├── chat.ts
│   │   ├── user.ts
│   │   └── announcement.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useChats.ts
│   │   ├── useMessages.ts
│   │   ├── usePresence.ts
│   │   ├── useUnreadCounts.ts
│   │   ├── useAnnouncements.ts
│   │   └── useProfile.ts
│   │
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── chatStore.ts
│   │   └── uiStore.ts
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── BottomDock.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopBar.tsx
│   │   │
│   │   ├── chat/
│   │   │   ├── ChatListItem.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageComposer.tsx
│   │   │   ├── ReplyPreview.tsx
│   │   │   ├── DateSeparator.tsx
│   │   │   ├── ReadReceipt.tsx
│   │   │   └── AnnouncementBubble.tsx
│   │   │
│   │   └── ui/
│   │       ├── Avatar.tsx
│   │       ├── Badge.tsx
│   │       ├── BottomSheet.tsx
│   │       ├── ConfirmDialog.tsx
│   │       ├── DropdownMenu.tsx
│   │       ├── ListPicker.tsx
│   │       ├── TabBar.tsx
│   │       ├── Toggle.tsx
│   │       ├── SearchInput.tsx
│   │       ├── EmptyState.tsx
│   │       └── SkeletonLoader.tsx
│   │
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── AuthPage.tsx
│   │   ├── ChatsPage.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── SearchPage.tsx
│   │   ├── AddContactPage.tsx
│   │   ├── NewGroupPage.tsx
│   │   ├── GroupInfoPage.tsx
│   │   ├── GroupMediaPage.tsx
│   │   ├── UserProfilePage.tsx
│   │   ├── OwnProfilePage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── AccountPage.tsx
│   │   ├── ListsPage.tsx
│   │   ├── ArchivedPage.tsx
│   │   ├── ArchivedSettingsPage.tsx
│   │   ├── AnnouncementsPage.tsx
│   │   ├── AnnouncementsSettingsPage.tsx
│   │   └── InvitePage.tsx
│   │
│   └── assets/
│       └── logo.svg
│
├── .env.local                   # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── index.html
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── eslint.config.js
└── package.json
```

---

*End of PRD — Chat-It v1.0*