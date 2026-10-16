"use client";
import dynamic from "next/dynamic";
import { Loading } from "@/components/Loading";

// Client-only: the arena restores the debate from localStorage on first render.
const Arena = dynamic(() => import("@/components/arena/Arena").then((m) => m.Arena), { ssr: false, loading: () => <Loading label="Entering the arena…" /> });

export default function ArenaPage() {
  return <Arena />;
}
