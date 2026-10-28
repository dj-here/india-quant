import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMinorUnitsToDisplay(minor: number, currency: string = 'INR'): string {
  const amount = (minor || 0) / 100;
  if (currency === 'INR') {
    return Number.isInteger(amount)
      ? `₹${amount.toLocaleString('en-IN')}`
      : `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency,
  });
}

// Keep formatCentsToDollars as alias to formatMinorUnitsToDisplay for backwards compatibility
export const formatCentsToDollars = (minor: number) => formatMinorUnitsToDisplay(minor, 'INR');
