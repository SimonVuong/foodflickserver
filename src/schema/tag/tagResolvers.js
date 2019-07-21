export const TagQueryResolvers = {
  tagSearchSuggestions: async (root, { query }, { TagService }) => {
    return await TagService.getTagSearchSuggestions(query);
  },
}