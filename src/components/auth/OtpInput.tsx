'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    onComplete?: (value: string) => void;
    disabled?: boolean;
}

export function OtpInput({
    length = 6,
    value,
    onChange,
    onComplete,
    disabled = false,
}: OtpInputProps) {
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, inputValue: string) => {
        // Only allow digits
        const digit = inputValue.replace(/\D/g, '');

        if (digit.length > 1) {
            // Handle paste
            const pastedValue = digit.slice(0, length);
            onChange(pastedValue);

            // Focus last filled input or last input
            const nextIndex = Math.min(pastedValue.length, length - 1);
            inputRefs.current[nextIndex]?.focus();

            if (pastedValue.length === length && onComplete) {
                onComplete(pastedValue);
            }
            return;
        }

        const newValue = value.split('');
        newValue[index] = digit;
        const newOtp = newValue.join('').slice(0, length);

        onChange(newOtp);

        // Auto-focus next input
        if (digit && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Call onComplete when all digits are filled
        if (newOtp.length === length && onComplete) {
            onComplete(newOtp);
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!value[index] && index > 0) {
                // Focus previous input on backspace if current is empty
                inputRefs.current[index - 1]?.focus();
            } else {
                // Clear current digit
                const newValue = value.split('');
                newValue[index] = '';
                onChange(newValue.join(''));
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
        onChange(pastedData);

        if (pastedData.length === length && onComplete) {
            onComplete(pastedData);
        }
    };

    return (
        <div className="flex gap-3 justify-center">
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[index] || ''}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className={cn(
                        'w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold',
                        'rounded-xl border-2 border-gray-300',
                        'focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent',
                        'transition-all duration-200',
                        'disabled:bg-gray-100 disabled:cursor-not-allowed',
                        value[index] && 'border-black'
                    )}
                    autoComplete="off"
                />
            ))}
        </div>
    );
}
