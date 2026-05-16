import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { MarketingLayout } from '../layouts/MarketingLayout.jsx';
import { AuthLayout } from '../layouts/AuthLayout.jsx';
import { CustomerLayout } from '../layouts/CustomerLayout.jsx';
import { PublicStoreLayout } from '../layouts/PublicStoreLayout.jsx';
import { AdminLayout } from '../layouts/AdminLayout.jsx';
import { LandingGate } from '../components/LandingGate.jsx';
import { LoginPage } from '../pages/LoginPage.jsx';
import { SignupPage } from '../pages/SignupPage.jsx';
import { CustomerDashboard } from '../pages/CustomerDashboard.jsx';
import { ProductListPage } from '../pages/ProductListPage.jsx';
import { ProductDetailPage } from '../pages/ProductDetailPage.jsx';
import { CartPage } from '../pages/CartPage.jsx';
import { CheckoutPage } from '../pages/CheckoutPage.jsx';
import { PaymentPage } from '../pages/PaymentPage.jsx';
import { MyOrdersPage } from '../pages/MyOrdersPage.jsx';
import { OrderTrackingPage } from '../pages/OrderTrackingPage.jsx';
import { WishlistPage } from '../pages/WishlistPage.jsx';
import { ProfilePage } from '../pages/ProfilePage.jsx';
import { NotificationsPage } from '../pages/NotificationsPage.jsx';
import { AdminDashboard } from '../pages/AdminDashboard.jsx';
import { ManageProductsPage } from '../pages/ManageProductsPage.jsx';
import { ManageInventoryPage } from '../pages/ManageInventoryPage.jsx';
import { ManageOrdersPage } from '../pages/ManageOrdersPage.jsx';
import { AnalyticsPage } from '../pages/AnalyticsPage.jsx';
import { AdminCustomersPage } from '../pages/AdminCustomersPage.jsx';
import { AdminPaymentsPage } from '../pages/AdminPaymentsPage.jsx';
import { AdminNotificationCenterPage } from '../pages/AdminNotificationCenterPage.jsx';
import { AdminReportsPage } from '../pages/AdminReportsPage.jsx';
import { AdminSettingsPage } from '../pages/AdminSettingsPage.jsx';
import { dashboardPathForRole } from '../utils/dashboardPath.js';
import { PageLoader } from '../components/ui/Spinner.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: 'protected' }} />;
  return children;
}

function CustomerOnly({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  return children;
}

function AdminOnly({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: 'admin' }} />;
  if (!isAdmin) return <Navigate to={dashboardPathForRole(user.role)} replace />;
  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<LandingGate />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route element={<PublicStoreLayout />}>
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
      </Route>

      <Route element={<CustomerLayout />}>
        <Route
          path="/dashboard"
          element={
            <Protected>
              <CustomerOnly>
                <CustomerDashboard />
              </CustomerOnly>
            </Protected>
          }
        />
        <Route
          path="/cart"
          element={
            <Protected>
              <CustomerOnly>
                <CartPage />
              </CustomerOnly>
            </Protected>
          }
        />
        <Route
          path="/checkout"
          element={
            <Protected>
              <CustomerOnly>
                <CheckoutPage />
              </CustomerOnly>
            </Protected>
          }
        />
        <Route
          path="/payment/:orderId"
          element={
            <Protected>
              <CustomerOnly>
                <PaymentPage />
              </CustomerOnly>
            </Protected>
          }
        />
        <Route
          path="/orders"
          element={
            <Protected>
              <CustomerOnly>
                <MyOrdersPage />
              </CustomerOnly>
            </Protected>
          }
        />
        <Route
          path="/orders/:id/track"
          element={
            <Protected>
              <CustomerOnly>
                <OrderTrackingPage />
              </CustomerOnly>
            </Protected>
          }
        />
        <Route
          path="/wishlist"
          element={
            <Protected>
              <CustomerOnly>
                <WishlistPage />
              </CustomerOnly>
            </Protected>
          }
        />
        <Route
          path="/profile"
          element={
            <Protected>
              <ProfilePage />
            </Protected>
          }
        />
        <Route
          path="/notifications"
          element={
            <Protected>
              <NotificationsPage />
            </Protected>
          }
        />
      </Route>

      <Route element={<AdminLayout />}>
        <Route
          path="/admin"
          element={
            <AdminOnly>
              <AdminDashboard />
            </AdminOnly>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminOnly>
              <ManageProductsPage />
            </AdminOnly>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <AdminOnly>
              <ManageInventoryPage />
            </AdminOnly>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminOnly>
              <ManageOrdersPage />
            </AdminOnly>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <AdminOnly>
              <AdminCustomersPage />
            </AdminOnly>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <AdminOnly>
              <AdminPaymentsPage />
            </AdminOnly>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <AdminOnly>
              <AnalyticsPage />
            </AdminOnly>
          }
        />
        <Route
          path="/admin/notification-center"
          element={
            <AdminOnly>
              <AdminNotificationCenterPage />
            </AdminOnly>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <AdminOnly>
              <AdminReportsPage />
            </AdminOnly>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminOnly>
              <AdminSettingsPage />
            </AdminOnly>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
