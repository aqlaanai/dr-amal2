# Component Architecture

## Visual Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│ app/layout.tsx (Root Layout)                                    │
│ - Loads globals.css                                             │
│ - Sets metadata                                                 │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ app/page.tsx (Home)                                        │ │
│  │ - Redirects to /auth/signin                                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ app/auth/signin/page.tsx (Auth Page)                       │ │
│  │ - Tab state management                                     │ │
│  │                                                            │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │ AuthLayout                                           │  │ │
│  │  │ - Background (clinical-bg)                           │  │ │
│  │  │ - Centered container                                 │  │ │
│  │  │                                                       │  │ │
│  │  │  ┌───────────────────────────────────────────────┐   │  │ │
│  │  │  │ Header                                         │   │  │ │
│  │  │  │ - "Pediatric Clinical Portal"                  │   │  │ │
│  │  │  │ - "Secure access..."                           │   │  │ │
│  │  │  └───────────────────────────────────────────────┘   │  │ │
│  │  │                                                       │  │ │
│  │  │  ┌───────────────────────────────────────────────┐   │  │ │
│  │  │  │ Card                                           │   │  │ │
│  │  │  │                                                │   │  │ │
│  │  │  │  ┌─────────────────────────────────────────┐  │   │  │ │
│  │  │  │  │ Tabs                                     │  │   │  │ │
│  │  │  │  │ - Sign In                                │  │   │  │ │
│  │  │  │  │ - Sign Up                                │  │   │  │ │
│  │  │  │  └─────────────────────────────────────────┘  │   │  │ │
│  │  │  │                                                │   │  │ │
│  │  │  │  ┌─────────────────────────────────────────┐  │   │  │ │
│  │  │  │  │ IF activeTab === 'signin':               │  │   │  │ │
│  │  │  │  │                                           │  │   │  │ │
│  │  │  │  │  SignInForm                              │  │   │  │ │
│  │  │  │  │  - Alert (if error/locked)               │  │   │  │ │
│  │  │  │  │  - Input (email)                         │  │   │  │ │
│  │  │  │  │  - Input (password with toggle)          │  │   │  │ │
│  │  │  │  │  - Forgot password link                  │  │   │  │ │
│  │  │  │  │  - Button (Sign In)                      │  │   │  │ │
│  │  │  │  └─────────────────────────────────────────┘  │   │  │ │
│  │  │  │                                                │   │  │ │
│  │  │  │  ┌─────────────────────────────────────────┐  │   │  │ │
│  │  │  │  │ IF activeTab === 'signup':               │  │   │  │ │
│  │  │  │  │                                           │  │   │  │ │
│  │  │  │  │  SignUpForm                              │  │   │  │ │
│  │  │  │  │  - Alert (role-based message)            │  │   │  │ │
│  │  │  │  │  - Input (firstName)                     │  │   │  │ │
│  │  │  │  │  - Input (lastName)                      │  │   │  │ │
│  │  │  │  │  - Select (role)                         │  │   │  │ │
│  │  │  │  │  - Input (phone)                         │  │   │  │ │
│  │  │  │  │  - Input (email)                         │  │   │  │ │
│  │  │  │  │  - Input (password + strength bar)       │  │   │  │ │
│  │  │  │  │  - Input (confirmPassword)               │  │   │  │ │
│  │  │  │  │  - Button (Create Account)               │  │   │  │ │
│  │  │  │  └─────────────────────────────────────────┘  │   │  │ │
│  │  │  │                                                │   │  │ │
│  │  │  └───────────────────────────────────────────────┘   │  │ │
│  │  │                                                       │  │ │
│  │  │  ┌───────────────────────────────────────────────┐   │  │ │
│  │  │  │ Footer                                         │   │  │ │
│  │  │  │ - "Dr Amal Clinical OS v2.0 © 2026"           │   │  │ │
│  │  │  └───────────────────────────────────────────────┘   │  │ │
│  │  │                                                       │  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  │                                                            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Sign In Flow

```
User Action: Types email
    ↓
handleChange() called
    ↓
formData state updates
    ↓
If error exists for 'email', clear it
    ↓
Re-render with new value

User Action: Clicks "Sign In"
    ↓
handleSubmit(e) called
    ↓
e.preventDefault()
    ↓
validateForm() runs
    ↓
    ├─ If invalid: setErrors(), return
    └─ If valid: setAuthState('loading')
        ↓
    Simulate API call (setTimeout)
        ↓
        ├─ Success: redirect to /overview
        └─ Error: setAuthState('error'), show Alert
```

### Sign Up Flow

```
User Action: Selects role
    ↓
handleChange() called
    ↓
formData.role updates
    ↓
getVerificationMessage() recalculates
    ↓
Alert component shows appropriate message
    ↓
Re-render

User Action: Types password
    ↓
handleChange() called
    ↓
formData.password updates
    ↓
calculatePasswordStrength() runs
    ↓
setPasswordStrength(result)
    ↓
Progress bar updates (color + width)
    ↓
Re-render

User Action: Clicks "Create Account"
    ↓
handleSubmit(e) called
    ↓
validateForm() checks all 7 fields
    ↓
    ├─ If any invalid: setErrors(), return
    └─ If all valid: setIsLoading(true)
        ↓
    Simulate API call
        ↓
    Log data (demo)
        ↓
    setIsLoading(false)
```

---

## Component Dependencies

```
SignInForm
├── Input (email)
├── Input (password)
├── Button (submit)
└── Alert (conditional)

SignUpForm
├── Input (firstName)
├── Input (lastName)
├── Select (role)
├── Input (phone)
├── Input (email)
├── Input (password)
├── Input (confirmPassword)
├── Button (submit)
└── Alert (conditional)

Input
└── EyeIcon / EyeOffIcon (if type="password")

Button
└── LoadingSpinner (if loading)

AuthLayout
└── Card
```

---

## State Management

### Page Level (app/auth/signin/page.tsx)

```typescript
const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin')
```

**Purpose**: Controls which form is visible

### SignInForm Component

```typescript
const [formData, setFormData] = useState({
  email: '',
  password: '',
})

const [errors, setErrors] = useState({})

const [authState, setAuthState] = useState<'idle' | 'loading' | 'error' | 'locked'>('idle')

const [errorMessage, setErrorMessage] = useState('')
```

**Purpose**:
- `formData` - Form values
- `errors` - Field-level validation errors
- `authState` - Overall auth state
- `errorMessage` - Server/general error message

### SignUpForm Component

```typescript
const [formData, setFormData] = useState({
  firstName: '',
  lastName: '',
  role: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const [errors, setErrors] = useState({})

const [isLoading, setIsLoading] = useState(false)

const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null)
```

**Purpose**:
- `formData` - All 7 form field values
- `errors` - Field-level validation errors
- `isLoading` - Submit in progress
- `passwordStrength` - Password strength indicator value

---

## Event Handlers

### Common Pattern

```typescript
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target
  
  // Update form data
  setFormData(prev => ({ ...prev, [name]: value }))
  
  // Clear error for this field
  if (errors[name]) {
    setErrors(prev => ({ ...prev, [name]: undefined }))
  }
  
  // Special logic (e.g., password strength)
  if (name === 'password') {
    setPasswordStrength(calculatePasswordStrength(value))
  }
}

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // Validate
  if (!validateForm()) return
  
  // Set loading
  setIsLoading(true)
  
  // API call (simulated)
  // ...
  
  // Reset loading
  setIsLoading(false)
}
```

---

## Validation Logic

### Email Validation

```typescript
if (!formData.email.trim()) {
  newErrors.email = 'Email is required'
} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
  newErrors.email = 'Please enter a valid email address'
}
```

### Password Validation

```typescript
if (!formData.password) {
  newErrors.password = 'Password is required'
} else if (formData.password.length < 8) {
  newErrors.password = 'Password must be at least 8 characters'
}
```

### Password Match Validation

```typescript
if (!formData.confirmPassword) {
  newErrors.confirmPassword = 'Please confirm your password'
} else if (formData.password !== formData.confirmPassword) {
  newErrors.confirmPassword = 'Passwords do not match'
}
```

### Phone Validation

```typescript
if (!formData.phone.trim()) {
  newErrors.phone = 'Phone number is required'
} else if (!/^\+?[\d\s\-()]+$/.test(formData.phone)) {
  newErrors.phone = 'Please enter a valid phone number'
}
```

---

## Styling Architecture

### Tailwind Config → Components → Pages

```
tailwind.config.ts
  └── Defines clinical.* colors
      └── globals.css
          └── Applies to <body>
              └── Components use via className
                  └── Page assembles components
```

### Example: Button Gradient

```typescript
// tailwind.config.ts
colors: {
  clinical: {
    blue: { 600: '#2563EB', 700: '#1D4ED8' },
    purple: { 600: '#7C3AED', 700: '#6D28D9' }
  }
}

// globals.css
.gradient-button {
  @apply bg-gradient-to-r from-clinical-blue-600 to-clinical-purple-600;
  @apply hover:from-clinical-blue-700 hover:to-clinical-purple-700;
}

// Button.tsx
variant === 'primary' && 'gradient-button'

// SignInForm.tsx
<Button variant="primary">Sign In</Button>
```

---

## Extension Points

### To add a new field to Sign Up:

1. **Update FormData interface** (line ~15)
   ```typescript
   interface FormData {
     // ... existing fields
     newField: string
   }
   ```

2. **Update FormErrors interface** (line ~25)
   ```typescript
   interface FormErrors {
     // ... existing fields
     newField?: string
   }
   ```

3. **Update initial state** (line ~35)
   ```typescript
   const [formData, setFormData] = useState({
     // ... existing fields
     newField: '',
   })
   ```

4. **Add validation** (line ~60, in validateForm)
   ```typescript
   if (!formData.newField.trim()) {
     newErrors.newField = 'New field is required'
   }
   ```

5. **Add input to JSX** (line ~200)
   ```typescript
   <Input
     label="New Field"
     name="newField"
     value={formData.newField}
     onChange={handleChange}
     error={errors.newField}
   />
   ```

---

**This architecture ensures:**
- ✅ Clear separation of concerns
- ✅ Predictable data flow
- ✅ Easy to extend
- ✅ Type-safe
- ✅ Maintainable
