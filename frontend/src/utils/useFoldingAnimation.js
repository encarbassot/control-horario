import { useEffect, useRef, useState } from "react"

function useFoldingAnimation(initialOpenState = false) {
  const [isFilterOpen, setIsFilterOpen] = useState(initialOpenState)
  const [isFilterClosing, setIsFilterClosing] = useState(false)
  const [filterHeight, setFilterHeight] = useState(0)
  const filterRef = useRef(null)

  useEffect(() => {
    if (!isFilterOpen || isFilterClosing) return

    const el = filterRef.current
    if (!el) return

    setFilterHeight(0)

    requestAnimationFrame(() => {
      setFilterHeight(el.scrollHeight)
    })
  }, [isFilterOpen])

  function handleToggleFilter() {
    const el = filterRef.current

    if (!isFilterOpen) {
      setIsFilterOpen(true)
      setIsFilterClosing(false)
    } else {
      if (!el) return

      setIsFilterClosing(true)
      setFilterHeight(el.scrollHeight)

      requestAnimationFrame(() => {
        setFilterHeight(0)
      })

      setTimeout(() => {
        setIsFilterOpen(false)
        setIsFilterClosing(false)
        setFilterHeight(0)
      }, 300) // debe coincidir con el CSS
    }
  }

  return {
    isFilterOpen,
    isFilterClosing,
    filterHeight,
    filterRef,
    handleToggleFilter,
  }
}

export default useFoldingAnimation
