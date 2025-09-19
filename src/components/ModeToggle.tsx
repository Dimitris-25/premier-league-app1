import { IconButton, Tooltip } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

export default function ModeToggle(props: any) {
  const { mode, setMode } = useColorScheme?.() ?? {};
  if (!mode || !setMode) return null; // αν δεν υπάρχει CssVarsProvider

  return (
    <Tooltip title={mode === "light" ? "Dark mode" : "Light mode"}>
  <IconButton
    size="small"
  onClick={() => setMode(mode === "light" ? "dark" : "light")}
  {...props}
>
  {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
  </IconButton>
  </Tooltip>
);
}
