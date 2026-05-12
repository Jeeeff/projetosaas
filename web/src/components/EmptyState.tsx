import { Box, Typography, type SvgIconProps } from '@mui/material';
import { type ReactElement, type ReactNode } from 'react';

interface Props {
  icon: ReactElement<SvgIconProps>;
  title: string;
  description?: string;
  action?: ReactNode;
}

const EmptyState = ({ icon, title, description, action }: Props) => (
  <Box className="flex flex-col items-center justify-center py-16 text-center">
    <Box
      sx={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        backgroundColor: 'action.hover',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 2,
      }}
    >
      {icon}
    </Box>
    <Typography variant="h6" fontWeight={600} gutterBottom>
      {title}
    </Typography>
    {description && (
      <Typography variant="body2" color="text.secondary" sx={{ mb: action ? 3 : 0, maxWidth: 380 }}>
        {description}
      </Typography>
    )}
    {action}
  </Box>
);

export default EmptyState;
