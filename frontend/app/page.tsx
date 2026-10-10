import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const cookieStore = await cookies();
  const hasDemoAuth = cookieStore.get("demo_auth")?.value === "1";
  redirect(hasDemoAuth ? "/dashboard" : "/login");
}
