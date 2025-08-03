import * as React from "react"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline'
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const baseClasses = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2"
    
    const variantClasses = {
      default: "border-transparent bg-gray-900 text-gray-50 hover:bg-gray-800",
      secondary: "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200",
      outline: "text-gray-950 border-gray-200"
    }
    
    return (
      <div
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${className || ''}`}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge }