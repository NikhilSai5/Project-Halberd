# Halberd Onboarding Implementation Plan

## Security Requirements

- Rotate the PostgreSQL password that was exposed before implementation.
- Do not use the PostgreSQL connection string or database password in frontend code.
- Use only the Supabase Project URL and anon/public key in the extension client:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Keep database credentials, service-role keys, Google OAuth secrets, and payment secrets server-side.

## 1. Add Supabase Foundation

- Install `@supabase/supabase-js`.
- Create `lib/supabase.ts` using the Supabase Project URL and anon key.
- Add environment variable documentation.
- Create Supabase tables:
  - `profiles`
  - `onboarding_preferences`
  - `subscriptions`
- Enable Row Level Security so users can access only their own records.

## 2. Create Authentication State

- Add an `AuthProvider` with:
  - Initial session loading
  - `onAuthStateChange` listener
  - `signIn`
  - `signUp`
  - `signOut`
- Use Supabase's persisted session behavior so users remain logged in after reopening the extension.
- Add loading and authentication error states.

## 3. Add Authentication Routing

- Update `App.tsx` to show a loading screen while the Supabase session is restored.
- Show Login when there is no active session.
- Show the main Home experience for authenticated users.
- Redirect already-authenticated users directly to Home.

## 4. Build the Onboarding Shell

- Add a reusable onboarding shell with:
  - Halberd branding
  - Progress indicator
  - Back button
  - Continue button
  - Minimal fade and slide transitions
  - Responsive mobile layout
- Preserve the existing Halberd visual language:
  - Warm ivory background
  - White rounded panels
  - Pale green accent
  - Inter typography
  - Soft borders and shadows

## 5. Login Page

- Add email and password fields.
- Sign in through Supabase Auth.
- Link to account creation/onboarding.
- Add forgot-password support using Supabase password reset.
- Redirect successful login to Home.

## 6. Registration Page

- Collect:
  - Name
  - Email
  - Phone number
  - Password
  - Confirm password
- Validate required fields, email format, password strength, and matching passwords.
- Create the Supabase Auth user.
- Save profile details in `profiles`.
- Handle the email-confirmation case clearly.

## 7. Discovery-Source Page

- Provide selectable channels:
  - Reddit
  - YouTube
  - Instagram
  - Google Search
  - Friend or colleague
  - Other
- Store the selection in onboarding state.
- Persist the selection to `onboarding_preferences`.

## 8. Habit Onboarding Page

- Reuse the existing habit creation patterns from `HabitTracker.tsx`.
- Let users add one or more habits with:
  - Habit name
  - Emoji
  - Color
- Keep this page focused on creation rather than showing the full tracking dashboard.
- Save selected habits through `SettingsContext` and synchronize onboarding data after completion.

## 9. Wallpaper Customization Page

- Reuse wallpaper selection and persistence behavior from `Settings.tsx`.
- Include the default wallpapers from `assets/default wallpapers/`:
  - `wallhaven-d6q21o.jpg`
  - `wallhaven-l87z7l.jpg`
  - `wallhaven-yqxzqx.jpg`
- Allow selecting a default wallpaper.
- Allow uploading a custom wallpaper.
- Set the selected wallpaper as the initial active wallpaper.
- Preserve the existing IndexedDB wallpaper persistence behavior.

## 10. Plan Selection Page

- Add plan cards:
  - Standard: Free
  - Professional: `$5/month`
- Keep Professional as a selectable `$5/month` plan for now.
- Store the selected plan in `subscriptions` or onboarding preferences.
- Defer payment processing and all external service integrations to a later implementation.

## 11. Complete Onboarding

- Mark onboarding as complete in Supabase.
- Persist the user's profile, discovery source, habits, wallpaper, and plan selections.
- Initialize local settings and habits.
- Redirect to Home.
- Prevent completed users from seeing onboarding again.
- Provide a future option to restart onboarding from Settings.

## 12. Data Synchronization

- Store authentication, profile, onboarding, and subscription data in Supabase.
- Keep extension-specific high-volume data such as wallpapers, habits, tasks, and sessions in IndexedDB/browser storage initially.
- Associate local data with the authenticated user to prevent cross-user reuse.
- Add migration/reset behavior when the active Supabase user changes.

## 13. Styling and Animation

- Reuse existing Halberd design tokens and components.
- Add subtle page transitions, hover states, wallpaper selection feedback, and validation feedback.
- Keep animation short and quiet.
- Respect `prefers-reduced-motion`.

## 14. Verification

Run:

```bash
npm install
npm run compile
npm run build
```

Test the following flows:

- New user registration through the complete onboarding flow
- Existing user login
- Session persistence after reload and browser restart
- Already-authenticated direct access to Home
- Logout returning to Login
- Password reset
- Email confirmation and error states
- Discovery-source selection
- Habit creation
- Default and custom wallpaper selection
- Standard and Professional plan selection
- Responsive desktop and mobile layouts
- Supabase loading, validation, and network-error states

## Open Decisions

1. Should Professional plan selection process payments immediately, or only save the selected plan until billing is added?
2. Should email confirmation be required before onboarding, or should users enter onboarding immediately after signup?
3. Should new users start with no habits, or should the current default habits remain enabled?
