"use client";
import dynamic from "next/dynamic";
import { Loading } from "@/components/Loading";

const Results = dynamic(() => import("@/components/results/Results").then((m) => m.Results), { ssr: false, loading: () => <Loading label="Loading your verdict…" /> });

export default function ResultsPage() {
  return <Results />;
}
