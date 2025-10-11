# 🔍 TEST LEAD UPDATE - Debugging Guide

## ❗ CRITICAL ISSUE

The lead edit shows "success" in UI but doesn't save to database. Follow these steps to diagnose:

---

## 📋 Step 1: Edit a Lead

1. Open a lead detail page
2. Click the **Edit** button in Contact Information
3. Change the **firstName** (e.g., "John" → "Johnny")
4. Click **Save**

---

## 🔍 Step 2: Check Browser Console

Open browser DevTools console and look for these logs:

### ✅ Expected Success Flow:

```
🔄 Updating lead: [lead-id]
📦 Original lead data: {...}
🧹 Cleaned payload: {...}
📡 Response status: 200
✅ Lead updated successfully: {...}
```

### ❌ If You See Error:

```
❌ Error response: Database update failed - no changes were saved
```

**This means the database rejected the update!**

---

## 🖥️ Step 3: Check Server Console (CRITICAL)

Look for these server logs:

### 🎯 Key Logs to Check:

1. **Request received:**

```
🔄 PUT /api/leads/[id] - Starting update
✅ Session user: [user-id] ADMIN
📦 Update data received: { firstName: "Johnny", ... }
```

2. **Email normalization:**

```
📧 Email normalized: john@example.com
```

3. **Update payload:**

```
📝 Update payload: {
  "firstName": "Johnny",
  "lastName": "Doe",
  "email": "john@example.com",
  "updatedAt": "2025-01-XX..."
}
```

4. **MOST IMPORTANT - Update Result:**

```
📊 Update result: {
  matchedCount: 1,
  modifiedCount: 1,    👈 MUST BE 1 (not 0!)
  acknowledged: true
}
```

5. **If modifiedCount is 0:**

```
❌ CRITICAL: Lead matched but NOT modified in database!
📝 Attempted payload: {...}
📄 Current document: {...}
🔍 Detected changes: ["firstName: 'John' → 'Johnny'"]
```

6. **Verification:**

```
✅ Updated lead document retrieved: {
  id: "...",
  firstName: "Johnny",  👈 Should match your change
  email: "john@example.com"
}
✅ VERIFICATION PASSED: All changes successfully saved to database
```

---

## 🚨 Common Issues & Solutions

### Issue 1: `modifiedCount: 0` but changes detected

**Cause:** Database constraint or validation error

**Check:**

1. Look at `📄 Current document` vs `📝 Attempted payload`
2. Check if email is unique (might conflict with another lead)
3. Verify all required fields are present

**Solution:**

```bash
# Check MongoDB logs for constraint violations
# Look for: "E11000 duplicate key error"
```

### Issue 2: No server logs at all

**Cause:** Request not reaching the API

**Check:**

1. Network tab in DevTools
2. Look for the PUT request to `/api/leads/[id]`
3. Check response status code

**Solution:** Verify authentication is working

### Issue 3: `email` field not matching

**Cause:** Email case mismatch

**Current Fix:** Email is automatically lowercased

```typescript
updatePayload.email = String(updateData.email || "")
  .toLowerCase()
  .trim();
```

---

## 🧪 Quick Test Script

Run this in your browser console on the lead detail page:

```javascript
// Test update directly
const leadId = window.location.pathname.split("/").pop();
fetch(`/api/leads/${leadId}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    firstName: "TestName_" + Date.now(),
    lastName: "TestLast",
    email: "test@example.com",
    phone: "+1234567890",
    country: "USA",
    source: "test",
    status: "NEW",
  }),
})
  .then((r) => r.json())
  .then((data) => {
    console.log("✅ Update response:", data);
    if (data.error) {
      console.error("❌ Error:", data.error, data.details);
    }
  });
```

---

## 📊 What to Report Back

Please provide:

1. **Server console output** showing:
   - `📊 Update result: { modifiedCount: ? }`
   - Any error messages

2. **Browser console output** showing:
   - The response status
   - Any errors

3. **Specific test:**
   - What field did you change?
   - From what value to what value?
   - Did you see the success toast?

---

## 🔧 Current Fixes Applied

✅ Email lowercasing to match schema
✅ String trimming for all fields
✅ Verification that changes were saved
✅ Error returned if `modifiedCount = 0` with changes
✅ Detailed logging for debugging

**If you're still seeing issues, the server logs will tell us exactly what's happening!**
