"use client";

import { useMutation } from "@tanstack/react-query";
import { newsletterApi } from "../api";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { toast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";

/**
 * Footer newsletter (ports v1 `footer.js` newsletter form). The v1 email
 * input was decorative — `/subscription/update` always subscribes the
 * *logged-in account*, ignoring the typed address — so this hook drops it
 * and gates straight on auth, matching what the backend actually does.
 */
export function useNewsletterSubscribe() {
  const requireAuth = useRequireAuth();

  const mutation = useMutation({
    mutationFn: () => newsletterApi.subscribeToAll(),
    onSuccess: () => {
      toast.success("Успешно се абонирахте и за напред ще получавате известия на вашата поща.");
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Възникна грешка. Моля, опитайте отново."));
    },
  });

  const subscribe = async () => {
    const allowed = await requireAuth("да се абонираш за известия");
    if (!allowed) return;
    mutation.mutate();
  };

  return { subscribe, isPending: mutation.isPending, isSuccess: mutation.isSuccess };
}
