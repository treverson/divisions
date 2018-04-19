const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");
let TransactionListener = require('../../test-helpers/TransactionListener');
let transactionListener = new TransactionListener();
// ============ Test Exchange ============ //

const Exchange = artifacts.require('Exchange');
const MockDivisionsToken = artifacts.require('MockDivisionsToken');
const MockStakeManager = artifacts.require('MockStakeManager');
const MockTreasury = artifacts.require('MockTreasury');
const MockCasper = artifacts.require('MockCasper');

const MIN_DEPOSIT_SIZE = web3.toWei(1, 'ether');
const EPOCH_LENGTH = 20;
const EPOCHS_BEFORE_LOGOUT = 10;
const DYNASTY_LOGOUT_DELAY = 0;
const WITHDRAWAL_DELAY = 0;


contract('Exchange', async accounts => {
    let exchange;
    let divToken;
    let stakeManager;
    let casper;
    let treasury;
    let validator;

    before(async () => {
        validator = accounts[1];
        casper = await MockCasper.new(MIN_DEPOSIT_SIZE, EPOCH_LENGTH, DYNASTY_LOGOUT_DELAY, WITHDRAWAL_DELAY);
        treasury = await MockTreasury.new(casper.address);
        stakeManager = await MockStakeManager.new(casper.address, treasury.address);
        
        await treasury.setStakeManager(stakeManager.address);
        
        divToken = await MockDivisionsToken.new();
        exchange = await Exchange.new(divToken.address, stakeManager.address);
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

    it('calculates the wei reserve', async () => {
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
        let buyOrderIndexesBefore = await exchange.getBuyOrderIndexes(buyer);
        
        await exchange.placeBuyOrder({ from: buyer, value: buyAmount });

        let buyOrdersLengthAfter = await exchange.buyOrdersLength();
        let buyOrderIndexesAfter = await exchange.getBuyOrderIndexes(buyer);

        assert.equal(
            buyOrdersLengthAfter.valueOf(),
            buyOrdersLengthBefore.plus(1).valueOf(),
            "The number of buy orders was not incremented"
        );

        assert.equal(
            buyOrderIndexesAfter.length,
            buyOrderIndexesBefore.length + 1,
            "The buy order index was not stored"
        );

        assert.equal(
            buyOrderIndexesAfter[buyOrderIndexesAfter.length - 1].valueOf(),
            buyOrdersLengthAfter.minus(1).valueOf(),
            "The stored index was not correct"
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
        let sellOrderIndexesBefore = await exchange.getSellOrderIndexes(seller);

        await exchange.placeSellOrder(sellAmount, { from: seller });

        let sellOrdersLengthAfter = await exchange.sellOrdersLength();
        let sellOrderIndexesAfter = await exchange.getSellOrderIndexes(seller);

        assert.equal(
            sellOrdersLengthAfter.valueOf(),
            sellOrdersLengthBefore.plus(1).valueOf(),
            "The number of sell orders was not incremented"
        );

        assert.equal(
            sellOrderIndexesAfter.length,
            sellOrderIndexesBefore.length + 1,
            "The sell order index was not stored"
        );

        assert.equal(
            sellOrderIndexesAfter[sellOrderIndexesAfter.length - 1].valueOf(),
            sellOrdersLengthAfter.minus(1).valueOf(),
            "The stored index was not correct"
        );

        let sellOrder = new Order(await exchange.getSellOrder(sellOrdersLengthAfter.minus(1)));

        assert.equal(sellOrder.sender, seller, "The sender of the order was not stored correctly");
        assert.equal(sellOrder.amount.valueOf(), sellAmount.valueOf(), "The amount was no stored correctly");
        assert.equal(sellOrder.amountFilled.valueOf(), 0, "The filled amount is not equal to zero");

        await divToken.mint(seller, 100);
        await divToken.approve(exchange.address, 100);
        await expectThrow(
            exchange.placeSellOrder(0, { from: seller }),
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
            exchange.placeSellOrder.sendTransaction(sellAmount, { from: seller }),
            exchange.BuyOrderPlaced(),
            { index: sellOrdersLength, sender: seller, amount: sellAmount }
        );
    });

    it('calculates the amount that can be filled of a buy order ', async () => {
        assert.fail('TODO');
    });

    it('calculates the amount that can be filled of a sell order', async () => {
        assert.fail('TODO');
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
                exchange.placeSellOrder.sendTransaction(sellAmount, { from: seller }),
                exchange.SellOrderPlaced()
            )).index;
        } finally {
            transactionListener.dispose();
        }

        await exchange.fillSellOrder(sellOrderIndex);
        let sellOrderArray = await exchange.getSellOrder(sellOrderIndex);
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
                exchange.placeSellOrder.sendTransaction(sellAmount, { from: seller }),
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
        assert.fail('TODO');
    });

    it('converts wei amounts to token', async () => {
        assert.fail('TODO');
    });

    it('converts token amounts to wei', async () => {
        assert.fail('TODO');
    });

    it('sends wei reserve to the treasury', async () => {
        assert.fail('TODO');
    });

    it('handles wei that is deposited by the treasury', async () => {
        assert.fail('TODO');
    });

    it('Places sell orders on receiveApproval', async () => {

    });
});

class Order {

    constructor(orderArray) {
        this.sender = orderArray[0];
        this.amount = orderArray[1];
        this.cumulativeAmount = orderArray[2];
        this.amountFilled = orderArray[3];
    }
}