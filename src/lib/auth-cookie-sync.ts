"use client"

import { getAuth } from 'firebase/auth'

export async function syncAuthCookie(idToken: string) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
        })

        if (!response.ok) {
            throw new Error('Failed to sync auth cookie')
        }

        return true
    } catch (error) {
        console.error('Error syncing auth cookie:', error)
        return false
    }
}

export async function clearAuthCookie() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
        })

        if (!response.ok) {
            throw new Error('Failed to clear auth cookie')
        }

        return true
    } catch (error) {
        console.error('Error clearing auth cookie:', error)
        return false
    }
}

// Helper to get fresh ID token and sync with server
export async function refreshAuthCookie() {
    const auth = getAuth()
    const user = auth.currentUser

    if (!user) {
        return false
    }

    try {
        const idToken = await user.getIdToken(true) // Force refresh
        return await syncAuthCookie(idToken)
    } catch (error) {
        console.error('Error refreshing auth cookie:', error)
        return false
    }
}
