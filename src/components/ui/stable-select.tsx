import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface StableSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  children: React.ReactNode
}

interface StableSelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

const StableSelectContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}>({
  isOpen: false,
  setIsOpen: () => {},
})

export function StableSelect({ value, onValueChange, placeholder, className, children }: StableSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const selectRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selectedItem = React.Children.toArray(children).find((child) => {
    if (React.isValidElement(child) && typeof child.props.value === 'string') {
      return child.props.value === value
    }
    return false
  })

  const selectedText = React.isValidElement(selectedItem) ? selectedItem.props.children : placeholder

  return (
    <StableSelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
      <div className="relative" ref={selectRef}>
        <button
          type="button"
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={value ? "" : "text-muted-foreground"}>
            {selectedText}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-[9999] mt-1 max-h-60 overflow-auto rounded-md border bg-white shadow-lg">
            <div className="p-1">
              {children}
            </div>
          </div>
        )}
      </div>
    </StableSelectContext.Provider>
  )
}

export function StableSelectItem({ value, children, className }: StableSelectItemProps) {
  const { value: selectedValue, onValueChange, setIsOpen } = React.useContext(StableSelectContext)
  const isSelected = selectedValue === value

  const handleClick = () => {
    onValueChange?.(value)
    setIsOpen(false)
  }

  return (
    <div
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 text-gray-900",
        className
      )}
      onClick={handleClick}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  )
}