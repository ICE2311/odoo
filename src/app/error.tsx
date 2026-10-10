'use client';
export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
      <p className="text-muted-foreground mb-8">{error.message || 'An unexpected error occurred.'}</p>
      <button onClick={() => reset()} className="bg-primary text-primary-foreground px-4 py-2 rounded-[var(--radius-md)]">Try again</button>
    </div>
  );
}
