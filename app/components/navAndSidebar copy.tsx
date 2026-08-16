import { ReactNode } from "react"; // 1. Added ReactNode import
import { IconType } from "react-icons";
import { SiHomebridge } from "react-icons/si";
import { TiInfoOutline } from "react-icons/ti";
import { GiLetterBomb } from "react-icons/gi";
import { SiSemaphoreci } from "react-icons/si";
import { MdOutlineSettingsPhone } from "react-icons/md";
import { MdPermDataSetting } from "react-icons/md";
import { TbImageGeneration } from "react-icons/tb";
import { CiLogin } from "react-icons/ci";

interface pageInfoProps {
  pageInfo: [title: string, titleDescription: string, heighLightLink: string];
  user: [
    name: string,
    profilePic: string,
    notificationNumber: number,
    purchasePlan: string,
  ];
  sidebarHeight?: string; 
  children?: ReactNode; // 2. Added children definition so it can hold the cards
}

interface PageItem {
  name: string;
  path: string;
  icon: IconType;
}

function separatePageData(sourceList: PageItem[]) {
  const n1: string[] = []; 
  const n2: string[] = []; 
  const n3: IconType[] = []; 

  sourceList.forEach((item) => {
    n1.push(item.name);
    n2.push(item.path);
    n3.push(item.icon);
  });

  return { n1, n2, n3 };
}

const pathVar: PageItem[] = [
  { name: "Dashboard", path: "Dashboard", icon: SiHomebridge },
  { name: "about", path: "about", icon: TiInfoOutline },
  {
    name: "coverLetterGenerator",
    path: "coverLetterGenerator",
    icon: GiLetterBomb,
  },
  {
    name: "Interview_Prep_AI",
    path: "Interview_Prep_AI",
    icon: MdOutlineSettingsPhone,
  },
  { name: "Job_Tracker", path: "Job_Tracker", icon: SiSemaphoreci },
  { name: "login", path: "login", icon: CiLogin },
  {
    name: "Resume_Generator",
    path: "Resume_Generator",
    icon: TbImageGeneration,
  },
  { name: "setting", path: "setting", icon: MdPermDataSetting },
];

function customLoopForSidebarLink(_heighLightLink: string) {
  const listOfPageNames: string[] = separatePageData(pathVar).n1; 
  const listOfPages: string[] = separatePageData(pathVar).n2; 
  const iconslist: IconType[] = separatePageData(pathVar).n3; 

  return (
    <div className="flex flex-col gap-2 mt-4">
      {listOfPages.map((pagePath, index) => {
        const DynamicIcon = iconslist[index];

        if (_heighLightLink === pagePath) {
          return (
            <a
              key={index}
              href={pagePath}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-sm"
            >
              <span>
                {DynamicIcon && <DynamicIcon className="w-8 h-8 text-white" />}
              </span>
              <span>{listOfPageNames[index]}</span>
            </a>
          );
        } else {
          return (
            <a
              key={index}
              href={pagePath}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition"
            >
              {DynamicIcon && <DynamicIcon className="w-8 h-8" />}
              <span>{listOfPageNames[index]}</span>
            </a>
          );
        }
      })}
    </div>
  );
}

export default function navAndSidebar({ pageInfo, user, sidebarHeight = "h-screen", children }: pageInfoProps) {
  const [title, titleDescription, highlightLink] = pageInfo;
  const [name, profilePicLink, notificationNumber, purchasePlan] = user;

  return (
    <div>
      <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
        {/* */}
        <aside className={`hidden lg:flex flex-col w-64 bg-[#0a0e2e] text-slate-300 sticky top-0 ${sidebarHeight}`}>
          {/* */}
          <div className="flex items-center gap-3 px-6 h-16 border-b border-white/5">
            <div className="w-9 h-9 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2 3 7v6c0 4.5 3.8 8.3 9 9 5.2-.7 9-4.5 9-9V7l-9-5Zm0 4.2 5 2.8v4c0 3-2.2 5.6-5 6.1-2.8-.5-5-3.1-5-6.1V9l5-2.8Z" />
              </svg>
            </div>
            <div className="leading-tight">
              <p className="text-white font-bold text-sm">CareerAI</p>
              <p className="text-[10px] text-slate-400">Your AI Career Assistant</p>
            </div>
          </div>

          {/* */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {customLoopForSidebarLink(highlightLink)}
          </nav>
        </aside>

        {/* */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* */}
          <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
            <div className="px-6 h-16 flex items-center justify-between gap-6">
              
              {/* Main Title Header on the left side */}
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
              </div>

              {/* User info & controls on the right side */}
              <div className="flex items-center gap-6">
                {/* */}
                <button className="relative text-slate-400 hover:text-slate-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.8 23.8 0 0 0 5.454-1.31A8.97 8.97 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.97 8.97 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24 24 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                  </svg>
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {notificationNumber}
                  </span>
                </button>
                
                <span className="w-px h-6 bg-slate-200"></span>
                
                {/* */}
                <div className="flex items-center gap-2.5">
                  <img src={profilePicLink} alt={name} className="w-9 h-9 rounded-full object-cover" />
                  <div className="leading-tight">
                    <p className="text-sm font-semibold text-slate-800">{name}</p>
                    <p className="text-[11px] text-blue-500 font-medium">{purchasePlan}</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>
          </header>

          {/* Subheading description box */}
          <div className="px-8 pt-6">
            <h3 className="text-slate-400 text-sm font-medium">{titleDescription}</h3>
          </div>

          {/* */}
          <main className="flex-1 px-8 py-6 space-y-6 overflow-y-auto">
            {children}
          </main>
        </div>

      </div>
    </div>
  );
}