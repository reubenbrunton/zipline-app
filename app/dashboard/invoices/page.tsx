import { Plus, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { invoices } from "@/lib/mock-data";

const statusVariant: Record<string, any> = {
  Paid: "success",
  Pending: "warning",
  Overdue: "danger",
};

const financeKPIs = [
  { label: "Total Billed (Feb)", value: "$23,683", sub: "5 invoices" },
  { label: "Collected", value: "$13,100", sub: "2 invoices paid", positive: true },
  { label: "Outstanding", value: "$7,083", sub: "2 invoices pending" },
  { label: "Overdue", value: "$3,500", sub: "1 invoice overdue", danger: true },
];

export default function InvoicesPage() {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Invoices & Finance</h2>
          <p className="text-sm text-[#8888AA] mt-0.5">
            Track billing, payments, and financial health
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {/* Finance KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {financeKPIs.map((kpi, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/[0.07] bg-[#1A1A2E] p-4"
          >
            <p className="text-xs text-[#8888AA] font-medium mb-2">{kpi.label}</p>
            <p
              className={`text-xl font-bold ${
                kpi.danger
                  ? "text-red-400"
                  : kpi.positive
                  ? "text-emerald-400"
                  : "text-white"
              }`}
            >
              {kpi.value}
            </p>
            <p className="text-xs text-[#8888AA] mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-3.5 w-3.5" />
          Filter
        </Button>
        <Button variant="ghost" size="sm" className="gap-2 ml-auto">
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      </div>

      {/* Invoices table */}
      <div className="rounded-xl border border-white/[0.07] bg-[#1A1A2E] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left text-xs font-semibold text-[#8888AA] uppercase tracking-wider px-5 py-3.5">Invoice</th>
              <th className="text-left text-xs font-semibold text-[#8888AA] uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">Client</th>
              <th className="text-left text-xs font-semibold text-[#8888AA] uppercase tracking-wider px-4 py-3.5">Amount</th>
              <th className="text-left text-xs font-semibold text-[#8888AA] uppercase tracking-wider px-4 py-3.5">Status</th>
              <th className="text-left text-xs font-semibold text-[#8888AA] uppercase tracking-wider px-4 py-3.5 hidden lg:table-cell">Issued</th>
              <th className="text-left text-xs font-semibold text-[#8888AA] uppercase tracking-wider px-4 py-3.5 hidden lg:table-cell">Due</th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr
                key={inv.id}
                className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer last:border-0"
              >
                <td className="px-5 py-4">
                  <p className="text-sm font-medium text-white">{inv.id}</p>
                </td>
                <td className="px-4 py-4 hidden md:table-cell">
                  <p className="text-sm text-[#8888AA]">{inv.client}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm font-semibold text-white">{inv.amount}</p>
                </td>
                <td className="px-4 py-4">
                  <Badge variant={statusVariant[inv.status]}>{inv.status}</Badge>
                </td>
                <td className="px-4 py-4 hidden lg:table-cell">
                  <p className="text-sm text-[#8888AA]">{inv.date}</p>
                </td>
                <td className="px-4 py-4 hidden lg:table-cell">
                  <p className={`text-sm ${inv.status === "Overdue" ? "text-red-400 font-medium" : "text-[#8888AA]"}`}>
                    {inv.due}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
