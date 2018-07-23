var HDWalletProvider = require("truffle-hdwallet-provider");
var fs = require('fs');

var constants = JSON.parse(fs.readFileSync('truffle-config-constants.json'));

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
    ropsten: {
      provider: () => new HDWalletProvider(constants.mnemonic, "https://ropsten.infura.io/" + constants.infuraAccessToken),
      network_id: 3,
      gas: 4700000,
    },   
    casper: {
      provider: () => new HDWalletProvider(constants.mnemonic, "http://52.87.179.32"),
      port: 8080,
      network_id: "*",
      gas: 500000,
    }
  }
};

module.exports = truffleOptions;