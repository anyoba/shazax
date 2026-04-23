export default function HeroPanel() {
  return (
    <section className="animate-rise rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-soft backdrop-blur-xl sm:p-8 lg:p-10">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex rounded-full border border-[#e8dccf] bg-[#fbf6ef] px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-cocoa">
          Academic Resource Hub
        </span>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Find your course material in one calm, elegant workspace.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-ink/70 sm:text-base">
          Explore modules, open course sections, and access lectures, tutorials, and exams through a
          centered interface inspired by your reference design.
        </p>
      </div>
    </section>
  );
}
