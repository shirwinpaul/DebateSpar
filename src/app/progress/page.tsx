"use client";
import dynamic from "next/dynamic";
import { Loading } from "@/components/Loading";

const ProgressView = dynamic(() => import("@/components/progress/ProgressView").then((m) => m.ProgressView), { ssr: false, loading: () => <Loading /> });

export default function ProgressPage() {
  return <ProgressView />;
}
