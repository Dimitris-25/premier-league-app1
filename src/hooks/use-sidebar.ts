import * as React from "react"
import { SidebarContext, type SidebarContextProps } from "../components/context/sidebar-context"

export function useSidebar(): SidebarContextProps {
  const ctx = React.useContext(SidebarContext)
  if (!ctx) throw new Error("useSidebar must be used within a SidebarProvider.")
  return ctx
}

