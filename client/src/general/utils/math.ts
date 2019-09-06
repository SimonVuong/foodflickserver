//https://stackoverflow.com/questions/11832914/round-to-at-most-2-decimal-places-only-if-necessary
export const round2 = (number: number) => Math.round( number * 1e2 ) / 1e2;
