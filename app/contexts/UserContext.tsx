"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";



export type User = {
  name: string;
  profilePic: string;
  notificationNumber: number;
  purchasePlan: string;
  id: any;
  WebHook_Url: Record<string, string>;
};

type UserContextType = {
  user: User;
  setUser: (user: User) => void;
};

const defaultUser: User = {
  name: "Alex Morgan",
  profilePic: "https://i.pravatar.cc/64?img=12",
  notificationNumber: 5,
  purchasePlan: "Premium Pro",
  id: null,
  WebHook_Url: {
    Dashboard: "WebHook_Url:Dashboardopoopop",
    Resume_Generator: "https://n8naurora.duckdns.org/webhook-test/user-info",
    coverLetterGenerator: "https://n8naurora.duckdns.org/webhook/coverLetterGenerator",
    // coverLetterGenerator: "https://n8naurora.duckdns.org/webhook-test/coverLetterGenerator",
    Interview_Prep_AI: "WebHook_Url:Interview_Prep_AIopoopop",
    ApplicationsStatus: "https://n8naurora.duckdns.org/webhook/ApplicationsStatus",
    // ApplicationsStatus: "https://n8naurora.duckdns.org/webhook-test/ApplicationsStatus",
    setting: "WebHook_Url:settingopoopop",
  }
};

const UserContext = createContext<UserContextType>({
  user: defaultUser,
  setUser: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(defaultUser);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
