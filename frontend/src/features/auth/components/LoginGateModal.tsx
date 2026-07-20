"use client";

import { Dialog } from "@base-ui/react/dialog";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useRef } from "react";
import { useLoginGateStore, type AuthModalView } from "@/shared/lib/loginGateStore";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

const VIEW_ORDER: Record<AuthModalView, number> = {
  login: 0,
  register: 1,
  forgot: 2,
};

const TITLES: Record<AuthModalView, string> = {
  login: "Вход в системата",
  register: "Създай профил",
  forgot: "Забравена парола",
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction >= 0 ? 56 : -56,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction >= 0 ? -56 : 56,
    opacity: 0,
  }),
};

/**
 * Global auth modal — login / register / forgot with shared left brand panel
 * and slide transitions on the right. Mounted once in `AppProviders`.
 */
export function LoginGateModal() {
  const isOpen = useLoginGateStore((s) => s.isOpen);
  const view = useLoginGateStore((s) => s.view);
  const reason = useLoginGateStore((s) => s.reason);
  const respond = useLoginGateStore((s) => s.respond);
  const setView = useLoginGateStore((s) => s.setView);
  const directionRef = useRef(0);
  const prevViewRef = useRef<AuthModalView>(view);

  function goTo(next: AuthModalView) {
    directionRef.current = VIEW_ORDER[next] - VIEW_ORDER[prevViewRef.current];
    prevViewRef.current = next;
    setView(next);
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && respond(false)}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[1090] bg-black/50 backdrop-blur-[3px] transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-0 z-[1091] flex items-center justify-center overflow-y-auto p-4 outline-none">
          <div className="grid w-full max-w-[880px] overflow-hidden rounded-[var(--radius-xl)] bg-white shadow-[0_25px_80px_rgba(0,0,0,0.28)] transition-all data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0 data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 md:max-h-[min(92vh,720px)] md:grid-cols-2">
            <div className="relative hidden min-h-[480px] items-center justify-center border-r border-black/[0.06] bg-white p-8 md:flex md:p-10">
              <div className="relative aspect-[3/2] w-full max-w-[380px]">
                <Image
                  src="/images/web/platformComunitiSection.png"
                  alt=""
                  fill
                  sizes="380px"
                  className="object-contain object-center"
                  priority
                />
              </div>
            </div>

            <div className="relative flex min-h-[480px] flex-col overflow-hidden bg-white p-6 sm:p-8">
              <Dialog.Close
                render={
                  <button
                    type="button"
                    aria-label="Затвори"
                    className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--color-text-muted)] transition-colors hover:bg-black/5 hover:text-[color:var(--color-text-primary)]"
                  >
                    <i className="bi bi-x-lg" />
                  </button>
                }
              />

              <Dialog.Title className="text-gradient-brand pr-10 font-display text-xl font-bold tracking-[-0.02em]">
                {TITLES[view]}
              </Dialog.Title>
              {view === "login" && reason ? (
                <Dialog.Description className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
                  За да {reason}, е нужно да влезете в профила си.
                </Dialog.Description>
              ) : view === "forgot" ? (
                <Dialog.Description className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
                  Въведете имейла си и ще получите линк за нова парола.
                </Dialog.Description>
              ) : view === "register" ? (
                <Dialog.Description className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
                  Създайте профил и се включете в гражданския диалог.
                </Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">Форма за вход в SmolyanVote</Dialog.Description>
              )}

              <div className="relative mt-5 min-h-0 flex-1 overflow-x-hidden overflow-y-auto pr-1">
                <AnimatePresence mode="wait" custom={directionRef.current}>
                  <motion.div
                    key={view}
                    custom={directionRef.current}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full"
                  >
                    {view === "login" && (
                      <LoginForm
                        onSuccess={() => respond(true)}
                        onForgotPassword={() => goTo("forgot")}
                        onGoToRegister={() => goTo("register")}
                      />
                    )}

                    {view === "register" && (
                      <RegisterForm onGoToLogin={() => goTo("login")} />
                    )}

                    {view === "forgot" && (
                      <ForgotPasswordForm onBackToLogin={() => goTo("login")} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
