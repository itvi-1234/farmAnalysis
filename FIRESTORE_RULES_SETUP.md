# Firestore Security Rules Setup

## Problem
You're getting "Missing or insufficient permissions" errors when trying to access the `vendors` collection.

## Solution

### Step 1: Deploy Firestore Rules

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase in your project** (if not already done):
   ```bash
   firebase init firestore
   ```
   - Select your Firebase project
   - Choose to use an existing `firestore.rules` file
   - The rules file is already created in the root directory

4. **Deploy the rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Step 2: Alternative - Set Rules in Firebase Console

If you prefer to set rules manually:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Rules** tab
4. Replace the existing rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Users collection - users can read/write their own data
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId);
    }

    // Vendors collection - vendors can read/write their own data, everyone can read
    match /vendors/{vendorId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isOwner(vendorId);
      allow update: if isAuthenticated() && isOwner(vendorId);
      allow delete: if isAuthenticated() && isOwner(vendorId);
    }

    // Fields collection - users can read/write their own fields
    match /fields/{fieldId} {
      allow read: if isAuthenticated() && isOwner(fieldId);
      allow write: if isAuthenticated() && isOwner(fieldId);
    }
  }
}
```

5. Click **Publish**

### Step 3: Verify Rules

After deploying, the permission errors should be resolved. The rules allow:
- **Vendors**: Can read all vendor profiles (to find services) and write their own profile
- **Users**: Can read/write their own user data
- **Fields**: Users can read/write their own field data

### Important Notes

- The `vendors` collection uses the user's UID as the document ID
- All authenticated users can read vendor profiles (to find services)
- Only the vendor can create/update/delete their own profile
- Make sure you're authenticated before trying to access Firestore

