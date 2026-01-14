# Role-Based UI Visibility

## Overview
The Dr Amal Clinical OS implements visual role-based access control. This is **frontend-only** and defines what users see, not what they can do (backend permissions will enforce that later).

## Roles

### 1. Healthcare Provider (default)
**Visible in Sidebar:**
- Overview
- Schedule  
- Patient Registry
- Live Sessions
- Clinical Notes
- Prescriptions
- Lab Results
- Medical Imaging
- Referrals

**Header Elements:**
- Search bar (for patients/sessions)
- Notifications bell (with badge)
- Profile menu

**Overview Page:**
- Full KPI dashboard with 7 stat cards
- Clinical performance metrics

### 2. Admin
**Visible in Sidebar:**
- Overview (read-only)
- Admin Panel
- Audit Logs
- Settings

**Header Elements:**
- Admin Menu button
- Profile menu

**Overview Page:**
- Full KPI dashboard (read-only)
- Blue "Read-Only" banner at top

### 3. Parent / Caregiver
**Visible in Sidebar:**
- Overview only

**Header Elements:**
- Profile menu only

**Overview Page:**
- Limited placeholder view
- 2 cards: Upcoming Appointments, Family Members

## Page Access Control

### Clinical Pages (Provider only)
Pages that show **RestrictedState** for non-providers:
- `/schedule`
- `/patients`
- `/sessions`
- `/notes`
- `/prescriptions`
- `/labs`
- `/imaging`
- `/referrals`

### Admin Pages (Admin only)
Pages that show **RestrictedState** for non-admins:
- `/admin`
- `/audit`
- `/settings`

### Shared Pages
- `/overview` - All roles can access, but see different content

## Visual States

### Restricted State
Shown when user tries to access unauthorized page:
- Lock icon
- Message: "This section is available to authorized clinical staff only."
- Calm, professional tone - no harsh "Access Denied"

### Read-Only State
Blue banner shown at top of page when Admin views provider content:
- Info icon
- Message: "You are viewing this page in read-only mode"

## Development Testing

Use the **Role Switcher** widget (bottom-right corner) to test different roles:
- Healthcare Provider
- Admin  
- Parent / Caregiver

The switcher is visible in development only and allows instant role switching without page reload.

## Implementation Files

### Core Components
- `/src/contexts/RoleContext.tsx` - Role state management
- `/src/hooks/useRoleAccess.ts` - Role access helper hook
- `/src/components/providers/ClientProviders.tsx` - App-wide provider wrapper

### Layout Components
- `/src/components/layout/Sidebar.tsx` - Role-filtered navigation
- `/src/components/layout/Header.tsx` - Role-based header variants
- `/src/components/layout/AppShell.tsx` - Main layout wrapper

### State Components
- `/src/components/states/RestrictedState.tsx` - Unauthorized access UI
- `/src/components/states/ReadOnlyBanner.tsx` - Read-only indicator

### Development Tools
- `/src/components/dev/RoleSwitcher.tsx` - Role testing widget

## Design Principles

✅ **Calm & Professional** - Medical-grade UI, no harsh warnings
✅ **Consistent** - Same patterns across all pages  
✅ **Clear** - Users always know why they can't access something
✅ **Static** - No redirects, no route guards, just visual hiding
✅ **Truthful** - UI accurately reflects what exists for each role

## Backend Integration (Future)

When backend is added:
1. Replace `useState` in RoleContext with real auth state
2. Add API calls to verify permissions
3. Keep visual states exactly as they are
4. Backend enforces, frontend visualizes
