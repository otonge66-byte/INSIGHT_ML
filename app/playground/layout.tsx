import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Playground layout — enforces authentication on all /playground/* routes.
 * Uses server-side auth() instead of route-matcher middleware (Clerk best practice).
 */
export default async function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return <>{children}</>;
}
