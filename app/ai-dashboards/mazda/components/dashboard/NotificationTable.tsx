"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown, Search } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

// ---------- Types ----------
export type MazdaRow = {
  id: string;
  notificationId: string;
  notificationText?: string;
  priority?: number;
  plant?: string;
  equipment?: string;
  functionalLocation?: string;
  status?: string;                   // Phase / Status (derived)
  maintenanceObjectStatus?: string;  // "Up" | "Down"
  creationDate?: string;             // ISO
  lastChangeDate?: string;           // ISO
};

type SortKey = keyof MazdaRow;

type Props = {
  // EITHER give us raw webhook body...
  raw?: any;                         // e.g. { ok:true, notifs:[...] }
  // ...OR give a pre-mapped list
  notifications?: MazdaRow[];
  isLoading: boolean;
  pageSize?: number;                 // default 15
};

// ---------- Mapper you can reuse elsewhere (KPIs, charts, etc.) ----------
export function mapMazdaNotifs(raw: any): MazdaRow[] {
  const list = Array.isArray(raw?.notifs) ? raw.notifs : Array.isArray(raw) ? raw : [];
  return list.map((n: any, idx: number) => {
    const id = String(n.notificationId ?? n.id ?? idx + 1);
    const createdIso = n.creationDateIso || n.creationDate || "";
    const lastIso = n.lastChangeDateIso || n.lastChangeDate || "";

    // build "Phase / Status" with sensible fallbacks
    const phaseOrStatus =
      n.notifProcessingPhaseDesc ||
      n.userStatus ||
      n.eamProcessPhaseCodeDesc ||
      n.concatenatedActiveSystStsName ||
      "";

    return {
      id,
      notificationId: String(n.notificationId ?? ""),
      notificationText: n.notificationText ?? "",
      priority: typeof n.priority === "number" ? n.priority : Number(n.priority ?? 0) || undefined,
      plant: n.plant != null ? String(n.plant) : undefined,
      equipment: n.equipment || "",
      functionalLocation: n.functionalLocation || "",
      status: phaseOrStatus,
      maintenanceObjectStatus: n.maintenanceObjectIsDown ? "Down" : "Up",
      creationDate: createdIso || undefined,
      lastChangeDate: lastIso || undefined,
    } as MazdaRow;
  })
  // newest first: prefer lastChangeDate, fallback to creationDate
  .sort((a: MazdaRow, b: MazdaRow) => {
    const aKey = a.lastChangeDate || a.creationDate || "";
    const bKey = b.lastChangeDate || b.creationDate || "";
    const aT = aKey ? +parseISO(aKey) : 0;
    const bT = bKey ? +parseISO(bKey) : 0;
    return bT - aT;
  });
}

// ---------- Table Component ----------
export default function NotificationTable({ raw, notifications, isLoading, pageSize = 15 }: Props) {
  // Use mapped-from-raw if provided, else the notifications prop
  const rows: MazdaRow[] = useMemo(() => {
    if (raw) return mapMazdaNotifs(raw);
    return Array.isArray(notifications) ? notifications.slice() : [];
  }, [raw, notifications]);

  // Search, sort, pagination
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "creationDate",
    dir: "desc",
  });
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const base = term
      ? rows.filter((n) =>
          (n.notificationId ?? "").toLowerCase().includes(term) ||
          (n.notificationText ?? "").toLowerCase().includes(term) ||
          (n.plant ?? "").toLowerCase().includes(term) ||
          (n.status ?? "").toLowerCase().includes(term),
        )
      : rows.slice();

    // sorting
    const { key, dir } = sort;
    base.sort((a, b) => {
      const av = (a[key] ?? "") as any;
      const bv = (b[key] ?? "") as any;

      // date keys
      if (key === "creationDate" || key === "lastChangeDate") {
        const ad = av ? +parseISO(String(av)) : 0;
        const bd = bv ? +parseISO(String(bv)) : 0;
        return dir === "asc" ? ad - bd : bd - ad;
      }

      // numeric priority
      if (key === "priority") {
        const ap = typeof av === "number" ? av : Number(av || 0);
        const bp = typeof bv === "number" ? bv : Number(bv || 0);
        return dir === "asc" ? ap - bp : bp - ap;
      }

      // string fallback
      const as = String(av).toLowerCase();
      const bs = String(bv).toLowerCase();
      if (as < bs) return dir === "asc" ? -1 : 1;
      if (as > bs) return dir === "asc" ? 1 : -1;
      return 0;
    });

    return base;
  }, [rows, q, sort]);

  // paginate 15 per page
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = (page - 1) * pageSize;
  const pageRows = filtered.slice(pageStart, pageStart + pageSize);

  // reset to first page on data or query change
  React.useEffect(() => { setPage(1); }, [total, q]);

  const setSortKey = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  if (isLoading) {
    return (
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Notifications ({total})</CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="pl-9" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-[600px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 sticky top-0">
                <Th onClick={() => setSortKey("notificationId")} label="ID" active={sort.key === "notificationId"} dir={sort.dir} />
                <Th onClick={() => setSortKey("notificationText")} label="Text" active={sort.key === "notificationText"} dir={sort.dir} />
                <Th onClick={() => setSortKey("priority")} label="Priority" active={sort.key === "priority"} dir={sort.dir} />
                <Th onClick={() => setSortKey("plant")} label="Plant" active={sort.key === "plant"} dir={sort.dir} />
                <Th onClick={() => setSortKey("equipment")} label="Equipment" active={sort.key === "equipment"} dir={sort.dir} />
                <Th onClick={() => setSortKey("status")} label="Phase / Status" active={sort.key === "status"} dir={sort.dir} />
                <Th onClick={() => setSortKey("maintenanceObjectStatus")} label="Obj. Status" active={sort.key === "maintenanceObjectStatus"} dir={sort.dir} />
                <Th onClick={() => setSortKey("creationDate")} label="Created" active={sort.key === "creationDate"} dir={sort.dir} />
                <Th onClick={() => setSortKey("lastChangeDate")} label="Last Change" active={sort.key === "lastChangeDate"} dir={sort.dir} />
              </TableRow>
            </TableHeader>

            <TableBody>
              {pageRows.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="font-mono">{n.notificationId || "—"}</TableCell>
                  <TableCell className="max-w-[520px]">
                    <div className="line-clamp-2">{n.notificationText || "No description"}</div>
                  </TableCell>
                  <TableCell>
                    {n.priority ? (
                      <Badge
                        className={cn(
                          "text-xs",
                          n.priority === 1 && "bg-red-100 text-red-800 border border-red-300",
                          n.priority === 2 && "bg-orange-100 text-orange-800 border border-orange-300",
                          n.priority === 3 && "bg-yellow-100 text-yellow-800 border border-yellow-300",
                          n.priority === 4 && "bg-blue-100 text-blue-800 border border-blue-300",
                        )}
                      >
                        P{n.priority}
                      </Badge>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>{n.plant ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{n.equipment || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{n.status || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{n.maintenanceObjectStatus || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {n.creationDate ? format(parseISO(n.creationDate), "yyyy-MM-dd") : "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {n.lastChangeDate ? format(parseISO(n.lastChangeDate), "yyyy-MM-dd HH:mm") : "—"}
                  </TableCell>
                </TableRow>
              ))}

              {pageRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-slate-500 py-10">
                    No rows
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="text-slate-600">
            Showing {total === 0 ? 0 : pageStart + 1}
            –
            {Math.min(pageStart + pageSize, total)} of {total}
          </span>

          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 border rounded disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Prev
            </button>
            <span className="px-2 py-1.5">{page} / {Math.max(1, Math.ceil(total / pageSize))}</span>
            <button
              className="px-3 py-1.5 border rounded disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(Math.max(1, Math.ceil(total / pageSize)), p + 1))}
              disabled={page >= Math.max(1, Math.ceil(total / pageSize))}
            >
              Next
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Th({
  label,
  onClick,
  active,
  dir,
}: {
  label: string;
  onClick: () => void;
  active: boolean;
  dir: "asc" | "desc";
}) {
  return (
    <TableHead onClick={onClick} className="cursor-pointer select-none whitespace-nowrap">
      <div className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className={cn("w-4 h-4 text-slate-400", active && "text-slate-900")} />
        <span className="text-[10px] uppercase tracking-wider text-slate-400">{active ? dir : ""}</span>
      </div>
    </TableHead>
  );
}
