import { sanitizeInput } from './security'

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\s+()-]{10,20}$/
  return phoneRegex.test(phone)
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' }
  }
  return { valid: true }
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function validateBookingForm(data: {
  name: string
  email: string
  phone: string
  eventType: string
  eventDate: string
  location: string
}): ValidationResult {
  const errors: Record<string, string> = {}

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters'
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address'
  }

  if (!data.phone || !validatePhone(data.phone)) {
    errors.phone = 'Please enter a valid phone number'
  }

  if (!data.eventType) {
    errors.eventType = 'Please select an event type'
  }

  if (!data.eventDate) {
    errors.eventDate = 'Please select an event date'
  } else {
    const eventDate = new Date(data.eventDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (eventDate < today) {
      errors.eventDate = 'Event date cannot be in the past'
    }
  }

  if (!data.location || data.location.trim().length < 3) {
    errors.location = 'Please enter a valid location'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

export function validateContactForm(data: {
  name: string
  email: string
  message: string
}): ValidationResult {
  const errors: Record<string, string> = {}

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters'
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address'
  }

  if (!data.message || data.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

export function validateProductForm(data: {
  title: string
  price?: number
  category: string
}): ValidationResult {
  const errors: Record<string, string> = {}

  if (!data.title || data.title.trim().length < 2) {
    errors.title = 'Title must be at least 2 characters'
  }

  if (data.price !== undefined && data.price < 0) {
    errors.price = 'Price cannot be negative'
  }

  if (!data.category) {
    errors.category = 'Please select a category'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

export function validateMusicPoolTrack(data: {
  title: string
  artist: string
  bpm?: number
}): ValidationResult {
  const errors: Record<string, string> = {}

  if (!data.title || data.title.trim().length < 1) {
    errors.title = 'Title is required'
  }

  if (!data.artist || data.artist.trim().length < 1) {
    errors.artist = 'Artist is required'
  }

  if (data.bpm !== undefined && (data.bpm < 40 || data.bpm > 300)) {
    errors.bpm = 'BPM must be between 40 and 300'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

export function sanitizeFormData<T extends Record<string, unknown>>(data: T): T {
  const sanitized = { ...data }
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      (sanitized as Record<string, unknown>)[key] = sanitizeInput(sanitized[key] as string)
    }
  }
  
  return sanitized
}

export function validateFileUpload(
  file: File,
  options: {
    maxSizeMB?: number
    allowedTypes?: string[]
  } = {}
): { valid: boolean; error?: string } {
  const { maxSizeMB = 50, allowedTypes = [] } = options

  const fileSizeMB = file.size / (1024 * 1024)
  if (fileSizeMB > maxSizeMB) {
    return { valid: false, error: `File size must be less than ${maxSizeMB}MB` }
  }

  if (allowedTypes.length > 0) {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
    const mimeType = file.type
    
    const isAllowedExt = allowedTypes.some(t => 
      t.startsWith('.') ? t.slice(1).toLowerCase() === fileExt : true
    )
    const isAllowedMime = allowedTypes.some(t => 
      !t.startsWith('.') && (mimeType.startsWith(t) || mimeType === t)
    )

    if (!isAllowedExt && !isAllowedMime) {
      return { valid: false, error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` }
    }
  }

  return { valid: true }
}
