import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { motion } from "motion/react";
import {
  MessageSquare,
  Megaphone,
  Search,
  Settings,
  Plus,
  Pin,
  PinOff
} from "lucide-react";
import { Link, useLocation } from "react-router";
import { useUiStore } from "@/stores/uiStore";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  animate = true,
}: {
  children: React.ReactNode;
  animate?: boolean;
}) => {
  const { isSidebarPinned } = useUiStore();
  const [openState, setOpenState] = useState(false);

  // If pinned, it's always open. Otherwise, follow the hover state.
  const open = isSidebarPinned || openState;
  const setOpen = setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const DynamicSidebar = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const location = useLocation();
  const links: Links[] = [
    {
      label: "Chats",
      href: "/chats",
      icon: <MessageSquare className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />,
    },
    {
      label: "News",
      href: "/announcements",
      icon: <Megaphone className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />,
    },
    {
      label: "Find",
      href: "/search",
      icon: <Search className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />,
    },
    {
      label: "New Chat",
      href: "/add",
      icon: <Plus className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />,
    },
  ];

  return (
    <SidebarProvider animate={true}>
      <div className="flex h-full w-full">
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-8 px-2 relative transition-all duration-300">
              <Logo />
              <SidebarToggle />
            </div>
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} active={location.pathname.startsWith(link.href)} />
              ))}
            </div>
          </div>
          <div>
            {/* Potential User Profile or Footer Link could go here */}
          </div>
        </SidebarBody>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
};

export const SidebarToggle = () => {
  const { isSidebarPinned, toggleSidebarPinned } = useUiStore();
  const { open } = useSidebar();

  if (!open) return null;

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={(e) => {
        e.stopPropagation();
        toggleSidebarPinned();
      }}
      className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors group"
      title={isSidebarPinned ? "Unpin sidebar" : "Pin sidebar"}
    >
      {isSidebarPinned ? (
        <div className="relative">
          <Pin className="h-4 w-4 text-primary fill-primary/10 rotate-45" />
          <div className="absolute -inset-0.5 bg-primary/20 rounded-full blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ) : (
        <PinOff className="h-4 w-4 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300" />
      )}
    </motion.button>
  );
};

export const SidebarBody = ({ className, children, ...props }: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  const { isSidebarPinned } = useUiStore();

  return (
    <motion.div
      className={cn(
        "h-full px-2 py-4 hidden md:flex md:flex-col bg-white dark:bg-[#212023] shrink-0 shadow-sm z-30",
        className
      )}
      animate={{
        width: animate ? (open ? "280px" : "80px") : "280px",
      }}
      onMouseEnter={() => !isSidebarPinned && setOpen(true)}
      onMouseLeave={() => !isSidebarPinned && setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const SidebarLink = ({
  link,
  className,
  active,
  ...props
}: {
  link: Links;
  className?: string;
  active?: boolean;
}) => {
  const { open, animate } = useSidebar();
  return (
    <Link
      to={link.href}
      className={cn(
        "flex items-center justify-start gap-3 group/sidebar py-3 px-3 rounded-xl transition-all duration-200",
        active
          ? "bg-primary/70 text-primary shadow-sm"
          : "hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100",
        className
      )}
      {...props}
    >
      <div className={cn(
        "transition-transform duration-200 p-2",
        active && 
        !open && "mx-auto"
      )}>
        {React.isValidElement(link.icon) && React.cloneElement(link.icon as React.ReactElement<any>, {
          className: cn(
            (link.icon.props as any).className,
            active ? "text-primary fill-white" : "text-neutral-500 fill-white group-hover/sidebar:text-neutral-700 dark:group-hover/sidebar:text-neutral-300"
          )
        })}
      </div>

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className={cn(
          "text-sm font-medium whitespace-pre transition duration-150 inline-block p-0! m-0!",
          active ? "text-neutral-200" : ""
        )}
      >
        {link.label}
      </motion.span>
    </Link>
  );
};

const Logo = () => {
  const { open } = useSidebar();
  return (
    <Link
      to="/"
      className="font-thunder font-medium text-[39px] flex items-center text-white p-1 relative z-20"
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: open ? 1 : 0 }}
        className={cn(
          "whitespace-pre overflow-hidden transition-all duration-300",
          !open && "w-0"
        )}
      >
        ch
      </motion.span>
      <div className="w-auto mt-1 bg-black dark:bg-white/0 rounded-lg shrink-0 flex items-center justify-center">
        <img src="/logo/chat-it-logo.svg" alt="" className="h-4.5 w-auto invert xdark:invert-0" />
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: open ? 1 : 0 }}
        className={cn(
          "whitespace-pre overflow-hidden transition-all duration-300",
          !open && "w-0"
        )}
      >
        t it
      </motion.span>
    </Link>
  );
};
