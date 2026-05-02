"use client";

const YT_ID = "9q6eL3iSATM";

export function BrainrotPanel() {
  const src = `https://www.youtube-nocookie.com/embed/${YT_ID}?autoplay=1&mute=1&loop=1&playlist=${YT_ID}&controls=0&modestbranding=1&playsinline=1&rel=0&disablekb=1&fs=0&iv_load_policy=3`;

  return (
    <div
      aria-hidden
      className="fixed bottom-4 left-4 z-50 w-[320px] sm:w-[420px] md:w-[500px] aspect-video rounded-2xl overflow-hidden shadow-2xl ring-2 ring-black/20 bg-black pointer-events-none"
    >
      <iframe
        src={src}
        title="brainrot"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen={false}
        className="w-full h-full pointer-events-none"
        tabIndex={-1}
      />
    </div>
  );
}
