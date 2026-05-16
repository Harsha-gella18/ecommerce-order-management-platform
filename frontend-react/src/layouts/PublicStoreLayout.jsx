import { Navbar } from '../components/layout/Navbar.jsx';
import { AppFooter } from '../components/layout/AppFooter.jsx';
import { AnimatedOutlet } from '../components/layout/AnimatedOutlet.jsx';

export function PublicStoreLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-navy bg-gradient-mesh">
      <Navbar variant="customer" />
      <main className="flex-1 pt-[4.25rem]">
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <AnimatedOutlet />
        </div>
      </main>
      <AppFooter variant="customer" />
    </div>
  );
}
