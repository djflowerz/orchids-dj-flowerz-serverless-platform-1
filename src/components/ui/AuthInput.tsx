import * as React from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface AuthInputProps extends React.ComponentProps<"input"> {
    icon?: LucideIcon
    isValid?: boolean
    showValidation?: boolean
}

const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
    ({ className, icon: Icon, isValid, showValidation = false, ...props }, ref) => {
        return (
            <div className="relative">
                {Icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Icon size={20} />
                    </div>
                )}
                <input
                    ref={ref}
                    className={cn(
                        "w-full h-14 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-base font-medium",
                        "placeholder:text-gray-400 placeholder:font-normal",
                        "focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent",
                        "transition-all duration-200",
                        Icon ? "pl-12 pr-12" : "px-4",
                        showValidation && isValid && "border-green-500 focus:ring-green-500",
                        showValidation && !isValid && "border-red-500 focus:ring-red-500",
                        className
                    )}
                    {...props}
                />
                {showValidation && isValid !== undefined && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {isValid ? (
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )
    }
)

AuthInput.displayName = "AuthInput"

export { AuthInput }
