import { useState, useRef, useEffect, useCallback } from "react"

export function useNavbarSearch(setFilter) {
    const [searchExpanded, setSearchExpanded] = useState(false)
    const searchInputRef = useRef(null)

    const handleOpenSearch = useCallback(() => {
        if (searchExpanded) return
        setSearchExpanded(true)
        setTimeout(() => searchInputRef.current?.focus(), 100)
    }, [searchExpanded])

    const handleCloseSearch = useCallback(() => {
        if (!searchExpanded) return
        setSearchExpanded(false)
        setFilter('prompt', "")
        searchInputRef.current?.blur()
    }, [searchExpanded, setFilter])

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
    }, [searchExpanded, handleCloseSearch, handleOpenSearch])

    return {
        searchExpanded,
        searchInputRef,
        handleOpenSearch,
        handleCloseSearch
    }
}
