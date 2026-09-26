import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import type { PageMeta } from "@/types/api";

interface PaginationProps {
  meta: PageMeta;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export const Pagination = ({
  meta,
  onPageChange,
  disabled = false,
}: PaginationProps): JSX.Element | null => {
  if (meta.total === 0) return null;

  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="flex items-center justify-between gap-4 px-1 py-3">
      <p className="text-sm text-muted-foreground">
        Showing {start}–{end} of {meta.total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
        >
          <ChevronLeftIcon className="mr-1 h-4 w-4" /> Prev
        </Button>
        <span className="text-sm text-muted-foreground">
          {meta.page} / {meta.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next <ChevronRightIcon className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
