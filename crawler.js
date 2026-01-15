const axios = require("axios");
const cheerio = require("cheerio");

const URL = "https://update.giavang.doji.vn/";

async function crawlGoldPrices() {
  try {
    console.log("Fetching data from", URL);

    // Fetch the HTML content
    const response = await axios.get(URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    // Load HTML into cheerio
    const $ = cheerio.load(response.data);

    // Find the Hà Nội table section
    // The table is inside #bang-gia-theo-vung-mien .hn
    const hanoiTable = $("#bang-gia-theo-vung-mien .hn table.goldprice-view");

    if (hanoiTable.length === 0) {
      console.error("Could not find Hà Nội price table");
      return null;
    }

    // Extract data from tbody rows
    const prices = [];
    hanoiTable.find("tbody tr").each((index, element) => {
      const $row = $(element);
      const $cells = $row.find("td");

      if ($cells.length >= 3) {
        const product = $cells.eq(0).text().trim();
        const buyPrice = parseInt(
          $cells.eq(1).text().trim().replace(/,/g, ""),
          10
        );
        const sellPrice = parseInt(
          $cells.eq(2).text().trim().replace(/,/g, ""),
          10
        );

        if (product && !isNaN(buyPrice) && !isNaN(sellPrice)) {
          prices.push({
            product: product,
            buyPrice: buyPrice,
            sellPrice: sellPrice,
          });
        }
      }
    });

    return prices;
  } catch (error) {
    console.error("Error crawling gold prices:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Status Text:", error.response.statusText);
    }
    throw error;
  }
}

module.exports = { crawlGoldPrices };
