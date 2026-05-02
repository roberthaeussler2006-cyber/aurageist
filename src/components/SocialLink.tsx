import type { SocialKind } from "@/lib/types";

type Kind = SocialKind | "none" | null;

const LABEL: Record<SocialKind, string> = {
  instagram: "Instagram",
  x: "X",
  tiktok: "TikTok",
  youtube: "YouTube",
  threads: "Threads",
  facebook: "Facebook",
  website: "Website",
};

export function SocialLink({
  url,
  kind,
  name,
  variant = "overlay",
}: {
  url: string | null;
  kind: Kind;
  name: string;
  variant?: "overlay" | "inline";
}) {
  if (!url || !kind || kind === "none") return null;

  const label = `${name} on ${LABEL[kind]}`;
  const baseProps = {
    href: url,
    target: "_blank" as const,
    rel: "noopener noreferrer",
    "aria-label": label,
    title: label,
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
  };

  if (variant === "overlay") {
    return (
      <a
        {...baseProps}
        className="absolute top-3 right-3 z-30 h-9 w-9 rounded-full bg-white/95 backdrop-blur ring-1 ring-line shadow-md flex items-center justify-center text-foreground hover:bg-white hover:scale-110 active:scale-95 transition-all"
      >
        <SocialIcon kind={kind} />
      </a>
    );
  }

  return (
    <a
      {...baseProps}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-panel border border-line text-[11px] uppercase tracking-[0.18em] font-semibold text-foreground/80 hover:text-foreground hover:border-accent/40 hover:shadow-md transition-all"
    >
      <SocialIcon kind={kind} />
      <span>{LABEL[kind]}</span>
    </a>
  );
}

function SocialIcon({ kind }: { kind: SocialKind }) {
  switch (kind) {
    case "instagram":
      return <InstagramIcon />;
    case "x":
      return <XIcon />;
    case "tiktok":
      return <TikTokIcon />;
    case "youtube":
      return <YouTubeIcon />;
    case "threads":
      return <ThreadsIcon />;
    case "facebook":
      return <FacebookIcon />;
    case "website":
      return <GlobeIcon />;
  }
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2H21l-6.52 7.45L22 22h-6.79l-4.78-6.24L4.8 22H2.04l6.97-7.97L2 2h6.93l4.32 5.71L18.244 2zm-1.19 18h1.55L7.06 4h-1.6l11.594 16z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.5 2h-3v13.2a2.8 2.8 0 1 1-2-2.7v-3.1a5.9 5.9 0 1 0 5 5.8V8.6a8.5 8.5 0 0 0 5 1.6v-3a5.5 5.5 0 0 1-5-5.2z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.27 5 12 5 12 5s-6.27 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26.2 26.2 0 0 0 2 12a26.2 26.2 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.73 19 12 19 12 19s6.27 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26.2 26.2 0 0 0 22 12a26.2 26.2 0 0 0-.4-4.8zM10 15V9l5.2 3z" />
    </svg>
  );
}

function ThreadsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 8.5C18 5 15.5 3 12 3 7 3 4 6.5 4 12s3 9 8 9c4 0 6.5-2 7-5.5.4-3-1.5-5-5-5.5-3-.4-5 .5-5 2.5s2 2.5 4 2C15 14 16 12 16 10" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 12a10 10 0 1 0-11.56 9.88V14.9H7.9V12h2.54V9.8c0-2.5 1.5-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.9h-2.34v6.98A10 10 0 0 0 22 12z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}
