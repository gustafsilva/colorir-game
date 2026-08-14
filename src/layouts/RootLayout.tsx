import { Outlet } from "react-router"
import RotateDeviceOverlay from "@/components/RotateDeviceOverlay"

export default function RootLayout() {
  return (
    <main className="min-h-svh text-foreground">
      <Outlet />
      <RotateDeviceOverlay />
    </main>
  )
}
