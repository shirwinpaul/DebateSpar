"use client";

/** A big selectable card used in the wizard (radio semantics). */
export function ChoiceGroup<T extends string | number>({
  label,
  value,
  options,
  onChange,
  columns = 3,
}: {
  label: string;
  value: T;
  options: { value: T; title: string; desc?: string }[];
  onChange: (v: T) => void;
  columns?: 2 | 3 | 4;
}) {
  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[columns];
  return (
    <fieldset>
      <legend className="mb-2 font-semibold">{label}</legend>
      <div className={`grid gap-3 ${cols}`}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <label
              key={String(o.value)}
              className={`card cursor-pointer p-4 transition ${selected ? "border-gold ring-2 ring-gold" : "hover:border-gold/60"}`}
            >
              <input
                type="radio"
                className="sr-only"
                name={label}
                checked={selected}
                onChange={() => onChange(o.value)}
              />
              <span className="block text-lg font-bold">{o.title}</span>
              {o.desc && <span className="mt-1 block text-sm text-muted">{o.desc}</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Toggle({ checked, onChange, title, desc }: { checked: boolean; onChange: (v: boolean) => void; title: string; desc: string }) {
  return (
    <label className={`card flex cursor-pointer items-start gap-4 p-4 ${checked ? "border-gold" : ""}`}>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden
        className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-gold ${checked ? "bg-gold" : "bg-elev-2 border border-line"}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-6" : "left-1"}`} />
      </span>
      <span>
        <span className="block text-lg font-bold">{title}</span>
        <span className="block text-sm text-muted">{desc}</span>
      </span>
    </label>
  );
}
