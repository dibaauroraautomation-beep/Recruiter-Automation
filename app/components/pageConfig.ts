// Title + description shown in the top bar, and which menu items the sidebar shows.
// Key = the folder name under /pages (e.g. "/pages/setting" -> "setting").
// To add a new page: create app/pages/<Folder>/page.tsx, add it to PAGE_CONFIG,
// add it to MENU_ITEMS, and add its key to a menu group below.

export type PageConfig = {
  title: string;
  description: string;
  // OPTIONAL: which menu items to show in the sidebar while the user is on THIS page.
  // Use the page keys from MENU_ITEMS. If you leave it out, the full menu is shown.
  menu?: string[];
};

// ---------------------------------------------------------------------------
// Menu groups
// ---------------------------------------------------------------------------

// Shown in every group
const SHARED = ["setting"];

// Hiring-flow pages: on any of these pages, the menu shows only this group
export const HIRING_MENU = [
  "job-requisitions",
  "post-approval",
  "cv-bank-and-ranking",
  "shortlisted-candidates",
  "interview-and-selection",
  "hired-candidates",
  ...SHARED,
];

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

export const PAGE_CONFIG: Record<string, PageConfig> = {
  "job-requisitions": {
    title: "Job Requisitions",
    description:
      "Creating, optimizing, and distributing open roles across multiple external job boards, career pages, and internal networks.",
    menu: HIRING_MENU,
  },
  "post-approval": {
    title: "Post Approval",
    description:
      "The job vacancy will be posted to the careers page immediately once the hiring manager approves it.",
    menu: HIRING_MENU,
  },
  "cv-bank-and-ranking": {
    title: "CV Bank and Ranking",
    description:
      "Applicant data collected from the job forms is evaluated against the criteria defined for each role.",
    menu: HIRING_MENU,
  },
  "shortlisted-candidates": {
    title: "Shortlisted Candidates",
    description:
      "Narrowing down the entire applicant pool into a curated, high-potential segment ready for direct human interaction.",
    menu: HIRING_MENU,
  },
  "interview-and-selection": {
    title: "Interview & Selection",
    description:
      "Shortlisted candidates are reviewed here with their CV score, interview score and interviewer feedback before offers go out.",
    menu: HIRING_MENU,
  },
  "hired-candidates": {
    title: "Hired Candidates",
    description:
      "Candidates who accepted an offer, with their final scores and onboarding status in one place.",
    menu: HIRING_MENU,
  },

  // ----- Shared page (no "menu" -> full menu) -----
  setting: {
    title: "Account & Preferences",
    description:
      "Manage your profile details, security options, and subscription settings.",
  },
};

// Sidebar menu: every possible item, in display order.
export const MENU_ITEMS: { name: string; key: string }[] = [
  { name: "Job Requisitions", key: "job-requisitions" },
  { name: "Post Approval", key: "post-approval" },
  { name: "CV Bank and Ranking", key: "cv-bank-and-ranking" },
  { name: "Shortlisted Candidates", key: "shortlisted-candidates" },
  { name: "Interview & Selection", key: "interview-and-selection" },
  { name: "Hired Candidates", key: "hired-candidates" },
  { name: "Settings", key: "setting" },
];

// "/pages/setting" -> "setting"
export function getPageKey(pathname: string) {
  return pathname.split("/")[2] ?? "";
}

// Returns the menu items to show for the page the user is currently on.
// - Page has a "menu" list  -> only those items (in MENU_ITEMS order)
// - Page has no "menu" list -> the full MENU_ITEMS list
export function getMenuFor(pageKey: string) {
  const allowed = PAGE_CONFIG[pageKey]?.menu;
  if (!allowed) return MENU_ITEMS;
  return MENU_ITEMS.filter((item) => allowed.includes(item.key));
}
