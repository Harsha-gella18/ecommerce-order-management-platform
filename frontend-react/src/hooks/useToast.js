import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { pushToast } from '../redux/slices/toastSlice';

export function useToast() {
  const dispatch = useDispatch();
  return useCallback(
    (message, variant = 'info', duration) => {
      dispatch(pushToast({ message, variant, duration }));
    },
    [dispatch]
  );
}
