import { useState } from "react"
import { useScroll, useMotionValueEvent } from "framer-motion"

export function useNavbarScroll() {
    const [hidden, setHidden] = useState(false)
    const { scrollY } = useScroll()

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious()
        if (latest > previous && latest > 80) {
            setHidden(true)
        } else {
            setHidden(false)
        }
    })

    return { hidden }
}
