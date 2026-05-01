'use strict';

/**
 * Shared list of static Forest Ash themes.
 * Used by both desktop (extension.js) and web (extension-web.js) entry points.
 * Avoid drift: update in one place and both entry points will stay in sync.
 */
const STATIC_THEMES = [
  { label: 'Forest Ash',                      description: 'vs-dark'  },
  { label: 'Forest Ash Yoru Paper',            description: 'vs-dark'  },
  { label: 'Forest Ash Sumi Moon',             description: 'vs-dark'  },
  { label: 'Forest Ash Kitsune Ink',           description: 'vs-dark'  },
  { label: 'Forest Ash Shoji Night',           description: 'vs-dark'  },
  { label: 'Forest Ash Aizome Dusk',           description: 'vs-dark'  },
  { label: 'Forest Ash Ronin Lantern',         description: 'vs-dark'  },
  { label: 'Forest Ash Bamboo Midnight',       description: 'vs-dark'  },
  { label: 'Forest Ash Nebula Manga',          description: 'vs-dark'  },
  { label: 'Forest Ash Sakura Charcoal',       description: 'vs-dark'  },
  { label: 'Forest Ash Kage Washi',            description: 'vs-dark'  },
  { label: 'Forest Ash Yoru Paper Light',      description: 'vs-light' },
  { label: 'Forest Ash Sumi Moon Light',       description: 'vs-light' },
  { label: 'Forest Ash Kitsune Ink Light',     description: 'vs-light' },
  { label: 'Forest Ash Shoji Night Light',     description: 'vs-light' },
  { label: 'Forest Ash Aizome Dusk Light',     description: 'vs-light' },
  { label: 'Forest Ash Ronin Lantern Light',   description: 'vs-light' },
  { label: 'Forest Ash Bamboo Midnight Light', description: 'vs-light' },
  { label: 'Forest Ash Nebula Manga Light',    description: 'vs-light' },
  { label: 'Forest Ash Sakura Charcoal Light', description: 'vs-light' },
  { label: 'Forest Ash Kage Washi Light',      description: 'vs-light' },
];

module.exports = { STATIC_THEMES };
