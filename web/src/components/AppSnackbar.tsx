import { Alert, Snackbar } from '@mui/material';

interface Props {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
  onClose: () => void;
}

const AppSnackbar = ({ open, message, severity, onClose }: Props) => (
  <Snackbar
    open={open}
    autoHideDuration={4000}
    onClose={onClose}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
  >
    <Alert severity={severity} variant="filled" onClose={onClose}>
      {message}
    </Alert>
  </Snackbar>
);

export default AppSnackbar;
