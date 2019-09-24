export const getManagedRestQuery = userId => ({
  $or: [
    {'managers.userId': userId}, 
    {'owner.userId': userId}
  ],
});
