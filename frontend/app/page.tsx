import { redirect } from "next/navigation";

/** Public entry: always show marketing at `/marketing`, never auto-open the dashboard. */
export default function RootPage() {
  redirect("/marketing");
}
