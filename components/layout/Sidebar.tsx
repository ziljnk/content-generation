"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  ChevronLeft, 
  ChevronRight, 
  PenTool, 
  Mail, 
  Bot,
  Settings,
  Menu,
  FileClock,
  Send,
  Archive,
  Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isGenerationHubOpen, setIsGenerationHubOpen] = useState(true);
  const pathname = usePathname();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleGenerationHub = () => setIsGenerationHubOpen(!isGenerationHubOpen);

  const menuItems = [
    {
      title: "Generation Hub",
      icon: Bot,
      isSubmenu: true,
      isOpen: isGenerationHubOpen,
      toggle: toggleGenerationHub,
      items: [
        { title: "Blog Post", href: "/blog", icon: PenTool },
        { title: "Email Draft", href: "/email", icon: Mail },
      ]
    },
    {
      title: "Business Profile",
      icon: Settings,
      href: "/business",
      isSubmenu: false
    },
    {
      title: "Generated Content",
      icon: FileClock,
      href: "/history",
      isSubmenu: false
    },
    {
      title: "Publishing Hub",
      icon: Send,
      href: "/publishing",
      isSubmenu: false
    },
    {
      title: "Archive Space",
      icon: Archive,
      href: "/archive",
      isSubmenu: false
    },
    {
      title: "Media Library",
      icon: ImageIcon,
      href: "/media",
      isSubmenu: false
    }
  ];

  return (
    <motion.div 
      className={cn(
        "clay-sidebar h-screen sticky top-0 flex flex-col z-50 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}
      initial={false}
      animate={{ width: isCollapsed ? 80 : 256 }}
    >
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent truncate"
          >
            ClayAI
          </motion.h1>
        )}
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {!isCollapsed && <div className="text-xs font-semibold text-gray-500 mb-4 px-2 tracking-wider">MENU</div>}
        
        {menuItems.map((item, index) => {
          const isActive = !item.isSubmenu && item.href && pathname === item.href;
          
          return (
          <div key={index} className="mb-2">
            {!isCollapsed ? (
              <>
                {item.isSubmenu ? (
                  <div 
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/50 cursor-pointer transition-colors"
                    onClick={item.toggle}
                  >
                    <div className="flex items-center gap-3 text-gray-700 font-medium">
                      <item.icon size={20} className="text-purple-600" />
                      <span>{item.title}</span>
                    </div>
                    <motion.div
                      animate={{ rotate: item.isOpen ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight size={16} />
                    </motion.div>
                  </div>
                ) : (
                  <Link 
                    href={item.href!}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors",
                      isActive ? "bg-white clay-card text-purple-700" : "hover:bg-white/50 text-gray-700 font-medium"
                    )}
                  >
                     <div className="flex items-center gap-3">
                      <item.icon size={20} className={isActive ? "text-purple-700" : "text-purple-600"} />
                      <span>{item.title}</span>
                    </div>
                  </Link>
                )}

                <AnimatePresence>
                  {item.isSubmenu && item.isOpen && item.items && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-9 mt-1 space-y-1">
                        {item.items.map((subItem, subIndex) => (
                          <Link 
                            key={subIndex} 
                            href={subItem.href}
                            className={cn(
                              "block px-3 py-2 rounded-lg text-sm transition-colors",
                              pathname === subItem.href 
                                ? "bg-purple-100 text-purple-700 font-semibold" 
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <subItem.icon size={16} />
                              {subItem.title}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              // Collapsed View
              <div className="flex flex-col gap-2 items-center">
                {item.isSubmenu && item.items ? (
                   item.items.map((subItem, i) => (
                        <Link key={i} href={subItem.href} className={cn(
                            "p-3 rounded-xl transition-all duration-200",
                            pathname === subItem.href
                                ? "clay-button shadow-none text-white bg-purple-600" 
                                : "hover:bg-gray-100 text-gray-500"
                        )} title={subItem.title}>
                            <subItem.icon size={20} />
                        </Link>
                   ))
                ) : (
                    <Link href={item.href!} className={cn(
                        "p-3 rounded-xl transition-all duration-200",
                         isActive
                            ? "clay-button shadow-none text-white bg-purple-600" 
                            : "hover:bg-gray-100 text-gray-500"
                    )} title={item.title}>
                        <item.icon size={20} />
                    </Link>
                )}
              </div>
            )}
          </div>
        )})}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <Link 
            href="/settings"
            className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/50 cursor-pointer transition-colors",
                isCollapsed ? "justify-center" : "",
                pathname === "/settings" ? "bg-white clay-card text-purple-700" : "text-gray-700"
            )}
        >
            <Settings size={20} className={pathname === "/settings" ? "text-purple-700" : "text-gray-500"} />
            {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
        </Link>
      </div>
    </motion.div>
  );
}
