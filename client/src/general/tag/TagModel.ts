export interface Tag {
  _id: string;
  name: string,
  count: number,
};

export abstract class TagSelector {
  static getId = (tag: Tag) => tag ? tag._id : undefined;

  static getName = (tag: Tag) => tag ? tag.name : undefined;
};