import { useState, useCallback } from 'react';

type Severity = 'success' | 'error';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: Severity;
}

const CLOSED: SnackbarState = { open: false, message: '', severity: 'success' };

export const useSnackbar = () => {
  const [snackbar, setSnackbar] = useState<SnackbarState>(CLOSED);

  const showSnackbar = useCallback((message: string, severity: Severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar((s) => ({ ...s, open: false }));
  }, []);

  return { snackbar, showSnackbar, closeSnackbar };
};
