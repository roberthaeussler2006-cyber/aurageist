import Link from "next/link";
import { CHARLI_KIRK_IMG } from "@/lib/kirk";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16 text-center">
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={CHARLI_KIRK_IMG}
          alt="CHARLI"
          className="h-48 w-48 sm:h-64 sm:w-64 rounded-full object-cover ring-8 ring-amber-400 shadow-[0_0_60px_rgba(244,114,182,0.5)] mx-auto mb-8"
        />
        <h1 className="text-7xl sm:text-9xl font-black text-gradient">404</h1>
        <p className="mt-4 text-2xl sm:text-3xl font-bold">you got lost</p>
        <p className="mt-1 text-sm uppercase tracking-[0.25em] font-bold text-muted">
          but CHARLI sees you
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link href="/" className="btn-gradient inline-block px-6 py-3 text-xs uppercase">
            back to voting
          </Link>
          <Link
            href="/kirk"
            className="px-6 py-3 rounded-full text-xs uppercase tracking-[0.18em] font-bold bg-foreground text-background hover:bg-foreground/85 transition-all"
          >
            visit the shrine
          </Link>
        </div>
      </div>
    </div>
  );
}
