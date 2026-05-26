import { Icon } from "@/components/ui/Icon"

type DeleteSceneButtonProps = {
    onClearClick?: () => void
    clearDisabled?: boolean
}

export function DeleteSceneButton({ onClearClick, clearDisabled }: DeleteSceneButtonProps) {
    return (
        <button
            type="button"
            onClick={onClearClick}
            disabled={clearDisabled}
            className="flex h-20 w-20 items-center justify-center rounded-full border border-red-300/40 bg-[#1F2126]/90 transition hover:cursor-pointer enabled:hover:bg-[#2A2D31] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Leeg scene"
            title="Leeg scene"
        >
            <Icon name="Trash2" size={30} color="#FCA5A5" />
        </button>
    )
}