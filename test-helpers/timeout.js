module.exports = {
    resolve: (ms) =>
        new Promise(resolve => setTimeout(resolve, ms)),
    reject: (ms) => 
        new Promise((resolve, reject) => setTimeout(() => reject(new Error("Timed out")), ms))
}