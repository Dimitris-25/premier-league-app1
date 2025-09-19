import * as React from "react";
import GoogleIconBase from "@mui/icons-material/Google";
import FacebookIconBase from "@mui/icons-material/Facebook";
import { SvgIcon, type SvgIconProps } from "@mui/material";

// Google with custom color
export function GoogleIcon(props: SvgIconProps) {
  return <GoogleIconBase {...props} sx={{ color: "#DB4437", ...props.sx }} />;
}

// Facebook with custom color
export function FacebookIcon(props: SvgIconProps) {
  return <FacebookIconBase {...props} sx={{ color: "#1877F2", ...props.sx }} />;
}

// Placeholder for (Sitemark)
export function SitemarkIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#4F46E5" />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontSize="10"
        fontFamily="Arial"
        fill="white"
      >
        S
      </text>
    </SvgIcon>
  );
}
