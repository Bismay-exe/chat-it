Good — now we turn this into something real.

You don’t need “random testing.”
You need a **QA attack script** — something that *tries to break your app on purpose*.

This is how you validate Phase 1.5 properly.

---

# 🔥 CHAT-IT MOBILE QA BREAK TEST (PHASE 1.5)

Run this like a checklist. Don’t skip.

---

# 1. AUTH BREAK TEST

## Test cases

```text
Login → kill app → reopen
Login → logout → back navigation
Invalid login attempts
Network off during login
Token expiry simulation
```

## Expected

* No infinite loading
* No ghost login
* Proper redirect to auth
* Session restores cleanly

## If this breaks:

Your entire app is unstable. Fix first.

---

# 2. NAVIGATION STRESS TEST

## Do this aggressively:

```text
Open chat → back → open another → repeat 20 times
Navigate while data still loading
Spam tap chat list items
Switch tabs rapidly
```

## Expected:

* No crashes
* No blank screens
* No stuck loading states

## Red flag:

If screens freeze or flicker → navigation/state coupling is bad.

---

# 3. REALTIME MESSAGE TEST (CRITICAL)

Use 2 devices or emulator + phone.

## Test:

```text
Send 50 messages rapidly
Receive messages rapidly
Switch chats while messages incoming
Background app → send messages → reopen
Kill app → send message → reopen
```

## Expected:

* No duplicate messages
* No missing messages
* Order always correct
* Realtime resumes after reopen

## Common failure:

* duplicate inserts (optimistic + realtime conflict)
* missed messages after reconnect

Fix now.

---

# 4. MESSAGE CONSISTENCY TEST

## Test:

```text
Send message
Immediately send another
Spam send
Slow network simulation
```

## Expected:

* No flicker
* No duplicate messages
* Temp messages replaced correctly
* Order preserved

## If broken:

Your message architecture is wrong.

---

# 5. PAGINATION + SCROLL TEST

## Test:

```text
Scroll to top repeatedly
Load older messages
Scroll fast
Jump bottom → top → bottom quickly
```

## Expected:

* Smooth scroll
* No UI freeze
* No full re-render
* Memory stable

## Red flag:

If chat lags → you didn’t use virtualization correctly (FlashList issue).

---

# 6. PERFORMANCE TEST

## Check manually:

```text
Does chat lag after 100+ messages?
Does typing lag?
Does opening chat feel slow?
```

## Tools:

* enable React DevTools
* log renders

## Red flag:

```text
Whole chat re-rendering on new message
```

That’s fatal for scale.

---

# 7. OFFLINE TEST

## Test:

```text
Turn off internet
Open app
Send message
Reconnect internet
```

## Expected:

* UI shows offline
* message fails gracefully OR queues
* retry works

## If not:

Add basic offline state.

---

# 8. ERROR HANDLING TEST

## Simulate:

```text
Break API call
Return 500
Return empty data
```

## Expected:

* No crash
* Error state shown
* Retry possible

## If you see:

```text
white screen
```

You failed.

---

# 9. DEEP LINK TEST

## Test:

```text
chatit://chats/123
```

From:

* app closed
* app background
* app open

## Expected:

* correct chat opens
* back works correctly

## This is mandatory for notifications later.

---

# 10. MEMORY TEST

## Do:

```text
Open chat
Scroll a lot
Switch chats
Repeat 20+ times
```

## Watch:

* app slow down?
* crashes?
* reloads?

## If yes:

You have leaks or bad subscriptions.

---

# 11. SUBSCRIPTION CLEANUP TEST

## Test:

```text
Open chat A
Switch to chat B
Switch back to A
Repeat
```

## Expected:

* only ONE active subscription per chat
* no duplicate events

## If you see:

messages arriving twice → bug

---

# 12. SEARCH TEST

## Test:

```text
Search quickly
Search empty query
Search large dataset
```

## Expected:

* no lag
* no freeze
* correct results

---

# 13. ARCHIVE TEST

## Test:

```text
Archive chat
Unarchive
Switch lists
```

## Expected:

* correct filtering
* no ghost chats

---

# 14. PROFILE + SETTINGS TEST

## Test:

```text
Update profile
Refresh app
Check persistence
```

## Expected:

* data syncs correctly
* no stale UI

---

# 15. ADMIN (MINIMAL TEST)

## Test:

```text
Open admin routes
Switch between pages
```

## Expected:

* no crashes
* basic routing works

Don’t overtest here.

---

# 16. BACKGROUND + FOREGROUND TEST

## Test:

```text
Open chat
Send message
Put app in background
Wait 1–2 min
Return
```

## Expected:

* no crash
* state intact
* realtime resumes

---

# 17. APP KILL TEST

## Test:

```text
Kill app completely
Reopen
```

## Expected:

* session restored
* last state loads correctly

---

# 18. EDGE CASE CHAOS TEST (IMPORTANT)

Do this like a maniac:

```text
Spam navigation
Send messages fast
Turn network off/on
Switch chats rapidly
Kill app mid-send
Reopen
```

## Expected:

Still stable.

If not → fix before UI.

---

# 🧠 FINAL VERDICT CRITERIA

You are ready for UI phase ONLY if:

```text
No duplicate messages
No missed messages
No crashes
No navigation bugs
Chat scroll is smooth
No full re-renders
Offline doesn’t break app
Deep links work
```

If even 1 of these fails → you are NOT ready.

---