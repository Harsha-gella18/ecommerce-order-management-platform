import { useSelector } from 'react-redux';
import { Navbar } from '../components/layout/Navbar.jsx';
import { AdminSidebar } from '../components/layout/AdminSidebar.jsx';
import { AppFooter } from '../components/layout/AppFooter.jsx';
import { AnimatedOutlet } from '../components/layout/AnimatedOutlet.jsx';

export function AdminLayout() {
  const collapsed = useSelector((s) => s.ui.adminSidebarCollapsed);
  const mainMargin = collapsed ? 'lg:ml-20' : 'lg:ml-64';

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar variant="admin" />
      <div className="flex flex-1 pt-[4.25rem]">
        <AdminSidebar />
        <main className={`flex-1 min-w-0 transition-all duration-300 ${mainMargin}`}>
          <div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full min-h-[70vh]">
            <AnimatedOutlet />
          </div>
        </main>
      </div>
      <AppFooter variant="admin" />
    </div>
  );
}
