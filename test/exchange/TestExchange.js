const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");
let TransactionListener = require('../../test-helpers/TransactionListener');
let transactionListener = new TransactionListener();
// ============ Test Exchange ============ //

const Exchange = artifacts.require('Exchange');
const MockDivisionsToken = artifacts.require('MockDivisionsToken');

contract('Exchange', async acounts => {
    let exchange;
    let divToken;

    before(async () => {
        divToken = await MockDivisionsToken.new();
        exchange = await Exchange.new(divToken.address);
    });

    it('calculates the div reserve', async () => {
        let expectedDivReserve = await divToken.balanceOf(exchange.address);
        let actualDivReserve = await exchange.divReserve();

        assert.equal(
            expectedDivReserve.valueOf(),
            actualDivReserve.valueOf(),
            "The DIV reserve was not calculated correctly"
        );
    });

    it('calculates the div reserve', async () => {
        let exchangeBalance = await web3.eth.getBalance(exchange.address);
        let exchangeTotalPayments = await exchange.totalPayments();

        let expectedWeiReserve = exchangeBalance.minus(exchangeTotalPayments);

        let actualWeiReserve = await exchange.weiReserve();

        assert.equal(
            actualWeiReserve.valueOf(),
            expectedWeiReserve.valueOf(),
            "The wei reserve was not calculated correctly"
        );
    });

    it('places buy orders', async () => {
        let buyer = accounts[1];
        let buyAmount = web3.toWei(2, 'ether');

        let buyOrdersLengthBefore = await exchange.buyOrdersLength();

        await exchange.placeBuyOrder({ from: buyer, value: buyAmount });

        let buyOrdersLengthAfter = await exchange.buyOrdersLength();
        assert.equal(
            buyOrdersLengthAfter.valueOf(),
            buyOrdersLengthBefore.plus(1).valueOf(),
            "The number of buy orders was not incremented"
        );

        let buyOrder = new Order(await exchange.buyOrders(buyOrdersLengthAfter.minus(1)));

        assert.equal(buyOrder.sender, buyer, "The sender of the order was not stored correctly");
        assert.equal(buyOrder.amount.valueOf(), buyAmount.valueOf(), "The amount was no stored correctly");
        assert.equal(buyOrder.amountFilled.valueOf(), 0, "The filled amount is not equal to zero");

        await expectThrow(
            exchange.placeBuyOrder({ from: buyer, value: 0 }),
            "Cannot place buy orders with a 0 amount"
        )
    });

    it('logs an event on placeBuyOrder', async () => {
        let buyer = accounts[1];
        let buyAmount = web3.toWei(2, 'ether');

        let buyOrdersLength = await exchange.buyOrdersLength();

        await expectEvent(
            exchange.placeBuyOrder.sendTransaction({ from: buyer, value: buyAmount }),
            exchange.BuyOrderPlaced(),
            { index: buyOrdersLength, sender: buyer, amount: buyAmount }
        );
    });

    it('places sell orders', async () => {
        let seller = accounts[1];
        let sellAmount = web3.toBigNumber(2 * 10 ** 18);

        await divToken.mint(seller, sellAmount);
        await divToken.approve(exchange.address, sellAmount, { from: seller });

        let sellOrdersLengthBefore = await exchange.sellOrdersLength();

        await exchange.placeSellOrder(sellAmount, { from: seller });

        let sellOrdersLengthAfter = await exchange.sellOrdersLength();

        assert.equal(
            sellOrdersLengthAfter.valueOf(),
            sellOrdersLengthBefore.plus(1).valueOf,
            "The number of sell orders was not incremented"
        );

        let sellOrder = new Order(await exchange.getSellOrder(sellOrdersLengthAfter.minus(1)));

        assert.equal(sellOrder.sender, seller, "The sender of the order was not stored correctly");
        assert.equal(sellOrder.amount.valueOf(), sellAmount.valueOf(), "The amount was no stored correctly");
        assert.equal(sellOrder.amountFilled.valueOf(), 0, "The filled amount is not equal to zero");

        await divToken.mint(seller, 100);
        await divToken.approve(exchange.address, 100);
        await expectThrow(
            exchange.placeSellOrder({ from: seller, value: 0 }),
            "Cannot place sell orders with a 0 amount"
        );
    });

    it('logs an event on placeSellOrder', async () => {
        let seller = accounts[1];
        let sellAmount = web3.toBigNumber(2 * 10 ** 18);

        await divToken.mint(seller, sellAmount);
        await divToken.approve(exchange.address, sellAmount, { from: seller });

        let sellOrdersLength = await exchange.sellOrdersLength();

        await expectEvent(
            exchange.placeBuyOrder.sendTransaction(sellAmount, { from: seller }),
            exchange.BuyOrderPlaced(),
            { index: sellOrdersLength, sender: seller, amount: sellAmount }
        );
    });

    it('calculates the amount that can be filled of a buy order ', async () => {

    });

    it('calculates the amount that can be filled of a sell order', async () => {

    });

    it('fills buy orders', async () => {
        let seller = accounts[2];
        let sellAmount = 100 * 10 ** 18;
        await divToken.mint(seller, sellAmount);
        await divToken.approve(exchange.address, sellAmount, { from: seller });
        await exchange.placeSellOrder(sellAmount, { from: seller });

        let buyer = accounts[1]
        let buyAmount = web3.toWei(4, 'ether');
        try {
            let buyOrderIndex = (await transactionListener.listen(
                exchange.placeBuyOrder.sendTransaction({ value: buyAmount, from: buyer }),
                exchange.BuyOrderPlaced()
            )).index;
        } finally {
            transactionListener.dispose();
        }

        await exchange.fillBuyOrder(buyOrderIndex);

        let buyOrder = new Order(await exchange.getBuyOrder(buyOrderIndex));

        assert.equal(
            buyOrder.amountFilled.valueOf(),
            buyAmount.valueOf(),
            "The order was not fully filled"
        );
    });

    it('logs an event on fillBuyOrder', async () => {
        let seller = accounts[2];
        let sellAmount = web3.toBigNumber(100 * 10 ** 18);
        await divToken.mint(seller, sellAmount);
        await divToken.approve(exchange.address, sellAmount, { from: seller });
        await exchange.placeSellOrder(sellAmount, { from: seller });

        let buyer = accounts[1]
        let buyAmount = web3.toWei(4, 'ether');
        try {
            let buyOrderIndex = (await transactionListener.listen(
                exchange.placeBuyOrder.sendTransaction({ value: buyAmount, from: buyer }),
                exchange.BuyOrderPlaced()
            )).index;
        } finally {
            transactionListener.dispose();
        }

        await expectEvent(
            exchange.fillBuyOrder.sendTransaction(buyOrderIndex),
            exchange.BuyOrderFilled(),
            { index: buyOrderIndex, amountFilled: buyAmount }
        );
    });

    it('fills sell orders', async () => {
        let buyer = accounts[2]
        let buyAmount = web3.toWei(20, 'ether');
        await exchange.placeBuyOrder({ value: buyAmount, from: buyer });

        let seller = accounts[1];
        let sellAmount = web3.toBigNumber(1 * 10 ** 18);
        await divToken.mint(seller, sellAmount);
        await divToken.approve(exchange.address, sellAmount, { from: seller });

        try {
            let sellOrderIndex = (await transactionListener.listen(
                exchange.placeSellOrder.sendTransaction(sellAmount, {from: seller }),
                exchange.SellOrderPlaced()
            )).index;
        } finally {
            transactionListener.dispose();
        }

        await exchange.fillSellOrder(sellOrderIndex);

        let sellOrder = new Order(await exchange.getSellOrder(sellOrderIndex));

        assert.equal(
            sellOrder.amountFilled.valueOf(),
            sellAmount.valueOf(),
            "The order was not fully filled"
        );
    });

    it('logs an event on fillSellOrder()', async () => {
        let buyer = accounts[2]
        let buyAmount = web3.toWei(20, 'ether');
        await exchange.placeBuyOrder({ value: buyAmount, from: buyer });

        let seller = accounts[2];
        let sellAmount = web3.toBigNumber(100 * 10 ** 18);
        await divToken.mint(seller, sellAmount);
        await divToken.approve(exchange.address, sellAmount, { from: seller });

        try {
            let sellOrderIndex = (await transactionListener.listen(
                exchange.placeSellOrder.sendTransaction(sellAmount, {from: seller }),
                exchange.SellOrderPlaced()
            )).index;
        } finally {
            transactionListener.dispose();
        }

        await expectEvent(
            exchange.fillSellOrder.sendTransaction(sellOrderIndex),
            exchange.SellOrderFilled(),
            { index: sellOrderIndex, amountFilled: sellAmount }
        );
    });

    it('calculates the price of tokens', async () => {
        
    });

    it('converts wei amounts to token', async () => {

    });

    it('converts token amounts to wei', async () => {

    });

    it('sends wei reserve to the treasury', async () => {

    });

    it('handles wei that is deposited by the treasury', async () => {

    })
});

class Order {

    constructor(orderArray) {
        this.sender = orderArray[0];
        this.amount = orderArray[1];
        this.cumulativeAmount = orderArray[2];
        this.amountFilled = orderArray[3];
    }
}