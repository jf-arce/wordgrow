import Link from "next/link";

export const metadata = { title: "No encontrado" };

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-start justify-center gap-4 px-4">
      <h1 className="text-3xl font-extrabold">No encontramos esa página</h1>
      <p className="text-ink-soft">Puede que el link esté roto o que el mazo ya no exista.</p>
      <Link href="/" className="btn btn-primary">
        Volver a Estudiar
      </Link>
    </div>
  );
}
