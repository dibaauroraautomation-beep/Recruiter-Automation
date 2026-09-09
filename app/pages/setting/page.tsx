"use client";
import Link from "next/link";
import NavAndSidebar from "@/app/components/navAndSidebar"; // 1. Capitalized Import
import { useUser } from "@/app/contexts/UserContext";

export default function setting() {
  const { user } = useUser();
  console.log("user.WebHook_Ur:", user.WebHook_Url["setting"]);
  return (
    <div>
      {/* 2. Capitalized Tag */}
      <NavAndSidebar
        pageInfo={[
          "Account & Preferences",
          "Manage your profile details, security options, and subscription settings.",
          "setting",
        ]}
        user={[
          user.name,
          user.profilePic,
          user.notificationNumber,
          user.purchasePlan,
          user.WebHook_Url["setting"],
        ]}
      />
    </div>
  );
}
