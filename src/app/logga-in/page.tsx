import type { Metadata } from 'next';
import { LoginForm } from './login-form';
import { LogoMark } from '@/components/logo';

export const metadata: Metadata = {
  title: 'Logga in',
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return (
    <main className="relative flex min-h-[100dvh] flex-col lg:flex-row">
      {/* Bildsidan */}
      <div className="relative hidden lg:block lg:w-[54%]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/login-bg.jpg')" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-tr from-[#14110e]/88 via-[#14110e]/55 to-[#14110e]/25"
          aria-hidden="true"
        />
        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <div className="flex items-center gap-3 text-[#E8DFD0]">
            <LogoMark className="h-8 w-8 text-[#D9A868]" />
            <span className="font-display text-lg font-semibold tracking-tight">
              Julia Stille
            </span>
          </div>

          <div className="max-w-lg">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#D9A868]">
              Din arbetsyta
            </p>
            <h1 className="mt-5 font-display text-[2.6rem] font-medium leading-[1.08] tracking-tight text-[#F4EEE4] xl:text-[3.1rem]">
              Allt om dina objekt,
              <br />
              samlat på ett ställe.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#C9BEAC]">
              Objekt, kunder, visningar, budgivning, dokument och en AI-assistent
              som kan din vardag — byggd bara för dig.
            </p>
          </div>

          <p className="text-xs tracking-wide text-[#8C8175]">
            Developed by Stilledev
          </p>
        </div>
      </div>

      {/* Formulärsidan */}
      <div className="flex flex-1 items-center justify-center bg-canvas px-6 py-14 grain">
        <div className="w-full max-w-[380px] animate-fade-up">
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            <LogoMark className="h-8 w-8 text-brass" />
            <span className="font-display text-lg font-semibold tracking-tight text-ink">
              Julia Stille
            </span>
          </div>

          <p className="eyebrow">Välkommen tillbaka</p>
          <h2 className="mt-2.5 font-display text-3xl font-medium tracking-tight text-ink">
            Logga in
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-muted">
            Ange ditt lösenord för att komma åt din arbetsyta.
          </p>

          <LoginForm next={searchParams?.next} />

          <div className="mt-10 border-t border-line pt-5">
            <p className="text-xs leading-relaxed text-faint">
              Sessionen sparas i 30 dagar i en säker kaka. Byt lösenord genom att
              ändra <code className="font-mono text-[11px]">APP_PASSWORD</code> i
              miljövariablerna.
            </p>
          </div>

          <p className="mt-8 text-center text-[11px] tracking-wide text-faint lg:hidden">
            Developed by Stilledev
          </p>
        </div>
      </div>
    </main>
  );
}
