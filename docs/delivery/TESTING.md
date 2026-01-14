# Testing Checklist

## ✅ Manual Testing Guide

Use this checklist to verify all features are working correctly.

---

## Setup

- [x] Development server running at http://localhost:3002
- [x] No build errors
- [x] No console errors
- [x] Browser opened to application

---

## Visual Testing

### Initial Load
- [ ] Page loads at http://localhost:3002
- [ ] Redirects to /auth/signin automatically
- [ ] Background is light gray (#F7F8FA)
- [ ] Card is centered on screen
- [ ] Card has white background
- [ ] Card has subtle shadow
- [ ] Card has rounded corners (16px)

### Header
- [ ] Title reads "Pediatric Clinical Portal"
- [ ] Subtitle reads "Secure access to clinical care systems"
- [ ] Text is centered
- [ ] Title is larger and bold
- [ ] Subtitle is smaller and gray

### Tabs
- [ ] Two tabs visible: "Sign In" and "Sign Up"
- [ ] Tabs have pill shape
- [ ] "Sign In" tab is active (white background)
- [ ] "Sign Up" tab is inactive (transparent)
- [ ] Clicking tabs switches between forms

### Footer
- [ ] Footer text reads "Dr Amal Clinical OS v2.0 © 2026"
- [ ] Text is small and gray
- [ ] Text is centered

---

## Sign In Form Testing

### Initial State
- [ ] Email input is visible
- [ ] Password input is visible
- [ ] "Forgot password?" link is visible
- [ ] "Sign In" button is visible
- [ ] Button has gradient (blue to purple)
- [ ] All fields are empty
- [ ] No error messages visible

### Email Field
- [ ] Label reads "Email"
- [ ] Placeholder shows "you@example.com"
- [ ] Typing updates the value
- [ ] Border is gray when idle
- [ ] Border is blue when focused

### Password Field
- [ ] Label reads "Password"
- [ ] Placeholder shows "Enter your password"
- [ ] Input is masked (dots/asterisks)
- [ ] Eye icon is visible on the right
- [ ] Clicking eye icon reveals password
- [ ] Clicking again hides password
- [ ] Icon changes between eye/eye-off

### Forgot Password
- [ ] Text is small and blue
- [ ] Aligned to the right
- [ ] Clicking shows alert (demo)
- [ ] Alert explains reset flow

### Validation - Empty Submit
1. [ ] Click "Sign In" without filling fields
2. [ ] Email shows "Email is required" error
3. [ ] Password shows "Password is required" error
4. [ ] Error text is red
5. [ ] Input borders turn red
6. [ ] Button doesn't submit

### Validation - Invalid Email
1. [ ] Type "notanemail" in email field
2. [ ] Type "password123" in password field
3. [ ] Click "Sign In"
4. [ ] Email shows "Please enter a valid email address"
5. [ ] Password error is cleared

### Validation - Valid Data
1. [ ] Type "test@example.com" in email
2. [ ] Type "password123" in password
3. [ ] No errors visible
4. [ ] Click "Sign In"

### Loading State
1. [ ] Button changes to show spinner
2. [ ] Button text changes to "Processing..."
3. [ ] Button is disabled (can't click again)
4. [ ] Email input is disabled
5. [ ] Password input is disabled
6. [ ] Loading lasts ~1.5 seconds

### Error State
1. [ ] After loading, red alert appears
2. [ ] Alert reads "Invalid email or password. Please try again."
3. [ ] Inputs are re-enabled
4. [ ] Button is re-enabled
5. [ ] Can type and retry

### Error Clearing
1. [ ] With error visible on a field
2. [ ] Start typing in that field
3. [ ] Error disappears immediately
4. [ ] Border returns to normal

---

## Sign Up Form Testing

### Switch to Sign Up
- [ ] Click "Sign Up" tab
- [ ] Tab becomes active (white)
- [ ] "Sign In" tab becomes inactive
- [ ] Sign In form disappears
- [ ] Sign Up form appears
- [ ] Form has all 7 fields visible

### Fields Present
- [ ] First Name input
- [ ] Last Name input
- [ ] Role dropdown
- [ ] Phone Number input
- [ ] Email input
- [ ] Password input
- [ ] Confirm Password input
- [ ] "Create Account" button

### First/Last Name Layout
- [ ] First and Last name are side-by-side
- [ ] Equal width
- [ ] Aligned properly

### Role Dropdown
- [ ] Default shows "Select role"
- [ ] Clicking opens dropdown
- [ ] Two options visible:
  - [ ] "Parent / Caregiver"
  - [ ] "Healthcare Provider"
- [ ] Can select an option
- [ ] Selected value shows in dropdown

### Role-Based Messaging - Parent
1. [ ] Select "Parent / Caregiver"
2. [ ] Blue info alert appears
3. [ ] Message: "Your account will be pending verification after registration."
4. [ ] Alert is above the form fields

### Role-Based Messaging - Provider
1. [ ] Select "Healthcare Provider"
2. [ ] Blue info alert appears
3. [ ] Message: "Healthcare Provider accounts require administrator approval before activation."
4. [ ] Message is clear and professional

### Password Strength Indicator - Weak
1. [ ] Type "pass" in password field
2. [ ] Progress bar appears below input
3. [ ] Bar is red
4. [ ] Bar is ~33% width
5. [ ] Text shows "Password strength: weak"

### Password Strength Indicator - Medium
1. [ ] Type "password123" in password field
2. [ ] Progress bar turns amber
3. [ ] Bar is ~66% width
4. [ ] Text shows "Password strength: medium"

### Password Strength Indicator - Strong
1. [ ] Type "MyP@ssw0rd123!" in password field
2. [ ] Progress bar turns green
3. [ ] Bar is 100% width
4. [ ] Text shows "Password strength: strong"
5. [ ] Transition is smooth

### Validation - Empty Submit
1. [ ] Leave all fields empty
2. [ ] Click "Create Account"
3. [ ] All fields show error messages:
   - [ ] "First name is required"
   - [ ] "Last name is required"
   - [ ] "Please select a role"
   - [ ] "Phone number is required"
   - [ ] "Email is required"
   - [ ] "Password is required"
   - [ ] "Please confirm your password"

### Validation - Email Format
1. [ ] Fill all fields except email
2. [ ] Type "bademail" in email
3. [ ] Submit form
4. [ ] Email shows "Please enter a valid email address"

### Validation - Phone Format
1. [ ] Fill all fields except phone
2. [ ] Type "abc" in phone
3. [ ] Submit form
4. [ ] Phone shows "Please enter a valid phone number"

### Validation - Password Length
1. [ ] Fill all fields except password
2. [ ] Type "short" in password (less than 8)
3. [ ] Submit form
4. [ ] Password shows "Password must be at least 8 characters"

### Validation - Password Match
1. [ ] Fill all fields
2. [ ] Type "password123" in password
3. [ ] Type "password456" in confirm password
4. [ ] Submit form
5. [ ] Confirm password shows "Passwords do not match"

### Valid Submission
1. [ ] Fill all fields correctly:
   - First Name: "John"
   - Last Name: "Doe"
   - Role: "Healthcare Provider"
   - Phone: "+1 (555) 123-4567"
   - Email: "john@example.com"
   - Password: "MyP@ssw0rd123!"
   - Confirm Password: "MyP@ssw0rd123!"
2. [ ] Click "Create Account"
3. [ ] Button shows loading spinner
4. [ ] Button text: "Processing..."
5. [ ] All inputs disabled
6. [ ] Loading lasts ~2 seconds
7. [ ] Form re-enables (demo mode)

### Real-Time Validation
1. [ ] Submit form with errors
2. [ ] Start typing in any field
3. [ ] Error for that field clears
4. [ ] Other errors remain
5. [ ] Can fix one field at a time

---

## Responsive Design

### Desktop (1200px+)
- [ ] Card is centered
- [ ] Max width ~400-500px
- [ ] Plenty of padding around card
- [ ] All elements properly spaced

### Tablet (768px - 1199px)
- [ ] Card still centered
- [ ] Margins reduce slightly
- [ ] Form remains readable

### Mobile (< 768px)
- [ ] Card takes most of width
- [ ] Small padding on sides
- [ ] First/Last name stack vertically (check)
- [ ] All inputs full width
- [ ] Text remains readable
- [ ] Buttons full width

---

## Accessibility

### Keyboard Navigation
- [ ] Can tab through all inputs
- [ ] Can tab to buttons
- [ ] Can tab to links
- [ ] Tab order is logical (top to bottom)
- [ ] Enter submits form
- [ ] Space toggles dropdowns
- [ ] Escape closes dropdowns

### Labels
- [ ] All inputs have visible labels
- [ ] Labels are associated with inputs
- [ ] Clicking label focuses input

### Focus States
- [ ] Focused inputs have blue ring
- [ ] Focused buttons have visible outline
- [ ] Focus is always visible
- [ ] Focus order makes sense

### Error Messages
- [ ] Errors are announced (screen reader)
- [ ] Errors are associated with fields
- [ ] Errors are clear and actionable

---

## Performance

### Load Time
- [ ] Initial page loads in < 2 seconds
- [ ] Images load quickly (if any)
- [ ] No layout shift during load

### Interactions
- [ ] Tab switching is instant
- [ ] Typing in inputs has no lag
- [ ] Button clicks respond immediately
- [ ] Validation feedback is instant
- [ ] Animations are smooth (60fps)

### Network
- [ ] Page works offline (after initial load)
- [ ] No unnecessary network requests
- [ ] Assets are cached properly

---

## Browser Compatibility

Test in multiple browsers:

### Chrome/Edge
- [ ] All features work
- [ ] Design matches expected
- [ ] No console errors

### Firefox
- [ ] All features work
- [ ] Design matches expected
- [ ] No console errors

### Safari
- [ ] All features work
- [ ] Design matches expected
- [ ] No console errors

---

## Edge Cases

### Long Inputs
1. [ ] Type very long email (50+ chars)
2. [ ] Type very long name (50+ chars)
3. [ ] Check that inputs don't break layout
4. [ ] Check that text doesn't overflow

### Special Characters
1. [ ] Type special chars in name: "O'Brien"
2. [ ] Type accents: "José"
3. [ ] Type emoji: "😀"
4. [ ] Check validation handles correctly

### Copy/Paste
1. [ ] Copy/paste into email field
2. [ ] Copy/paste into password field
3. [ ] Copy/paste with leading/trailing spaces
4. [ ] Check validation still works

### Multiple Rapid Clicks
1. [ ] Click "Sign In" button rapidly
2. [ ] Check that only one submission occurs
3. [ ] Check button stays disabled during load

### Tab Switching During Load
1. [ ] Submit Sign In form (loading state)
2. [ ] Immediately click "Sign Up" tab
3. [ ] Check no errors occur
4. [ ] Check state is clean

---

## Visual Consistency

### Colors
- [ ] All blues are consistent
- [ ] All grays are consistent
- [ ] Gradient is smooth
- [ ] Error reds match
- [ ] Success greens match

### Spacing
- [ ] Consistent padding in inputs
- [ ] Consistent gaps between fields
- [ ] Consistent card padding
- [ ] Consistent button sizing

### Typography
- [ ] Font sizes are consistent
- [ ] Font weights are consistent
- [ ] Line heights are comfortable
- [ ] Text is readable

### Shadows
- [ ] Card shadow is subtle
- [ ] Button shadow is appropriate
- [ ] No harsh/distracting shadows

---

## Production Readiness

### Code Quality
- [ ] No console.log statements
- [ ] No TODO comments
- [ ] No unused imports
- [ ] No unused variables
- [ ] TypeScript has no errors

### Build
- [ ] `npm run build` succeeds
- [ ] No build warnings
- [ ] Bundle size is reasonable

### Security
- [ ] Passwords are masked by default
- [ ] No sensitive data in URLs
- [ ] No XSS vulnerabilities (basic check)

---

## Final Checks

- [ ] All features from requirements are present
- [ ] Design matches "clinical, not consumer" philosophy
- [ ] No "startup vibes" or playful elements
- [ ] Professional and trustworthy appearance
- [ ] Code is clean and maintainable
- [ ] Documentation is complete
- [ ] Ready for backend integration

---

**Testing Status**: ___/200+ checks

**Issues Found**: _______________________________

**Severity**: [ ] Critical [ ] High [ ] Medium [ ] Low

**Notes**: _______________________________________

_______________________________________________

_______________________________________________

---

**Tester**: ________________  **Date**: __________

**Sign-off**: ☐ Approved for production
