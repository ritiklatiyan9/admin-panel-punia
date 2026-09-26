import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Pagination } from "@/components/shared/Pagination";
import { FiltersBar } from "@/components/shared/FiltersBar";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { Coins } from "@/components/shared/Coins";
import { Card } from "@/components/ui/card";
import { SettingsGroupCard } from "@/components/shared/SettingsGroupCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cpxService } from "@/services/cpx.service";
import { API_BASE_URL } from "@/services/api-client";
import { formatDateTime } from "@/utils/format";

const PAGE_SIZE = 20;

// The exact string to paste into CPX dashboard → Postback Settings.
const POSTBACK_URL = `${new URL(API_BASE_URL, window.location.origin).href.replace(/\/$/, "")}/cpx/postback?status={status}&trans_id={trans_id}&user_id={user_id}&amount_local={amount_local}&amount_usd={amount_usd}&offer_id={offer_ID}&type={type}&hash={secure_hash}`;

const CpxSettingsCard = (): JSX.Element => (
  <SettingsGroupCard
    prefix="cpx."
    enabledKey="cpx.enabled"
    title="CPX Research"
    description="Blank fields fall back to CPX_APP_ID / CPX_SECURE_HASH on the server."
  >
    <div className="space-y-1.5">
      <Label>Postback URL</Label>
      <div className="flex gap-2">
        <Input readOnly value={POSTBACK_URL} className="font-mono text-xs" />
        <Button
          variant="outline"
          onClick={() =>
            void navigator.clipboard
              .writeText(POSTBACK_URL)
              .then(() => toast.success("Postback URL copied"))
          }
        >
          Copy
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Paste into CPX dashboard → Postback Settings. Set the CPX currency to coins so
        amount_local is the coin amount credited.
      </p>
    </div>
  </SettingsGroupCard>
);

export const SurveysPage = (): JSX.Element => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["cpx-transactions", { page, search, status }],
    queryFn: ({ signal }) =>
      cpxService.list(
        {
          page,
          limit: PAGE_SIZE,
          search: search.trim() || undefined,
          status: status === "all" ? undefined : status,
        },
        signal,
      ),
  });
  const rows = data?.items;

  return (
    <div>
      <PageHeader
        title="Surveys"
        description="CPX Research survey wall — users earn coins automatically when CPX confirms a survey."
      />

      <CpxSettingsCard />

      <FiltersBar
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
          placeholder: "Search email or transaction id…",
        }}
        selects={[
          {
            key: "status",
            value: status,
            onChange: (value) => {
              setStatus(value);
              setPage(1);
            },
            options: [
              { value: "all", label: "All statuses" },
              { value: "COMPLETED", label: "Completed" },
              { value: "REVERSED", label: "Reversed" },
            ],
          },
        ]}
      />

      <Card>
        {isLoading ? (
          <TableSkeleton />
        ) : isError ? (
          <div className="p-6">
            <p className="mb-3 text-sm">Could not load survey transactions.</p>
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : !rows || rows.length === 0 ? (
          <EmptyState
            title="No survey rewards yet"
            description="Completed CPX surveys appear here as soon as CPX sends the postback."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="hidden md:table-cell">Transaction</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Coins</TableHead>
                <TableHead className="hidden text-right sm:table-cell">USD</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="max-w-56">
                    <p className="truncate font-medium">{row.user.name ?? "—"}</p>
                    <p className="truncate text-xs text-muted-foreground">{row.user.email}</p>
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs md:table-cell">
                    {row.transId}
                    {row.type && <span className="ml-2 text-muted-foreground">{row.type}</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.status === "COMPLETED" ? "success" : "destructive"}>
                      {row.status === "COMPLETED" ? "Completed" : "Reversed"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    <Coins value={row.coins} />
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {row.amountUsd !== null ? row.amountUsd.toFixed(2) : "—"}
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground lg:table-cell">
                    {formatDateTime(row.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {data && <Pagination meta={data.meta} onPageChange={setPage} />}
      </Card>
    </div>
  );
};
