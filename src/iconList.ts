import Fuse from 'fuse.js';
import { getIconIds } from 'obsidian';


// Since Obsidian 1.7 we can use getIconIds() directly to get lucide icons
export const iconsNames: {id: string, search: string}[] = getIconIds()
  .map(id => (
    {id, search: id.replace(/^lucide-/, '')}
  ))

export const iconsSearchService = new Fuse(iconsNames, {
  threshold: 0.1,
  minMatchCharLength: 2,
  keys: ['search'],
});
