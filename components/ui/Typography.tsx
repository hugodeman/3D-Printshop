type Props = {
    children: React.ReactNode
    className?: string
}

export function H1({ children, className }: Props) {
    return (
        <h1 className={`text-h1 font-semibold text-white ${className}`}>
            {children}
        </h1>
    )
}

export function H2({ children, className }: Props) {
    return (
        <h2 className={`text-h2 font-medium text-white ${className}`}>
            {children}
        </h2>
    )
}

export function H3({ children, className }: Props) {
    return (
        <h3 className={`text-h3 font-medium text-white ${className}`}>
            {children}
        </h3>
    )
}

export function P({ children, className }: Props) {
    return (
        <p className={`text-p text-white ${className}`}>
            {children}
        </p>
    )
}