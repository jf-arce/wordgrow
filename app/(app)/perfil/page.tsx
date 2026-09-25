import { requireUser } from "@/lib/auth/dal";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { Avatar } from "@/components/ui/Avatar";
import { BackLink } from "@/components/ui/BackLink";

export const metadata = { title: "Tu perfil" };

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-8">
      <BackLink href="/" label="Estudiar" className="self-start" />
      <h1 className="text-4xl font-extrabold">Tu perfil</h1>

      <div className="flex items-center gap-4">
        <Avatar firstName={user.firstName} lastName={user.lastName} image={user.image} size={64} />
        <p className="text-ink-soft">{user.email}</p>
      </div>

      <ProfileForm defaults={{ firstName: user.firstName, lastName: user.lastName }} />
    </div>
  );
}
