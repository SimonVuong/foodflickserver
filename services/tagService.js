import camelCase from 'camelcase';
import { NEEDS_MANAGER_SIGN_IN_ERROR } from '../utils/errors';
import { REST_INDEX, REST_TYPE, TAG_TYPE, TAG_INDEX } from './utils';
import { MANAGER_PERM } from '../utils/auth';

class TagService {
  constructor(elastic) {
    this.elastic = elastic;
  }

  getTagUpdateTarget = name => ({
    update: {
      _index: TAG_INDEX,
      _type: TAG_TYPE,
      _id: camelCase(name)
    }
  })

  /**
   * Update the tags index by adding missing tags and/or incramenting the count of existing ones.
   * Assumes user is already a rest manager.
   * @param {string[]} tags array of tags to be updated
   */
  incramentAndAddTags = tagNames => {

    if (tagNames.length === 0) return new Promise(resolve => resolve());

    const updates = [];
    tagNames.forEach(name => {
      updates.push(this.getTagUpdateTarget(name));
      
      updates.push({
        script: { source: 'ctx._source.count += 1' },
        upsert: {
          name,
          count: 1
        }
      });
    });

    return this.elastic.bulk({
      body: updates,
    });
  }

  async getTagSearchSuggestions (signedInUser, prefix) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    const suggestionName = 'tags';
    const res = await this.elastic.search({
      index: TAG_INDEX,
      body: {
        suggest: {
          [suggestionName]: {
            prefix, 
            completion: { field: 'name.suggest' }
          }
        }
      }
    });

    // 0th index because we currently only support suggestion based on 1 word. indexes 0...n reflect the
    // number and order of the words in the query. i think...
    return res.suggest[suggestionName][0].options.map(({ _source, _id }) => {
      _source._id = _id;
      return _source;
    });
  }

  /**
   * Diff the old vs new tags. Incrament/upsert for newly added tags and decrament for tags removed
   * @param {*} oldTagNames 
   * @param {*} newTagNames 
   */
  getTagUpdatesByDiff (oldTagNames, newTagNames) {
    const updates = [];

    oldTagNames.forEach(oldName => {
      if (!newTagNames.includes(oldName)) {
        updates.push(this.getTagUpdateTarget(oldName));
        updates.push({
          script: { source: 'ctx._source.count -= 1' },
        });
      }
    })

    newTagNames.forEach(newName => {
      if (!oldTagNames.includes(newName)) {
        updates.push(this.getTagUpdateTarget(newName));
        updates.push({
          script: { source: 'ctx._source.count += 1' },
          upsert: {
            newName,
            count: 1
          }
        });
      }
    })

    return updates;
  }

  /**
   * Update the tags index by adding missing tags and incramenting/decramenting tag counts
   * @param {string[]} restId restaurant which has tags to be updated
   * @param {string[]} newTagNames desired new tags for the rest
   */
  async updateTags(restId, newTagNames) {

    const res = await this.elastic.get({
      index: REST_INDEX,
      type: REST_TYPE,
      id: restId,
      _sourceInclude: [ 'profile.tags' ], //todo 1: this is easy to break if i change shape. should somehow abstract this
    });

    const oldTagNames = res._source.profile.tags;
    const updates = this.getTagUpdatesByDiff(oldTagNames, newTagNames);
    this.elastic.bulk({
      body: updates,
    });
  }
}

let tagService;

export const getTagService = elastic => {
  if (tagService) return tagService;
  tagService = new TagService(elastic);
  return tagService;
};