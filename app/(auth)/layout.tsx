export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden border-r bg-white p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex size-11 items-center justify-center rounded-md bg-primary text-lg font-semibold text-primary-foreground">
              CR
            </div>
            <h1 className="mt-8 max-w-xl text-4xl font-semibold tracking-normal">
              Client Relationship & Meeting Management CRM
            </h1>
            <p className="mt-4 max-w-lg text-base text-muted-foreground">
              A clean enterprise foundation for leads, meetings, follow-ups, documents, reporting, and team performance.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {["Pipeline visibility", "Meeting discipline", "Team reporting"].map((item) => (
              <div key={item} className="rounded-lg border bg-muted/40 p-4 text-sm font-medium">
                {item}
              </div>
            ))}
          </div>
        </section>
        <section className="flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">{children}</div>
        </section>
      </div>
    </main>
  );
}
