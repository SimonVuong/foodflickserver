import { ObjectID } from 'mongodb';

export const getManagedRestQuery = userId => ({
  $or: [
    {'managers.userId': userId}, 
    {'owner.userId': userId}
  ],
});

export const getManagedRestByIdQuery = (restId, userId) => ({
  _id: new ObjectID(restId),
  ...getManagedRestQuery(userId)
})