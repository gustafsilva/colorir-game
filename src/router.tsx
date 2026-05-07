import { createBrowserRouter } from "react-router"
import RootLayout from "@/layouts/RootLayout"
import GalleryPage from "@/pages/GalleryPage"
import ColoringPage from "@/pages/ColoringPage"

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <GalleryPage /> },
      { path: "coloring/:id", element: <ColoringPage /> },
    ],
  },
])
