"use client";

import { useState } from "react";
import { PencilLine, Camera } from "lucide-react";
import type { ParseResponse } from "@/lib/types";
import TextLogger from "./TextLogger";
import VisionLogger from "./VisionLogger";

type Tab = "text" | "photo";

export default function QuickLogPanel({
  onParsed,
}: {
  onParsed: (res: ParseResponse, source: "text" | "vision") => void;
}) {
  const [tab, setTab] = useState<Tab>("text");

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center gap-1 border-b border-slate-100 p-2">
        <TabButton active={tab === "text"} onClick={() => setTab("text")} icon={<PencilLine className="h-4 w-4" />}>
          Plain English
        </TabButton>
        <TabButton active={tab === "photo"} onClick={() => setTab("photo")} icon={<Camera className="h-4 w-4" />}>
          Snap a photo
        </TabButton>
      </div>

      <div className="p-4 sm:p-5">
        {tab === "text" ? (
          <TextLogger onParsed={(res) => onParsed(res, "text")} />
        ) : (
          <VisionLogger onParsed={(res) => onParsed(res, "vision")} />
        )}
      </div>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
        active ? "bg-belly-500 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
