export const TagQueryResolvers = {
  tagSearchSuggestions: async (root, { query }, { signedInUser, TagService }) => {
    return await TagService.getTagSearchSuggestions(signedInUser, query);
  },
}