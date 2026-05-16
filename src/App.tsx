function App() {
  return (
    <main className="min-h-screen px-6 py-8 text-slate-100">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <p className="mb-3 text-sm font-medium text-violet-300">
            Большой мозг
          </p>

          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            Система продуктивности и контроля активности
          </h1>

          <p className="max-w-2xl text-base leading-7 text-slate-300">
            Здесь будет главный экран приложения: задачи на сегодня, события
            календаря, быстрые заметки, фокус-таймер и статистика активности.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Сегодня</p>
            <p className="mt-2 text-2xl font-semibold">0 задач</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">События</p>
            <p className="mt-2 text-2xl font-semibold">0 событий</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Фокус</p>
            <p className="mt-2 text-2xl font-semibold">0 минут</p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App