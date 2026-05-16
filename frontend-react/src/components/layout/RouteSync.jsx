import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setSidebarOpen } from '../../redux/slices/uiSlice.js';

/** Close mobile drawer overlay when the URL changes so it cannot cover the next screen. */
export function RouteSync() {
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setSidebarOpen(false));
  }, [pathname, dispatch]);
  return null;
}
