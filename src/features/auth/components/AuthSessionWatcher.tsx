import { useEffect } from 'react'
import { supabase } from '../../../shared/api/supabaseClient'
import { useAuthStore } from '../model/authStore'

function AuthSessionWatcher() {
  const setUser = useAuthStore((state) => state.setUser)
  const setIsAuthLoading = useAuthStore((state) => state.setIsAuthLoading)
  const setAuthError = useAuthStore((state) => state.setAuthError)

  useEffect(() => {
    let isMounted = true

    async function loadSession() {
      setIsAuthLoading(true)

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      if (error) {
        setAuthError(error.message)
        setUser(null)
        setIsAuthLoading(false)
        return
      }

      setUser(session?.user ?? null)
      setIsAuthLoading(false)
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsAuthLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [setAuthError, setIsAuthLoading, setUser])

  return null
}

export default AuthSessionWatcher