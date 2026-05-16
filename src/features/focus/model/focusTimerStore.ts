import { create } from 'zustand'

export type FocusTimerStatus = 'idle' | 'running' | 'paused' | 'finished'

type FocusTimerState = {
  selectedTaskId: string
  selectedTaskTitle: string

  durationSeconds: number
  secondsLeft: number
  elapsedSeconds: number
  status: FocusTimerStatus

  startedAt: string
  startedAtMs: number
  endsAtMs: number

  wasSessionSaved: boolean
  savedDurationSeconds: number

  setSelectedTask: (taskId: string, taskTitle: string) => void
  setDurationSeconds: (seconds: number) => void

  start: () => void
  pause: () => void
  reset: () => void
  finish: () => void
  finishEarly: () => void
  markSessionSaved: (savedDurationSeconds: number) => void

  tick: () => void
}

const DEFAULT_DURATION_SECONDS = 25 * 60

export const useFocusTimerStore = create<FocusTimerState>((set, get) => ({
  selectedTaskId: '',
  selectedTaskTitle: '',

  durationSeconds: DEFAULT_DURATION_SECONDS,
  secondsLeft: DEFAULT_DURATION_SECONDS,
  elapsedSeconds: 0,
  status: 'idle',

  startedAt: '',
  startedAtMs: 0,
  endsAtMs: 0,

  wasSessionSaved: false,
  savedDurationSeconds: 0,

  setSelectedTask: (taskId, taskTitle) => {
    const { status } = get()

    if (status === 'running') {
      return
    }

    set({
      selectedTaskId: taskId,
      selectedTaskTitle: taskTitle,
    })
  },

  setDurationSeconds: (seconds) => {
    const { status } = get()

    if (status === 'running') {
      return
    }

    set({
      durationSeconds: seconds,
      secondsLeft: seconds,
      elapsedSeconds: 0,
      status: 'idle',
      startedAt: '',
      startedAtMs: 0,
      endsAtMs: 0,
      wasSessionSaved: false,
      savedDurationSeconds: 0,
    })
  },

  start: () => {
    const { status, secondsLeft, startedAt, startedAtMs } = get()

    if (status === 'running' || secondsLeft <= 0) {
      return
    }

    const now = Date.now()

    set({
      status: 'running',
      startedAt: startedAt || new Date(now).toISOString(),
      startedAtMs: startedAtMs || now,
      endsAtMs: now + secondsLeft * 1000,
    })
  },

  pause: () => {
    const { status } = get()

    if (status !== 'running') {
      return
    }

    get().tick()

    set({
      status: 'paused',
      endsAtMs: 0,
    })
  },

  reset: () => {
    const { durationSeconds } = get()

    set({
      secondsLeft: durationSeconds,
      elapsedSeconds: 0,
      status: 'idle',
      startedAt: '',
      startedAtMs: 0,
      endsAtMs: 0,
      wasSessionSaved: false,
      savedDurationSeconds: 0,
    })
  },

  finish: () => {
    const { durationSeconds } = get()

    set({
      secondsLeft: 0,
      elapsedSeconds: durationSeconds,
      status: 'finished',
      endsAtMs: 0,
    })
  },

  finishEarly: () => {
    const { status, durationSeconds, secondsLeft } = get()

    if (status === 'idle' || status === 'finished') {
      return
    }

    get().tick()

    const actualSecondsLeft = get().secondsLeft
    const actualElapsedSeconds = Math.max(
      0,
      durationSeconds - actualSecondsLeft,
    )

    if (actualElapsedSeconds <= 0 && secondsLeft === durationSeconds) {
      return
    }

    set({
      secondsLeft: 0,
      elapsedSeconds: actualElapsedSeconds,
      status: 'finished',
      endsAtMs: 0,
    })
  },

  markSessionSaved: (savedDurationSeconds) => {
    set({
      wasSessionSaved: true,
      savedDurationSeconds,
    })
  },

  tick: () => {
    const { status, endsAtMs, durationSeconds } = get()

    if (status !== 'running' || !endsAtMs) {
      return
    }

    const secondsLeft = Math.max(0, Math.ceil((endsAtMs - Date.now()) / 1000))
    const elapsedSeconds = Math.max(0, durationSeconds - secondsLeft)

    if (secondsLeft <= 0) {
      set({
        secondsLeft: 0,
        elapsedSeconds: durationSeconds,
        status: 'finished',
        endsAtMs: 0,
      })

      return
    }

    set({
      secondsLeft,
      elapsedSeconds,
    })
  },
}))