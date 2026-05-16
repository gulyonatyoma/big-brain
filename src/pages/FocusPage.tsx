import FocusTimer from '../features/focus/components/FocusTimer'

function FocusPage() {
  return (
    <main className="min-h-screen px-6 py-8 text-slate-100">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <p className="mb-3 text-sm font-medium text-violet-300">
            Фокусировка
          </p>

          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            Фокус-таймер
          </h1>

          <p className="max-w-2xl text-base leading-7 text-slate-300">
            Здесь можно выбрать задачу, запустить фокус-сессию и сохранить
            результат в статистику активности.
          </p>
        </div>

        <FocusTimer />
      </section>
    </main>
  )
}

export default FocusPage