import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

async function createInvite(formData: FormData) {
  "use server";
  const name = formData.get("name") as string;
  const token = nanoid(12);
  const userId = nanoid();

  await prisma.user.upsert({
    where: { name },
    update: {
      inviteToken: token,
      inviteExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    create: {
      id: userId,
      name,
      inviteToken: token,
      inviteExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const url = `${process.env.NEXT_PUBLIC_ORIGIN}/register?token=${token}`;
  return url;
}

export default function InvitePage() {
  return (
    <form action={createInvite}>
      <input name="name" placeholder="Family member name" required />
      <button type="submit">Generate Invite Link</button>
      {/* Show URL after submit */}
    </form>
  );
}