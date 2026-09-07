const { scrapeListing } = require('./listingParser');

const scrapeHentai = (page = 1) => scrapeListing('hentai', page);

module.exports = { scrapeHentai };
