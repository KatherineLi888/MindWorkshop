"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { SeedDetailClient } from "@/components/seeds/SeedDetailClient";
import { getSeedById } from "@/lib/seeds/storage";

export default function SeedDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const seed = id ? getSeedById(id) : undefined;

  if (!seed) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-slate-500">未找到该种子</p>
        <Link
          href="/seeds"
          className="mt-2 inline-block text-sm text-[#1D4ED8] hover:underline"
        >
          返回种子看板
        </Link>
      </div>
    );
  }

  return <SeedDetailClient seed={seed} />;
}
