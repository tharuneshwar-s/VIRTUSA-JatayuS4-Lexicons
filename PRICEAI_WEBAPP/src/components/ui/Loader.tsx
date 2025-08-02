import { Loader2 } from 'lucide-react'
import React from 'react'

function Loader({ className = "" }: { className?: string }) {
  return (
    <div className={` ${className}`}>
      {/* Loader */}
      <Loader2 className="h-7 w-7 text-priceai-lightblue animate-spin" />
    </div>
  )
}

export default Loader