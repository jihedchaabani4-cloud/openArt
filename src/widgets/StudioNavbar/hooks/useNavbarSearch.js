import { useState, useRef, useEffect } from "react"

export function useNavbarSearch(setFilter) {
    const [searchExpanded, setSearchExpanded] = useState(false)
    const searchInputRef = useRef(null)

    const handleOpenSearch = () => {
        if (searchExpanded) return
        setSearchExpanded(true)
        setTimeout(() => searchInputRef.current?.focus(), 100)
    }

    const handleCloseSearch = () => {
        if (!searchExpanded) return
        setSearchExpanded(false)
        setFilter('prompt', "")
        searchInputRef.current?.blur()
    }

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === "Escape" && searchExpanded) handleCloseSearch()
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                searchExpanded ? handleCloseSearch() : handleOpenSearch()
            }
        }
        window.addEventListener("keydown", handleKey)
        return () => window.removeEventListener("keydown", handleKey)
    }, [searchExpanded])

    return {
        searchExpanded,
        searchInputRef,
        handleOpenSearch,
        handleCloseSearch
    }
}
