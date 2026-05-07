import { useParams } from "react-router"

export default function ColoringPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="flex min-h-svh items-center justify-center">
      <h1 className="text-4xl font-bold">🖌️ Colorir: {id}</h1>
    </div>
  )
}
