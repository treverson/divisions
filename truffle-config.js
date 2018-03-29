let truffleOptions = {
  networks: {
      development: {
          host: "localhost",
          port: 9545,
          network_id: "*", // Match any network id
      }
  }
};

module.exports = truffleOptions;