import { useEthPrice } from "@components/hooks/useEthPrice"
import { useEffect, useState } from "react"


const useCounter = () => {
  console.log("Calling useEffect!")
  const [count, setCount] = useState(0)

  useEffect(() => {
    console.log("Calling useEffect!")
    setInterval(() => {
      setCount(c => c + 1)
    }, 1000)
  }, [])


  return count
}


const SimpleComponent = () => {
  // const count = useCounter()
  const { eth } = useEthPrice()

  return (
    <h1>Simple Component - {eth.data}</h1>
  )
}


export default function HooksPage() {
  const count = useCounter()
  const { eth } = useEthPrice()

  return (
    <>
      <h1>{count}</h1>
      <h1>Hello World - {eth.data}</h1>
      <SimpleComponent />
    </>
  )
}