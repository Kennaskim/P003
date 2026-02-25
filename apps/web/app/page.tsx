import { redirect } from "next/navigation";

export default function Home() {
  // Automatically redirect the root URL (/) to the dashboard
  redirect("/dashboard");
}