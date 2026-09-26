import { Badge } from "@/components/ui/badge";
import type { ClaimStatus, SubmissionStatus } from "@/types/domain";

const claimVariants: Record<ClaimStatus, "warning" | "success" | "destructive"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

const submissionVariants: Record<
  SubmissionStatus,
  "secondary" | "success" | "destructive" | "warning" | "outline"
> = {
  PENDING: "secondary",
  APPROVED: "success",
  REJECTED: "destructive",
  NEED_MORE_PROOF: "warning",
  CANCELLED: "outline",
};

export const ClaimStatusBadge = ({ status }: { status: ClaimStatus }): JSX.Element => (
  <Badge variant={claimVariants[status]}>{status}</Badge>
);

export const SubmissionStatusBadge = ({
  status,
}: {
  status: SubmissionStatus;
}): JSX.Element => <Badge variant={submissionVariants[status]}>{status}</Badge>;
