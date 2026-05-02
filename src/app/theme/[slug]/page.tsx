import { notFound } from "next/navigation";
import { MatchupClient } from "@/components/MatchupClient";
import { ThemePicker } from "@/components/ThemePicker";
import { isTheme, themeLabel, themeEmoji } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function ThemePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isTheme(slug)) notFound();

  return (
    <div className="flex-1 flex flex-col">
      <div className="text-center mt-4">
        <span className="pill">
          {themeEmoji(slug)} {themeLabel(slug)}
        </span>
      </div>
      <MatchupClient theme={slug} />
      <ThemePicker activeTheme={slug} />
    </div>
  );
}
