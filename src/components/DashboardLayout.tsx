import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalSearch from "@/components/GlobalSearch";
import {
  Menu, X, LogOut, Home, Users, BookOpen, ClipboardCheck,
  FileText, Bell, Settings, BarChart3, Key, GraduationCap,
  DollarSign, User, Receipt, MessageSquare, Trophy, Newspaper, Image, History, ShieldAlert, ShieldCheck,
  CalendarDays, Library, Sparkles, Award
} from "lucide-react";
import schoolLogo from "@/assets/school-logo.png";
import NotificationBell from "@/components/NotificationBell";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  section?: string;
}

const teacherNav: NavItem[] = [
  { label: "Dashboard", path: "/teacher", icon: Home, section: "Main" },
  { label: "My Classes", path: "/teacher/classes", icon: Users, section: "Academics" },
  { label: "Timetable", path: "/teacher/timetable", icon: CalendarDays, section: "Academics" },
  { label: "Set Grades", path: "/teacher/grades", icon: BookOpen, section: "Academics" },
  { label: "Monthly Tests", path: "/teacher/monthly-tests", icon: BarChart3, section: "Academics" },
  { label: "Rankings", path: "/teacher/rankings", icon: Trophy, section: "Academics" },
  { label: "Attendance", path: "/teacher/attendance", icon: ClipboardCheck, section: "Academics" },
  { label: "Report Cards", path: "/teacher/reports", icon: FileText, section: "Academics" },
  { label: "Behavior Points", path: "/teacher/behavior", icon: Award, section: "Engagement" },
  { label: "Library", path: "/teacher/library", icon: Library, section: "Engagement" },
  { label: "Events", path: "/teacher/events", icon: CalendarDays, section: "Engagement" },
  { label: "Messages", path: "/teacher/messages", icon: MessageSquare, section: "Communication" },
  { label: "Announcements", path: "/teacher/announcements", icon: Bell, section: "Communication" },
  { label: "Record Book", path: "/teacher/record-book", icon: BookOpen, section: "Tools" },
  { label: "Teaching AI", path: "/teacher/ai-assistant", icon: Sparkles, section: "Tools" },
  { label: "Verify Documents", path: "/teacher/verify", icon: ShieldCheck, section: "Tools" },
  { label: "Settings", path: "/teacher/profile", icon: Settings, section: "Account" },
];

const studentNav: NavItem[] = [
  { label: "Dashboard", path: "/student", icon: Home, section: "Main" },
  { label: "My Timetable", path: "/student/timetable", icon: CalendarDays, section: "Academics" },
  { label: "My Grades", path: "/student/grades", icon: BookOpen, section: "Academics" },
  { label: "Rankings", path: "/student/rankings", icon: Trophy, section: "Academics" },
  { label: "Attendance", path: "/student/attendance", icon: ClipboardCheck, section: "Academics" },
  { label: "Report Cards", path: "/student/reports", icon: FileText, section: "Academics" },
  { label: "Behavior Points", path: "/student/behavior", icon: Award, section: "Engagement" },
  { label: "Library", path: "/student/library", icon: Library, section: "Engagement" },
  { label: "Events", path: "/student/events", icon: CalendarDays, section: "Engagement" },
  { label: "Study Pal AI", path: "/student/study-pal", icon: Sparkles, section: "Tools" },
  { label: "Messages", path: "/student/messages", icon: MessageSquare, section: "Communication" },
  { label: "Announcements", path: "/student/announcements", icon: Bell, section: "Communication" },
  { label: "Fees", path: "/student/fees", icon: DollarSign, section: "Account" },
  { label: "Verify Documents", path: "/student/verify", icon: ShieldCheck, section: "Account" },
  { label: "Settings", path: "/student/profile", icon: Settings, section: "Account" },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", path: "/admin", icon: Home, section: "Overview" },
  { label: "Users", path: "/admin/users", icon: Users, section: "People" },
  { label: "Students", path: "/admin/students", icon: GraduationCap, section: "People" },
  { label: "Staff Management", path: "/admin/staff-management", icon: User, section: "People" },
  { label: "Applications", path: "/admin/applications", icon: FileText, section: "People" },
  { label: "Classes", path: "/admin/classes", icon: GraduationCap, section: "Academics" },
  { label: "Subjects", path: "/admin/subjects", icon: BookOpen, section: "Academics" },
  { label: "Timetable", path: "/admin/timetable", icon: CalendarDays, section: "Academics" },
  { label: "Grades Overview", path: "/admin/grades", icon: BarChart3, section: "Academics" },
  { label: "Rankings", path: "/admin/rankings", icon: Trophy, section: "Academics" },
  { label: "Record Books", path: "/admin/record-books", icon: BookOpen, section: "Academics" },
  { label: "Behavior Points", path: "/admin/behavior", icon: Award, section: "Engagement" },
  { label: "Library", path: "/admin/library", icon: Library, section: "Engagement" },
  { label: "Events", path: "/admin/events", icon: CalendarDays, section: "Engagement" },
  { label: "Fee Management", path: "/admin/fees", icon: DollarSign, section: "Finance" },
  { label: "Finance & Petty Cash", path: "/admin/finance", icon: Receipt, section: "Finance" },
  { label: "Messages", path: "/admin/messages", icon: MessageSquare, section: "Communication" },
  { label: "Announcements", path: "/admin/announcements", icon: Bell, section: "Communication" },
  { label: "Homepage Updates", path: "/admin/homepage", icon: Newspaper, section: "CMS" },
  { label: "Staff Gallery", path: "/admin/staff-gallery", icon: Image, section: "CMS" },
  { label: "Access Codes", path: "/admin/codes", icon: Key, section: "System" },
  { label: "Student History", path: "/admin/student-history", icon: History, section: "System" },
  { label: "AI Security", path: "/admin/security", icon: ShieldAlert, section: "System" },
  { label: "Settings", path: "/admin/settings", icon: Settings, section: "System" },
];

const parentNav: NavItem[] = [
  { label: "Dashboard", path: "/parent", icon: Home, section: "Main" },
  { label: "Timetable", path: "/parent/timetable", icon: CalendarDays, section: "Academics" },
  { label: "Grades", path: "/parent/grades", icon: BookOpen, section: "Academics" },
  { label: "Report Cards", path: "/parent/reports", icon: FileText, section: "Academics" },
  { label: "Attendance", path: "/parent/attendance", icon: ClipboardCheck, section: "Academics" },
  { label: "Behavior Points", path: "/parent/behavior", icon: Award, section: "Engagement" },
  { label: "Library Loans", path: "/parent/library", icon: Library, section: "Engagement" },
  { label: "Events", path: "/parent/events", icon: CalendarDays, section: "Engagement" },
  { label: "Fees", path: "/parent/fees", icon: DollarSign, section: "Account" },
  { label: "Messages", path: "/parent/messages", icon: MessageSquare, section: "Communication" },
  { label: "Verify Documents", path: "/parent/verify", icon: ShieldCheck, section: "Account" },
  { label: "Settings", path: "/parent/settings", icon: Settings, section: "Account" },
];

interface DashboardLayoutProps {
  children: ReactNode;
  role: "teacher" | "student" | "admin" | "parent";
}

const DashboardLayout = ({ children, role }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = role === "admin" ? adminNav : role === "teacher" ? teacherNav : role === "parent" ? parentNav : studentNav;
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  // Group nav items by section
  const grouped = navItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    const key = item.section || "More";
    (acc[key] ||= []).push(item);
    return acc;
  }, {});

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-frosted-mesh">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 glass-tinted text-primary-foreground transform transition-transform duration-300 lg:translate-x-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 p-5 border-b border-white/10 shrink-0">
          <div className="h-10 w-10 rounded bg-white/10 backdrop-blur p-1 flex items-center justify-center">
            <img src={schoolLogo} alt="Logo" className="h-8 w-8 object-contain" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="font-display font-semibold text-sm text-white truncate">St. Mary's</p>
            <p className="font-accent italic text-[11px] text-[hsl(43_78%_70%)] truncate">{roleLabel} Portal</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-white/70" aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="px-3 py-5 space-y-5 overflow-y-auto flex-1 min-h-0">
          {Object.entries(grouped).map(([section, items]) => (
            <div key={section}>
              <p className="px-3 mb-2 font-body text-[10px] uppercase tracking-[0.22em] font-semibold text-[hsl(43_78%_65%)]/70">
                {section}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded text-[13px] font-medium transition-all duration-300 ease-editorial ${
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-white/65 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] bg-[hsl(var(--secondary))]" />}
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-white/15 shrink-0">
          <Button
            variant="ghost"
            className="w-full justify-start text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64 min-w-0">
        <header className="sticky top-0 z-30 glass-header h-16 flex items-center px-3 sm:px-4 gap-2 sm:gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground shrink-0" aria-label="Open menu">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <GlobalSearch role={role} />
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <NotificationBell />
            <ThemeToggle />
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-foreground leading-tight truncate max-w-[140px]">{profile?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
            <button
              onClick={() => {
                const settingsPath =
                  role === "admin" ? "/admin/settings" : role === "teacher" ? "/teacher/profile" : role === "parent" ? "/parent/settings" : "/student/profile";
                navigate(settingsPath);
              }}
              className="cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
              title="Open Settings"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-9 h-9 rounded-full object-cover border-2 border-white/60 shadow hover:border-primary transition-colors"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-primary-foreground text-sm font-bold shadow hover:opacity-90 transition-opacity">
                  {(profile?.full_name || "U").charAt(0)}
                </div>
              )}
            </button>
          </div>
        </header>

        <main className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
