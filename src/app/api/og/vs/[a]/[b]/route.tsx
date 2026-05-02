import { ImageResponse } from "next/og";
import { getServerSupabase } from "@/lib/supabase";
import type { Figure } from "@/lib/types";

export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ a: string; b: string }> },
) {
  const { a: slugA, b: slugB } = await params;
  const supabase = getServerSupabase();
  const { data: figs } = await supabase
    .from("figures")
    .select("name, wiki_slug, image_url, elo")
    .in("wiki_slug", [slugA, slugB]);

  const list = (figs ?? []) as Pick<Figure, "name" | "wiki_slug" | "image_url" | "elo">[];
  const a = list.find((f) => f.wiki_slug === slugA);
  const b = list.find((f) => f.wiki_slug === slugB);

  if (!a || !b) {
    return new ImageResponse(
      (
        <div
          style={{
            width: WIDTH,
            height: HEIGHT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0d0b08",
            color: "#f5e9d7",
            fontSize: 64,
          }}
        >
          Aurageist
        </div>
      ),
      { width: WIDTH, height: HEIGHT },
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #fff7ed 0%, #fce7f3 50%, #fef3c7 100%)",
          padding: 48,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#9a3412",
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          <span>Aurageist</span>
          <span>who has more aura?</span>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "space-between",
            gap: 32,
            marginTop: 24,
          }}
        >
          <FigurePanel figure={a} side="left" />
          <div
            style={{
              fontSize: 140,
              fontStyle: "italic",
              fontWeight: 800,
              color: "#be123c",
              padding: "0 24px",
              display: "flex",
            }}
          >
            vs
          </div>
          <FigurePanel figure={b} side="right" />
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );
}

function FigurePanel({
  figure,
  side,
}: {
  figure: Pick<Figure, "name" | "image_url" | "elo">;
  side: "left" | "right";
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: side === "left" ? "flex-start" : "flex-end",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 320,
          height: 400,
          borderRadius: 28,
          overflow: "hidden",
          background: "#fde68a",
          display: "flex",
          boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
        }}
      >
        {figure.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={figure.image_url}
            alt={figure.name}
            width={320}
            height={400}
            style={{ width: 320, height: 400, objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: 320,
              height: 400,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#92400e",
              fontSize: 24,
            }}
          >
            no portrait
          </div>
        )}
      </div>
      <div
        style={{
          fontSize: 44,
          fontWeight: 800,
          color: "#1f1208",
          maxWidth: 380,
          textAlign: side === "left" ? "left" : "right",
          display: "flex",
        }}
      >
        {figure.name}
      </div>
      <div
        style={{
          fontSize: 20,
          color: "#9a3412",
          fontWeight: 700,
          letterSpacing: 3,
          textTransform: "uppercase",
          display: "flex",
        }}
      >
        Elo {Math.round(Number(figure.elo))}
      </div>
    </div>
  );
}
