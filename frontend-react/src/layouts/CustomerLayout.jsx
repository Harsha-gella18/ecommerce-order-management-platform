import { Navbar } from '../components/layout/Navbar.jsx';
import { CustomerSidebar } from '../components/layout/CustomerSidebar.jsx';
import { AppFooter } from '../components/layout/AppFooter.jsx';
import { AnimatedOutlet } from '../components/layout/AnimatedOutlet.jsx';

export function CustomerLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-navy bg-gradient-mesh">
      <Navbar variant="customer" />
      <div className="flex flex-1 pt-[4.25rem]">
        <CustomerSidebar />
        <main className="flex-1 lg:ml-64 min-w-0">
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            <AnimatedOutlet />
          </div>
        </main>
      </div>
      <AppFooter variant="customer" />
    </div>
  );
}
