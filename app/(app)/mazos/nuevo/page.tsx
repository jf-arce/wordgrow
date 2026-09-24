import { DeckForm } from "@/components/forms/DeckForm";
import { BackLink } from "@/components/ui/BackLink";

export const metadata = { title: "Nuevo mazo" };

export default function NewDeckPage() {
  return (
    <div className="flex flex-col gap-8">
      <BackLink href="/mazos" label="Mazos" className="self-start" />
      <h1 className="text-4xl font-extrabold">Nuevo mazo</h1>
      <DeckForm />
    </div>
  );
}
