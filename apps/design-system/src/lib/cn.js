import clsx from 'clsx';

// Tiny className combiner. (No tailwind-merge to keep deps light; author
// components so conflicting utilities aren't passed in the first place.)
export const cn = (...args) => clsx(args);
