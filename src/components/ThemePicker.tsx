import Link from "next/link";
import { THEMES, themeLabel, themeEmoji } from "@/lib/theme";

export function ThemePicker({ activeTheme }: { activeTheme?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-3 max-w-3xl mx-auto">
      <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted mr-1">
        Themes
      </span>
      {THEMES.map((t) => {
        const active = activeTheme === t;
        return (
          <Link
            key={t}
            href={`/theme/${t}`}
            className={`text-[10px] uppercase tracking-[0.18em] font-semibold px-3 py-1 rounded-full border transition-colors ${
              active
                ? "bg-accent/10 text-accent border-accent/40"
                : "bg-panel border-line text-muted hover:text-accent hover:border-accent/30"
            }`}
          >
            {themeEmoji(t)} {themeLabel(t)}
          </Link>
        );
      })}
    </div>
  );
}
