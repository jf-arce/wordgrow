export default function FocusLayout({ children }: LayoutProps<"/">) {
  return (
    <main id="contenido" tabIndex={-1} className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 py-5 outline-none sm:px-6 sm:py-8">
      {children}
    </main>
  );
}
