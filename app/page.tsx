"use client"

import { useEffect, useState } from "react"
import App from "../App"

export default function SyntheticV0PageForDeployment() {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  if (!isClient) {
    return <div>Loading...</div>
  }
  
  return <App />
}