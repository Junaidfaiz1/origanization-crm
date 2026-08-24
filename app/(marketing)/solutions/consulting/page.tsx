import { redirect } from "next/navigation";
import { MARKETING_ROUTES } from "@/lib/marketing/routes";

/** Alias — canonical consultants page lives at /solutions/consultants */
export default function ConsultingAliasPage() {
  redirect(MARKETING_ROUTES.consultants);
}
