/** Default home route after sign-in for each role. */
export function dashboardPathForRole(role) {
  if (role === 'ADMIN') return '/admin';
  return '/dashboard';
}
