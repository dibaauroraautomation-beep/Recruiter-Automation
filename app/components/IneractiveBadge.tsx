import { useState, useEffect } from "react";
// import { useUser } from "@/app/contexts/UserContext";




// const { user } = useUser();

enum BadgeType {
  Applied = "applied",
  Interview = "interview",
  Review = "review",
  Offer = "offer",
  Reject = "reject",
}

const BADGE_STYLES: Record<BadgeType, { bg: string; text: string; dot: string }> = {
  [BadgeType.Applied]: { bg: "bg-blue-50 hover:bg-blue-100", text: "text-blue-600", dot: "bg-blue-600" },
  [BadgeType.Interview]: { bg: "bg-purple-50 hover:bg-purple-100", text: "text-purple-600", dot: "bg-purple-600" },
  [BadgeType.Review]: { bg: "bg-amber-50 hover:bg-amber-100", text: "text-amber-600", dot: "bg-amber-500" },
  [BadgeType.Offer]: { bg: "bg-emerald-50 hover:bg-emerald-100", text: "text-emerald-600", dot: "bg-emerald-500" },
  [BadgeType.Reject]: { bg: "bg-rose-50 hover:bg-rose-100", text: "text-rose-600", dot: "bg-rose-500" },
};

interface InteractiveBadgeProps {
  initialStatus: string;
  applicationId: number;
  roleName?: string;
  userId: string;
}

const handleClick = (
  statusState: BadgeType,
  applicationId: number,
  roleName: string = "",
  userId: string = "",
  // baseUrl: string = "https://mehedi-dida.app.n8n.cloud/webhook-test/ApplicationsStatus",
  // baseUrl: string = "https://hasan123a.app.n8n.cloud/webhook/ApplicationsStatus",
  
  // baseUrl: string = "https://n8naurora.duckdns.org/webhook-test/ApplicationsStatus",
  baseUrl: string = "https://n8naurora.duckdns.org/webhook/ApplicationsStatus",
) => {
  console.log("Updating status for row:", applicationId);

  // FIX: Explicitly updated 'statusSates' to 'statusState' to match standard parsers
  let targetUrl = `${baseUrl}?userId=${userId}&statusState=${statusState}&id=${applicationId}`;
  
  if (roleName) {
    targetUrl += `&role=${encodeURIComponent(roleName)}`;
  }
 
  fetch(targetUrl, { method: "GET" })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return response.text();
    })
    .then(() => console.log("Google Sheet row updated successfully"))
    .catch((error) => console.error("Fetch failed:", error));
};

export default function InteractiveBadge({ initialStatus, applicationId, roleName, userId }: InteractiveBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getNormalizedStatus = (statusText: string): BadgeType => {
    const text = (statusText || "").toLowerCase();
    if (text.includes("review")) return BadgeType.Review;
    if (text.includes("interview")) return BadgeType.Interview;
    if (text.includes("offer")) return BadgeType.Offer;
    if (text.includes("reject")) return BadgeType.Reject;
    return BadgeType.Applied;
  };

  const [currentStatus, setCurrentStatus] = useState<BadgeType>(() => getNormalizedStatus(initialStatus));

  useEffect(() => {
    setCurrentStatus(getNormalizedStatus(initialStatus));
  }, [initialStatus]);

  const handleSelectStatus = (status: BadgeType) => {
    setCurrentStatus(status);
    setIsOpen(false);
    handleClick(status, applicationId, roleName, userId);
  };

  const activeStyle = BADGE_STYLES[currentStatus];

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 font-medium capitalize rounded-full text-xs px-3 py-1 focus:outline-none border border-transparent ${activeStyle.bg} ${activeStyle.text}`}
        type="button"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${activeStyle.dot}`} />
        {currentStatus}
      </button>

      {isOpen && (
        <div className="z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg w-36 absolute left-0 overflow-hidden">
          <ul className="p-1 text-xs font-medium text-gray-700">
            {Object.values(BadgeType).map((status) => {
              const statusStyle = BADGE_STYLES[status];
              return (
                <li key={status}>
                  <button
                    onClick={() => handleSelectStatus(status)}
                    className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 hover:bg-gray-50 text-gray-700 rounded-lg capitalize"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                    <span className={statusStyle.text}>{status}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}