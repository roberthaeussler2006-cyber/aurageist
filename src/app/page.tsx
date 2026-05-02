import { MatchupClient } from "@/components/MatchupClient";
import { ThemePicker } from "@/components/ThemePicker";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      <MatchupClient category="historical" />
      <ThemePicker />
    </div>
  );
}
