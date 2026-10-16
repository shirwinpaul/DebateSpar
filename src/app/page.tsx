import Link from "next/link";
import { ArenaIllustration } from "@/components/illustrations";
import { ResumeBanner } from "@/components/ResumeBanner";

const steps = [
  { icon: "📜", title: "Pick a motion", text: "Type your own or choose from 60+ motions. Pick your side." },
  { icon: "⚔️", title: "Spar in rounds", text: "The AI argues the other side and answers your points directly." },
  { icon: "🏆", title: "Get judged", text: "Scores, your best and weakest moments, and 3 tips to improve." },
];

const modes = [
  { icon: "🧑‍🏫", title: "Coach Mode", text: "A quick tip after each of your speeches." },
  { icon: "🕵️", title: "Fallacy Hunt", text: "The AI hides a logical fallacy. Spot it to earn bonus points." },
  { icon: "🔴", title: "Champion difficulty", text: "Sharp rebuttals that see your counter-arguments coming." },
];

const promises = [
  { icon: "🔎", title: "No made-up statistics", text: "The AI argues with reasoning and well-known facts. It never invents studies or quotes." },
  { icon: "🤝", title: "Respectful debate", text: "Ideas get challenged. People don't. No insults, ever." },
  { icon: "🔒", title: "Private history", text: "Your debates stay in your browser. Nothing is saved on a server." },
];

export default function Home() {
  return (
    <div className="spotlight">
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 md:grid-cols-2 md:py-16">
        <div>
          <h1 className="font-display text-5xl leading-none tracking-wide sm:text-7xl">
            Sharpen your arguments.<br />
            <span className="text-prop">Spar</span> with <span className="text-opp">AI</span>. <span aria-hidden>⚔️</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-muted">
            DebateDojo is your sparring partner. Choose a motion, take a side, and an AI opponent argues the other side.
            Then a fair judge scores you and tells you exactly how to improve.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/setup" className="btn btn-gold px-6 text-lg">⚔️ Start a debate</Link>
            <Link href="/progress" className="btn btn-ghost">📈 My Progress</Link>
          </div>
          <ResumeBanner />
        </div>
        <ArenaIllustration className="w-full drop-shadow-xl" />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10" aria-labelledby="how">
        <h2 id="how" className="font-display text-4xl tracking-wide">How it works</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="card p-5">
              <div className="text-3xl" aria-hidden>{s.icon}</div>
              <h3 className="mt-2 text-lg font-bold"><span className="text-gold">{i + 1}.</span> {s.title}</h3>
              <p className="mt-1 text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10" aria-labelledby="modes">
        <h2 id="modes" className="font-display text-4xl tracking-wide">Modes</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {modes.map((m) => (
            <div key={m.title} className="card p-5">
              <div className="text-3xl" aria-hidden>{m.icon}</div>
              <h3 className="mt-2 text-lg font-bold">{m.title}</h3>
              <p className="mt-1 text-muted">{m.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10" aria-labelledby="fair">
        <h2 id="fair" className="font-display text-4xl tracking-wide">Fair-play promise</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {promises.map((p) => (
            <div key={p.title} className="card border-gold/40 p-5">
              <div className="text-3xl" aria-hidden>{p.icon}</div>
              <h3 className="mt-2 text-lg font-bold">{p.title}</h3>
              <p className="mt-1 text-muted">{p.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
