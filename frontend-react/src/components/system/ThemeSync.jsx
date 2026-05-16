import { useEffect } from 'react';
import { useSelector } from 'react-redux';

export function ThemeSync() {
  const theme = useSelector((s) => s.ui.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  return null;
}
