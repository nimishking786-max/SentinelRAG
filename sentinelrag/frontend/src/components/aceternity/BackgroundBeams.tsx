export const BackgroundBeams = () => (
  <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div className="liquid-orb absolute -left-24 top-[-8%] h-80 w-80 bg-gradient-to-br from-pink-300/70 via-fuchsia-200/50 to-transparent" />
    <div className="liquid-orb absolute right-[-8%] top-[8%] h-[26rem] w-[26rem] bg-gradient-to-br from-sky-300/70 via-violet-200/50 to-transparent" />
    <div className="liquid-orb absolute bottom-[-12%] left-[35%] h-96 w-96 bg-gradient-to-br from-amber-200/70 via-orange-100/50 to-transparent" />
    <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgba(120,91,160,.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,91,160,.12)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_78%)]" />
  </div>
);
