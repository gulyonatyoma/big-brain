import { useEffect } from 'react'
import { supabase } from '../../../shared/api/supabaseClient'
import { clearLocalAppData } from '../../../shared/db/localDataActions'
import { useAuthStore } from '../model/authStore'

const LOCAL_USER_ID_KEY = 'big-brain-active-cloud-user-id'

async function prepareLocalDataForUser(nextUserId: string | null) {
  const previousUserId = window.localStorage.getItem(LOCAL_USER_ID_KEY)

  if (!previousUserId && !nextUserId) {
    return
  }

  if (previousUserId === nextUserId) {
    return
  }

  await clearLocalAppData()

  if (nextUserId) {
    window.localStorage.setItem(LOCAL_USER_ID_KEY, nextUserId)
  } else {
    window.localStorage.removeItem(LOCAL_USER_ID_KEY)
  }
}

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
        await prepareLocalDataForUser(null)

        if (!isMounted) {
          return
        }

        setUser(null)
        setIsAuthLoading(false)
        return
      }

      const nextUser = session?.user ?? null

      await prepareLocalDataForUser(nextUser?.id ?? null)

      if (!isMounted) {
        return
      }

      setUser(nextUser)
      setIsAuthLoading(false)
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null

      prepareLocalDataForUser(nextUser?.id ?? null)
        .then(() => {
          if (!isMounted) {
            return
          }

          setUser(nextUser)
          setIsAuthLoading(false)
        })
        .catch((error) => {
          console.warn('Failed to prepare local data for auth change', error)

          if (!isMounted) {
            return
          }

          setAuthError(
            error instanceof Error
              ? error.message
              : 'Не удалось подготовить локальные данные',
          )
          setUser(null)
          setIsAuthLoading(false)
        })
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [setAuthError, setIsAuthLoading, setUser])

  return null
}

export default AuthSessionWatcher