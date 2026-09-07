const { scrapeListing } = require('./listingParser');

const scrapeUncensored = (page = 1) => scrapeListing('uncensored', page);

module.exports = { scrapeUncensored };
