import Fuse from 'fuse.js';
import { getIconIds } from 'obsidian';

// Since Obsidian 1.7 we can use getIconIds() directly to get lucide icons
export const iconList = new Fuse(getIconIds(), {
  threshold: 0.1,
  minMatchCharLength: 2,
});
