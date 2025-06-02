import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 21600, checkperiod: 600 });

export { cache };

