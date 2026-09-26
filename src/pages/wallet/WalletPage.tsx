import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeftIcon, ArrowUpRightIcon, BanknotesIcon, WalletIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Pagination } from "@/components/shared/Pagination";
import { FiltersBar, type DateRangeValue } from "@/components/shared/FiltersBar";
import { ExportButton, type ExportColumn } from "@/components/shared/ExportButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { walletService } from "@/services/wallet.service";
import { adminService } from "@/services/admin.service";
import { Coins } from "@/components/shared/Coins";
import { formatDateTime } from "@/utils/format";

const PAGE_SIZE = 10;
type TypeFilter = "ALL" | "CREDIT" | "DEBIT";

const exportColumns: ExportColumn[] = [
  { key: "type", label: "Type" },
  { key: "description", label: "Description" },
  { key: "reference", label: "Reference" },
  { key: "amount", label: "Coins" },
  { key: "balanceAfter", label: "Balance after" },
  { key: "createdAt", label: "Date", format: (v) => formatDateTime(v as string) },
];

export const WalletPage = (): JSX.Element => {
  const [page, setPage] = useState(1);
  const [type, setType] = useState<TypeFilter>("ALL");
  const [range, setRange] = useState<DateRangeValue>({ from: "", to: "" });

  const wallet = useQuery({ queryKey: ["wallet", "me"], queryFn: walletService.myWallet });
  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: ({ signal }) => adminService.stats(signal) });
  const transactions = useQuery({
    queryKey: ["wallet", "transactions", page],
    queryFn: () => walletService.transactions({ page, limit: PAGE_SIZE }),
  });

  // ponytail: API only supports page/limit — type/date filters apply client-side
  // to the currently loaded page.
  const rows = (transactions.data?.items ?? []).filter(
    (tx) =>
      (type === "ALL" || tx.type === type) &&
      (!range.from || tx.createdAt.slice(0, 10) >= range.from) &&
      (!range.to || tx.createdAt.slice(0, 10) <= range.to),
  );

  const filterSummary =
    [
      type !== "ALL" && `Type: ${type}`,
      (range.from || range.to) && `Date: ${range.from || "…"} – ${range.to || "…"}`,
    ]
      .filter(Boolean)
      .join(" · ") || undefined;

  return (
    <div>
      <PageHeader
        title="Wallet"
        description="Your wallet and the platform's total reward liability."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="My wallet balance"
          value={wallet.data ? <Coins value={wallet.data.balance} /> : "—"}
          icon={WalletIcon}
          loading={wallet.isLoading}
        />
        <StatCard
          label="Platform wallet liability"
          value={stats.data ? <Coins value={stats.data.totalWalletBalance} /> : "—"}
          icon={BanknotesIcon}
          hint="Sum of all user balances"
          loading={stats.isLoading}
        />
      </div>

      <FiltersBar
        className="mt-6"
        selects={[
          {
            key: "type",
            value: type,
            onChange: (value) => setType(value as TypeFilter),
            placeholder: "Type",
            options: [
              { value: "ALL", label: "All types" },
              { value: "CREDIT", label: "Credit" },
              { value: "DEBIT", label: "Debit" },
            ],
          },
        ]}
        dateRange={{ value: range, onChange: setRange }}
        onClearAll={() => {
          setType("ALL");
          setRange({ from: "", to: "" });
        }}
      >
        <ExportButton
          className="ml-auto"
          rows={rows as unknown as Record<string, unknown>[]}
          columns={exportColumns}
          fileName="wallet-transactions"
          title="Wallet transactions"
          page={page}
          filterSummary={filterSummary}
        />
      </FiltersBar>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Credits and debits on your wallet</CardDescription>
        </CardHeader>
        {transactions.isLoading ? (
          <TableSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No transactions found"
            description="Wallet activity matching your filters will appear here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Coins</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Balance after</TableHead>
                <TableHead className="hidden text-right md:table-cell">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <Badge variant={tx.type === "CREDIT" ? "success" : "destructive"}>
                      {tx.type === "CREDIT" ? (
                        <ArrowDownLeftIcon className="h-3 w-3" />
                      ) : (
                        <ArrowUpRightIcon className="h-3 w-3" />
                      )}
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-64">
                    <p className="truncate">{tx.description ?? "—"}</p>
                    {tx.reference && (
                      <p className="truncate text-xs text-muted-foreground">{tx.reference}</p>
                    )}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium tabular-nums ${
                      tx.type === "CREDIT"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {tx.type === "CREDIT" ? "+" : "−"}
                    <Coins value={tx.amount} />
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">
                    <Coins value={tx.balanceAfter} />
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-right text-xs text-muted-foreground md:table-cell">
                    {formatDateTime(tx.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {transactions.data && <Pagination meta={transactions.data.meta} onPageChange={setPage} />}
      </Card>
    </div>
  );
};
