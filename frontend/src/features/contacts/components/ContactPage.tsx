import Link from "next/link";
import { ContactForm } from "./ContactForm";

/** v1 `contacts_page.html` parity — hero background image + centered card. */
export function ContactPage() {
  return (
    <section
      className="relative flex min-h-[calc(100vh-var(--navbar-height))] items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-24"
      style={{ backgroundImage: "url('/images/web/contacts.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative w-full max-w-md rounded-[var(--radius-lg)] bg-white p-6 shadow-[var(--shadow-lg)] sm:p-8">
        <h1 className="text-center text-2xl font-bold text-[color:var(--color-text-heading)]">
          Свържете се с нас
        </h1>

        <div className="mt-6">
          <ContactForm />
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-primary hover:underline">
            Върни се към началната страница
          </Link>
        </div>
      </div>
    </section>
  );
}
