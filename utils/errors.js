const capitalize = string => string.charAt(0).toUpperCase() + string.slice(1)

// todo 0: change all checks for this to actually check for write perms
export const NEEDS_MANAGER_SIGN_IN_ERROR = 
  'Unauthorized. User must be signed in with a manager account. Please sign in with a manager account';

export const getRestNotFoundError = (restId) => `Restaurant id '${restId}' not found. Please try again with a valid id`;

export const NEEDS_SIGN_IN_ERROR = `Unauthorized. User must be signed in. Please sign in`;

/**
 * Capitalizes the string passed in appends to it, ' cannot be empty. Please try again with a non-empty value'
 * @param {string} value 
 * @returns String '<value> cannot be empty. Please try again with a non-empty value'
 */
export const getCannotBeEmptyError = value => `${capitalize(value)} cannot be empty. Please try again with a non-empty value`;
