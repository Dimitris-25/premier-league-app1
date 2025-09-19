import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

interface ForgotPasswordProps {
  open: boolean;
  handleClose: () => void;
}

export default function ForgotPassword({ open, handleClose }: ForgotPasswordProps) {
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Forgot your password?</DialogTitle>
      <DialogContent>
        Enter your email to receive a reset link.
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
