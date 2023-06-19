import Bottleneck from "bottleneck";
import fetch from "node-fetch";
import cliProgress from "cli-progress";
const limiter = new Bottleneck({
  minTime: 2001, // Wait at least 2 seconds between each request
  maxConcurrent: 1, // Ensure one request at a time
  // reservoir: 5, // Initial reservoir
  // reservoirRefreshAmount: 5, // Add 5 to reservoir every refresh
  // reservoirRefreshInterval: 10000, // Refill reservoir every 10 seconds
  // retryLimit: 5, // Retry up to 5 times
  // strategy: Bottleneck.strategy.OVERFLOW,
});
const API = "https://airdrops.fyi/backend/airdrops/";
import fs from "fs";

/**
 * This function reads a file and returns its contents as an array of strings.
 * @param fileName - The parameter `fileName` is a string that represents the name or path of the file
 * that needs to be read.
 * @returns The `readFileAsArray` function returns an array of strings, where each string represents a
 * line of text from the file with the given `fileName`. If there is an error reading the file, the
 * function returns `null`.
 */
const readFileAsArray = async (fileName) => {
  try {
    const fileContent = await fs.promises.readFile(fileName, "utf-8");
    return fileContent.split("\n");
  } catch (error) {
    console.error(`Error reading file ${fileName}: ${error}`);
    return null;
  }
};

/**
 * The function `writeFile` writes data to a file and logs a success message or an error message if the
 * write operation fails.
 * @param fileName - The name of the file that will be written to.
 * @param data - The `data` parameter in the `writeFile` function is the content that will be written
 * to the file specified by the `fileName` parameter. It can be a string, a buffer, or an object that
 * will be serialized to JSON.
 */
const writeFile = async (fileName, data) => {
  try {
    await fs.promises.writeFile(fileName, data);
    console.log(`File ${fileName} is written successfully.\n`);
  } catch (error) {
    console.error(`Error writing file ${fileName}: ${error}\n`);
  }
};

/**
 * The function converts a 2D array of data into a CSV format string.
 * @param data - The `data` parameter is an array of arrays, where each inner array represents a row of
 * data to be converted to CSV format. Each element in the inner array represents a cell in the row.
 * @returns The function `convertToCsv` is returning a string that represents the input data in CSV
 * (Comma Separated Values) format. The string contains comma-separated values for each row of data,
 * with each row separated by a newline character. The values are enclosed in double quotes and any
 * line breaks within a value are replaced with a comma and a space.
 */
const convertToCsv = (data) => {
  let result = "";
  for (let row of data) {
    for (let i = 0; i < row.length; i++) {
      result += '"' + row[i].toString().split("\r\n").join(", ") + '",';
    }
    result = result.slice(0, -1);
    result += "\n";
  }
  return result;
};

/**
 * The function checks if a given string is a valid Ethereum address.
 * @param address - The `address` parameter is a string representing an Ethereum address. The function
 * `validateAddress` uses a regular expression to check if the address is valid. The regular expression
 * checks if the address starts with "0x" and is followed by 40 hexadecimal characters (0-9 and A-F).
 */
const validateAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address);

const main = async () => {
  let resultTable = [["Wallet", "Token", "Amount", "ClaimURL"]];
  const wallets = await readFileAsArray("wallets.txt");
  if (wallets.length === 0) {
    console.log("No wallets found");
    return;
  }
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(wallets.length, 0);

  for (const wallet of wallets) {
    if (!validateAddress(wallet)) {
      console.log(`Invalid Ethereum address: ${wallet}`);
      continue;
    }
    let retry = true;
    while (retry) {
      try {
        const response = await limiter.schedule({ id: wallet }, async () => {
          const res = await fetch(API + wallet);
          if (!res.ok) {
            if (res.statusText === "Too Many Requests") {
              throw new Bottleneck.BottleneckError("Rate limited, will retry");
            } else {
              throw new Error(
                `\nError fetching data for wallet ${wallet}: ${res.statusText}`
              );
            }
          }
          return res;
        });

        const data = await response.json();
        if (data.length > 0) {
          for (const airdrop of data) {
            resultTable.push([
              airdrop.walletAddress,
              `${airdrop.Token.name} (${airdrop.Token.symbol})`,
              airdrop.amount,
              airdrop.Token.claimUrl,
            ]);
          }
        }
        retry = false; // If the request is successful, we set retry to false to break the loop
        bar.increment();
      } catch (error) {
        if (
          error instanceof Bottleneck.BottleneckError &&
          error.message.includes("Rate limited")
        ) {
          console.error(
            `\nFailed due to rate limiting, will retry. Wallet ${wallet}: ${error.message}`
          );
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } else {
          console.error(
            `\nFailed to fetch or parse data for wallet ${wallet}: ${error.message}`
          );
          retry = false; // If it's another type of error, we won't retry
        }
      }
    }
  }

  await writeFile("result.csv", convertToCsv(resultTable));
  bar.stop();
  const formattedData = resultTable.slice(1).map((row) => {
    return {
      Wallet: row[0],
      Token: row[1],
      Amount: row[2],
      ClaimURL: row[3],
    };
  });

  console.table(formattedData);
};
main();
