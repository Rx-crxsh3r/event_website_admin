import { useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

// One of: 'checking' (initial load / re-checking a new sign-in),
// 'signedOut', 'unauthorized' (signed in but not super_admin - always
// signed back out immediately, never rendered), 'authorized'.
export type AuthStatus = 'checking' | 'signedOut' | 'unauthorized' | 'authorized'

interface State {
  status: AuthStatus
  user: User | null
}

/**
 * Gates the whole site on role === 'super_admin'. This is UX only - every
 * Cloud Function the site calls re-checks the same thing server-side
 * (functions/src/superAdmin.ts's requireSuperAdmin), since Firestore
 * rules make role: 'super_admin' un-settable by any client in the first
 * place. This hook's job is just to never flash admin content at anyone
 * who isn't, and to sign out non-super-admin accounts immediately.
 */
export function useSuperAdminAuth() {
  const [state, setState] = useState<State>({ status: 'checking', user: null })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ status: 'signedOut', user: null })
        return
      }

      setState({ status: 'checking', user })

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        const role = userDoc.exists() ? userDoc.data().role : null

        if (role !== 'super_admin') {
          await firebaseSignOut(auth)
          setState({ status: 'unauthorized', user: null })
          return
        }

        setState({ status: 'authorized', user })
      } catch {
        await firebaseSignOut(auth)
        setState({ status: 'unauthorized', user: null })
      }
    })

    return unsubscribe
  }, [])

  async function signIn(email: string, password: string) {
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch {
      setError('Invalid email or password.')
    }
  }

  async function signOut() {
    await firebaseSignOut(auth)
  }

  return { ...state, error, signIn, signOut }
}
