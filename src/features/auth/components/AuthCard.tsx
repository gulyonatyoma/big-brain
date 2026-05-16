import { useState, type FormEvent } from 'react'
import { signInWithEmail, signOut, signUpWithEmail } from '../model/authActions'
import { useAuthStore } from '../model/authStore'

type AuthMode = 'sign-in' | 'sign-up'

function AuthCard() {
  const user = useAuthStore((state) => state.user)
  const isAuthLoading = useAuthStore((state) => state.isAuthLoading)
  const authError = useAuthStore((state) => state.authError)
  const setAuthError = useAuthStore((state) => state.setAuthError)
  const clearAuthError = useAuthStore((state) => state.clearAuthError)

  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      return
    }

    setIsSubmitting(true)
    setSuccessMessage('')
    clearAuthError()

    try {
      if (mode === 'sign-in') {
        await signInWithEmail({
          email: email.trim(),
          password,
        })

        setSuccessMessage('Вход выполнен.')
      } else {
        await signUpWithEmail({
          email: email.trim(),
          password,
        })

        setSuccessMessage(
          'Аккаунт создан. Если Supabase попросит подтвердить почту, открой письмо и подтверди регистрацию.',
        )
      }

      setPassword('')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Неизвестная ошибка авторизации'

      setAuthError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSignOut() {
    setIsSubmitting(true)
    clearAuthError()
    setSuccessMessage('')

    try {
      await signOut()
      setSuccessMessage('Выход выполнен.')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Не удалось выйти из аккаунта'

      setAuthError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isAuthLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <p className="font-medium text-white">Аккаунт</p>
        <p className="mt-1 text-sm text-slate-400">
          Проверяем сессию пользователя...
        </p>
      </div>
    )
  }

  if (user) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="font-medium text-white">Аккаунт</p>

            <p className="mt-1 text-sm text-slate-400">
              Ты вошёл как:
            </p>

            <p className="mt-2 break-all text-sm font-medium text-violet-200">
              {user.email}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Позже данные задач, событий, заметок и фокус-сессий будут
              синхронизироваться через этот аккаунт.
            </p>

            {successMessage ? (
              <p className="mt-3 text-sm text-emerald-200">
                {successMessage}
              </p>
            ) : null}

            {authError ? (
              <p className="mt-3 text-sm text-red-200">
                {authError}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSubmitting}
            className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Выйти
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="mb-5">
        <p className="font-medium text-white">Аккаунт</p>

        <p className="mt-1 text-sm text-slate-400">
          Войди или зарегистрируйся, чтобы позже синхронизировать данные между
          ноутбуком и телефоном.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
        <button
          type="button"
          onClick={() => {
            setMode('sign-in')
            clearAuthError()
            setSuccessMessage('')
          }}
          className={[
            'rounded-xl px-4 py-2 text-sm font-semibold transition',
            mode === 'sign-in'
              ? 'bg-violet-500 text-white'
              : 'text-slate-400 hover:bg-white/10 hover:text-white',
          ].join(' ')}
        >
          Вход
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('sign-up')
            clearAuthError()
            setSuccessMessage('')
          }}
          className={[
            'rounded-xl px-4 py-2 text-sm font-semibold transition',
            mode === 'sign-up'
              ? 'bg-violet-500 text-white'
              : 'text-slate-400 hover:bg-white/10 hover:text-white',
          ].join(' ')}
        >
          Регистрация
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm text-slate-400">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-violet-400/60"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-400">
            Пароль
          </label>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-violet-400/60"
            placeholder="Минимум 6 символов"
          />
        </div>

        {authError ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
            {authError}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            {successMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || !email.trim() || !password.trim()}
          className="w-full rounded-2xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? 'Подождите...'
            : mode === 'sign-in'
              ? 'Войти'
              : 'Создать аккаунт'}
        </button>
      </form>
    </div>
  )
}

export default AuthCard