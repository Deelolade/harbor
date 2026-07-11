export default function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-lg font-semibold text-zinc-400">{title}</h1>
        <p className="mt-2 text-sm text-zinc-600">Coming soon.</p>
      </div>
    </div>
  );
}
