# 📄 PRD — Admin System (Chat-It)

## 🎯 Objective

Provide a centralized admin system to:

* moderate users
* handle reports
* send announcements
* manage platform activity

---

# 👥 Roles

### 1. User

* default role
* can chat, send messages

### 2. Member

* verified / trusted user (optional upgrade)
* fewer restrictions (e.g., less rate limiting)

### 3. Admin

* full moderation + control access

---

# 🧭 Navigation Structure

## Admin Entry Point

```text
/admin
```

👉 This is the **dashboard hub**

---

## Admin Sections (each opens its own page)

```text
/admin/users
/admin/reports
/admin/announcements
/admin/logs
/admin/settings
```

---

# 🧱 Page Structure

## 1. `/admin` — Dashboard (Hub)

### Purpose:

Quick access to all admin features

### UI:

* grid of cards
* each card = feature

### Cards:

* Users
* Reports
* Announcements
* Logs
* Settings

👉 Clicking a card → navigates to its section

---

## 2. `/admin/users` — User Management

### Features:

* list reported users/messages
* grouped by:

  * user
  * message

### Actions:

* view report details
* delete user
* ban user
* dismiss report

---

## 4. `/admin/announcements` — Broadcast System

### Features:

* create announcement
* preview message

### Actions:

* send to all users
* schedule (message will be sent at a specific time later)

---

## 5. `/admin/logs` — Activity Logs

### Features:

* track admins and members actions

### Shows:

* who did what
* when
* target (user/action)

---

## 6. `/admin/settings` — App Controls

### Features:

* feature toggles
* basic app config

---

# 🔄 Key Flows

## 1. Ban/Unban/Delete User Flow

```text
Admin → /admin/users → select user → ban/unban/delete → confirmation → applied
```

---

## 2. Report Handling Flow

```text
User reports → /admin/reports → admin reviews → action (ban/delete/dismiss)
```

---

## 3. Announcement Flow

```text
Admin → /admin/announcements → write → send → delivered to users
```

---

# 🔐 Access Rules (high level)

* only `admin` role can access `/admin/*`
* non-admin → blocked or redirected

---

# ⚠️ Constraints

* no destructive actions without confirmation
* banning should not delete data immediately
* all admin actions should be traceable (logs)

---

# 🧠 UX Principles

* fast access (no deep nesting)
* clear actions (ban, dismiss, send)
* minimal clutter

---