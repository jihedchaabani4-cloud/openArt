export function sortProjectsByRecent(projects) {
    return [...(projects || [])].sort((a, b) => {
        const left = new Date(a.updated_at || a.created_at || 0).getTime()
        const right = new Date(b.updated_at || b.created_at || 0).getTime()

        return right - left
    })
}
