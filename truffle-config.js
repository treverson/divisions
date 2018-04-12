let truffleOptions = {
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  },
  networks: {
    development: {
      host: "localhost",
      port: 9545,
      network_id: "*", // Match any network id
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 9545,         // <-- If you change this, also set the port option in .solcover.js.
      gas: 0xffffffffffff, // <-- Use this high gas value
      gasPrice: 0x01      // <-- Use this low gas price
    }
  }
};

module.exports = truffleOptions;