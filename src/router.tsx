import { createBrowserRouter } from "react-router"
import RootLayout from "@/layouts/RootLayout"
import HomePage from "@/pages/HomePage"
import GalleryPage from "@/pages/GalleryPage"
import ColoringPage from "@/pages/ColoringPage"
import RabbitHuntPage from "@/pages/RabbitHuntPage"
import NailSalonPage from "@/pages/NailSalonPage"

export const router = createBrowserRouter(
  [
    {
      element: <RootLayout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: "coloring", element: <GalleryPage /> },
        { path: "coloring/:id", element: <ColoringPage /> },
        { path: "rabbit-hunt", element: <RabbitHuntPage /> },
        { path: "nail-salon", element: <NailSalonPage /> },
      ],
    },
  ],
  { basename: "/colorir-game/" },
)
