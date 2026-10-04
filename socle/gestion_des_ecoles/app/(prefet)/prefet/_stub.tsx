export default function PrefetStub({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-8">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <p className="mt-2 text-muted-foreground max-w-xl">{text}</p>
      <p className="mt-6 text-sm font-medium text-primary">Module en cours de branchement (Lot C).</p>
    </div>
  );
}
