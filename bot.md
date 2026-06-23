# WhatsApp Learner Portal Bot — Setup Guide

A WhatsApp Business Cloud API bot that lets students log in with their **Student ID** and check fees, grades, attendance, notices, profile, and report cards directly in WhatsApp.

> **Motto:** Excellence & Integrity

---

## What you get

When a learner messages your school's WhatsApp number, they see:

```
👋 Welcome to St. Mary's WhatsApp Portal.
Please reply with your Student ID (e.g. STM20240001) to log in.
```

After login the main menu shows:

```
1️⃣  Latest Report Card
2️⃣  Fees Balance
3️⃣  Notices & Announcements
4️⃣  Attendance Summary
5️⃣  My Grades
6️⃣  My Profile
0️⃣  Logout
```

Reply `menu` any time to see the menu again.

---

## Architecture

```
WhatsApp user  →  Meta Cloud API  →  Edge Function (whatsapp-webhook)  →  Database
                                              │
                                              └──→ Send reply via Graph API
```

- **Edge function:** `supabase/functions/whatsapp-webhook/index.ts`
- **Session table:** `public.whatsapp_sessions` (tracks who is logged in per phone number)
- **Auth:** Lookup by `student_profiles.student_id`. No password — the user must already exist in the school system.

---

## Step 1 — Create a Meta Business app

1. Go to <https://developers.facebook.com/apps/>.
2. **Create App → Other → Business**.
3. In the new app dashboard, add the **WhatsApp** product.
4. In **WhatsApp → API Setup** you'll get:
   - A **temporary access token** (24 h — fine for testing).
   - A **Phone number ID** (use this, NOT the actual phone number).
   - A test sender number you can message from your own WhatsApp.
5. Add up to 5 verified test recipient numbers.

For production, request a **System User permanent token** (Business Settings → System Users → Add → Generate Token → select your app and the `whatsapp_business_messaging` + `whatsapp_business_management` scopes).

---

## Step 2 — Add the secrets

The following secrets are required (already wired in this project):

| Secret | Where to get it |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` | Meta → WhatsApp → API Setup (temporary) or System User token (permanent) |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta → WhatsApp → API Setup → "Phone number ID" |
| `WHATSAPP_VERIFY_TOKEN` | A random string you invent (e.g. `stmarys-verify-9f2k`). You'll paste the same value into Meta in Step 4. |

Add or rotate them in **Lovable Cloud → Secrets**.

---

## Step 3 — Webhook URL

The edge function is deployed automatically. Your webhook URL is:

```
https://<your-supabase-ref>.supabase.co/functions/v1/whatsapp-webhook
```

For this project:

```
https://bevbhjomaicexupgunlv.supabase.co/functions/v1/whatsapp-webhook
```

---

## Step 4 — Configure the webhook in Meta

1. Meta dashboard → **WhatsApp → Configuration → Webhook → Edit**.
2. **Callback URL:** the URL from Step 3.
3. **Verify token:** the exact string you saved as `WHATSAPP_VERIFY_TOKEN`.
4. Click **Verify and save**. Meta will hit the function with `GET ?hub.mode=subscribe&hub.verify_token=…` and our function echoes back the challenge.
5. Under **Webhook fields → Manage**, subscribe to **`messages`**.

---

## Step 5 — Test it

1. From your verified WhatsApp number, send `Hi` to the Meta test number.
2. You should receive the login prompt.
3. Reply with a real `student_id` from `student_profiles` (e.g. `STM20240001`).
4. Try menu items `1`–`6`.

If nothing arrives, check **Lovable Cloud → Edge Functions → whatsapp-webhook → Logs**.

---

## Step 6 — Go live

To message arbitrary users (not just test numbers):

1. Add a **real WhatsApp Business phone number** in Meta → WhatsApp → Phone Numbers.
2. Complete **Business Verification**.
3. Submit your app for **App Review** (request `whatsapp_business_messaging`).
4. Replace the temporary token with a **permanent System User token** and update the `WHATSAPP_ACCESS_TOKEN` secret.
5. The 24-hour customer-service window applies: you can freely reply to any user who messaged you in the last 24 h. Outside that window you must use approved **message templates**.

---

## How sessions work

The `whatsapp_sessions` table stores one row per phone number:

| column | purpose |
|---|---|
| `phone_number` | E.164 number Meta sends us (e.g. `263771234567`) |
| `user_id` | The matched `auth.users.id` after login |
| `student_profile_id` | The matched `student_profiles.id` |
| `state` | `awaiting_login` or `authenticated` |
| `context` | Free-form JSON for multi-step flows |
| `last_activity_at` | Auto-updated on every message |

The bot uses the **service role key** to read student data, so RLS is bypassed safely on the server. Frontend users never get this key.

---

## Extending the bot

To add a new menu item, edit `supabase/functions/whatsapp-webhook/index.ts`:

1. Add the option to `MAIN_MENU`.
2. Write a `handleX(phone, userId)` function.
3. Add a new `case` in the `switch (text)` block.

Example — add **"7. Contact School"**:

```ts
case "7":
  return sendText(phone, "📞 Call us on +263 …\n📧 admin@stmarys.ac.zw\n\nReply *menu* to return.");
```

Redeploy is automatic — Lovable redeploys edge functions on save.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Webhook verification fails | Verify token mismatch — make sure `WHATSAPP_VERIFY_TOKEN` secret = the value pasted into Meta. |
| "Recipient phone number not in allowed list" | You're still on the test sender. Add the number in Meta API Setup, or finish app review. |
| Bot doesn't reply | Check edge function logs. Most common: expired `WHATSAPP_ACCESS_TOKEN` (the temp token lasts 24 h). |
| `❌ No student found` | The `student_id` you typed doesn't match anything in `student_profiles.student_id`. Check exact casing — bot uppercases input. |
| User wants the actual PDF | The bot returns a summary + serial number. Full PDF download stays gated to the web portal (auth required) for security. |

---

Built for **St. Mary's High School** by Darrell Mucheri (`mrfr8nk`).
