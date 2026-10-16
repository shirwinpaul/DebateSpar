"use client";
import dynamic from "next/dynamic";
import { Loading } from "@/components/Loading";

// Client-only: the wizard reads saved choices from localStorage on first render.
const Wizard = dynamic(() => import("@/components/wizard/Wizard").then((m) => m.Wizard), { ssr: false, loading: () => <Loading /> });

export default function SetupPage() {
  return <Wizard />;
}
