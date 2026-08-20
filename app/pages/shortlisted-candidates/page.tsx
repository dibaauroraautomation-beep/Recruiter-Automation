"use client";
import NavAndSidebar from "@/app/components/navAndSidebar";
import TableComponent  from "@/app/components/TableComponent";

import { useEffect } from "react";
import { useT } from "@/app/contexts/LanguageContext";
import { useUser } from "@/app/contexts/UserContext";

export default function Dashboard() {
  const WebHook_Url="sdfgh"
  const t = useT();
  const { user } = useUser();
  console.log("user.WebHook_Ur:", user.WebHook_Url["Dashboard"]);

  useEffect(() => {
    fetch(WebHook_Url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: localStorage.getItem("userEmail") ?? "",
        page: "Dashboard",
        action: "page_view",
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  }, []);

  return (
    <div>
      <NavAndSidebar
        pageInfo={[
          "Shortlisted Candidates_NAME",
          "Narrowing down the entire applicant pool into a curated, high-potential segment ready for direct human interaction.",
          "shortlisted-candidates",
        ]}
        user={[
          user.name,
          user.profilePic,
          user.notificationNumber,
          user.purchasePlan,
          user.WebHook_Url["Dashboard"],
        ]}
      >
        <TableComponent />
        
      </NavAndSidebar>
    </div>
  );
}
