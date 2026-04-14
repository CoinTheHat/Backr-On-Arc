export function formatPrice(amount: string | number, currency: string = 'USD'): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return `0.00 ${currency}`;

    // Ensure 2 decimal places max, but preserve integers if cleaner? 
    // Requirement says "standardize". Let's go with 2 decimals for consistency.
    // e.g. 5.00 MNT, 0.10 MNT
    return `${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

export function formatPlural(count: number, singular: string, plural?: string): string {
    if (count === 1) return `${count} ${singular}`;
    return `${count} ${plural || singular + 's'}`;
}
