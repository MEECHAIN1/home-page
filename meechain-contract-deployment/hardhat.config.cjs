/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun"
    },
  },
  networks: {
    hardhat: {
      chainId: 13390,
      hostname: '0.0.0.0',
    },
    localhost: {
      chainId: 13390,
      url: "http://127.0.0.1:8545",
    },
    meechain: {
      url: "https://rpc.meechain.live",
      chainId: 13390,
      accounts: process.env.PRIVATEKEY ? [process.env.PRIVATEKEY] : []
    }
  }
};
