import { cn } from "@/lib/utils";

type StatusType = "Allowed" | "Blocked" | "Warning" | "Time Limited";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusClasses = () => {
    switch (status) {
      case "Allowed":
        return "bg-[#107C10]/10 text-[#107C10]";
      case "Blocked":
        return "bg-[#A80000]/10 text-[#A80000]";
      case "Warning":
        return "bg-[#D83B01]/10 text-[#D83B01]";
      case "Time Limited":
        return "bg-[#D83B01]/10 text-[#D83B01]";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span
      className={cn(
        "px-2 py-1 rounded-full text-xs font-medium",
        getStatusClasses(),
        className
      )}
    >
      {status}
    </span>
  );
}
