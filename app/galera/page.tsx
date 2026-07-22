import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import GaleraContent from "./galera-content"

export default function GaleraPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <GaleraContent />
    </Suspense>
  )
}
