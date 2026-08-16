export default function PrefetStub({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-white border border-[#D7E2F5] p-8">
      <h1 className="text-2xl font-bold text-[#12203A]">{title}</h1>
      <p className="mt-2 text-[#5B6B86] max-w-xl">{text}</p>
      <p className="mt-6 text-sm font-medium text-[#1A5FD4]">Module en cours de branchement (Lot C).</p>
    </div>
  );
}
