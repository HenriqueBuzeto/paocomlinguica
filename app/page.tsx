export default function Home() {
  return (
    <div className="flex flex-1 bg-white">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-zinc-600">
              Viso geral operacional (em construo)
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="text-sm text-zinc-600">Caixa</div>
            <div className="mt-2 text-xl font-semibold">--</div>
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="text-sm text-zinc-600">Total vendido hoje</div>
            <div className="mt-2 text-xl font-semibold">--</div>
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="text-sm text-zinc-600">Saldo atual</div>
            <div className="mt-2 text-xl font-semibold">--</div>
          </div>
        </div>
      </main>
    </div>
  );
}
