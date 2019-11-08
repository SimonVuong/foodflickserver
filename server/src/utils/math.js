//https://stackoverflow.com/questions/11832914/round-to-at-most-2-decimal-places-only-if-necessary

export const round2 = num => +(Math.round(num + "e+2") + "e-2");
export const round3 = num => +(Math.round(num + "e+3") + "e-3");