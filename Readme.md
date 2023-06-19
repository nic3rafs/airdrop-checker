# Airdrop Checker
This is a Node.js script that fetches airdrop data from airdrops.fyi for a list of Ethereum wallets. It handles rate limits and retries, and writes the results into a CSV file.

## Requirements
- Node.js (14.x or later recommended)
- npm
  
## Installation
1. Clone the repository
```bash
git clone https://github.com/your-github-username/airdrop-checker.git
```
2. Navigate to the project directory
```bash
cd airdrop-checker
```
3. Install dependencies
```bash
npm install
```
4. Add your wallet addresses to a file named wallets.txt, each address on a new line.
   
## Usage
Run the script with the following command:
```bash
npm start
```

## Output
The script will write the airdrop data to a file named result.csv in the current directory. This CSV file will contain the wallet address, token name and symbol, airdrop amount, and the claim URL.

It will also print a table in the console with the same information.

## Error Handling
The script includes error handling for rate limiting, including a 3-second wait and retry logic.

It validates Ethereum addresses and skips any invalid addresses.

## Dependencies
- Bottleneck - Powerful rate-limiter; roll-your-own logic allows you to manage multiple limiters with the same or different options and bucketing methods.
- node-fetch - A light-weight module that brings window.fetch to Node.js.
- cli-progress - A flexible progress bar for command line interfaces.
- 
## License
This project is licensed under the MIT License.