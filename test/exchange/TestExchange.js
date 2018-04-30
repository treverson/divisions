const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");
let TransactionListener = require('../../test-helpers/TransactionListener');
let transactionListener = new TransactionListener();
const BigNumber = require('bignumber.js');
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
    });

    beforeEach(async () => {
        divToken = await MockDivisionsToken.new();
        exchange = await Exchange.new(divToken.address, stakeManager.address);
        await stakeManager.setExchange(exchange.address);
        await divToken.transferMintership(exchange.address);
    })

    // it('calculates the div reserve', async () => {
    //     let expectedDivReserve = await divToken.balanceOf(exchange.address);
    //     let actualDivReserve = await exchange.divReserve();

    //     assert.equal(
    //         expectedDivReserve.valueOf(),
    //         actualDivReserve.valueOf(),
    //         "The DIV reserve was not calculated correctly"
    //     );
    // });

    // it('calculates the wei reserve', async () => {
    //     let exchangeBalance = await web3.eth.getBalance(exchange.address);
    //     let exchangeTotalPayments = await exchange.totalPayments();

    //     let expectedWeiReserve = exchangeBalance.minus(exchangeTotalPayments);

    //     let actualWeiReserve = await exchange.weiReserve();

    //     assert.equal(
    //         actualWeiReserve.valueOf(),
    //         expectedWeiReserve.valueOf(),
    //         "The wei reserve was not calculated correctly"
    //     );
    // });

    // it('places buy orders', async () => {
    //     let buyer = accounts[1];
    //     let buyAmount = web3.toBigNumber(web3.toWei(2, 'ether'));

    //     let buyOrdersLengthBefore = await exchange.buyOrdersLength();
    //     let buyOrderIndexesBefore = await exchange.getBuyOrderIndexes(buyer);

    //     await exchange.placeBuyOrder({ from: buyer, value: buyAmount });

    //     let buyOrdersLengthAfter = await exchange.buyOrdersLength();
    //     let buyOrderIndexesAfter = await exchange.getBuyOrderIndexes(buyer);

    //     assert.equal(
    //         buyOrdersLengthAfter.valueOf(),
    //         buyOrdersLengthBefore.plus(1).valueOf(),
    //         "The number of buy orders was not incremented"
    //     );

    //     assert.equal(
    //         buyOrderIndexesAfter.length,
    //         buyOrderIndexesBefore.length + 1,
    //         "The buy order index was not stored"
    //     );

    //     assert.equal(
    //         buyOrderIndexesAfter[buyOrderIndexesAfter.length - 1].valueOf(),
    //         buyOrdersLengthAfter.minus(1).valueOf(),
    //         "The stored index was not correct"
    //     );

    //     let buyOrder = new Order(await exchange.buyOrders(buyOrdersLengthAfter.minus(1)));

    //     assert.equal(buyOrder.sender, buyer, "The sender of the order was not stored correctly");
    //     assert.equal(buyOrder.amount.valueOf(), buyAmount.valueOf(), "The amount was no stored correctly");
    //     assert.equal(buyOrder.amountFilled.valueOf(), 0, "The filled amount is not equal to zero");
    //     assert.equal(buyOrder.cumulativeAmount.valueOf(), buyAmount.valueOf(), "The cumulative amount is not correct");
    //     assert.equal(buyOrder.finished, false, "The order was initialized with finished set to true");

    //     await expectThrow(
    //         exchange.placeBuyOrder({ from: buyer, value: 0 }),
    //         "Cannot place buy orders with a 0 amount"
    //     )
    // });

    // it('logs an event on placeBuyOrder', async () => {
    //     let buyer = accounts[1];
    //     let buyAmount = web3.toWei(2, 'ether');

    //     let buyOrdersLength = await exchange.buyOrdersLength();

    //     await expectEvent(
    //         exchange.placeBuyOrder.sendTransaction({ from: buyer, value: buyAmount }),
    //         exchange.BuyOrderPlaced(),
    //         { index: buyOrdersLength, sender: buyer, amount: buyAmount }
    //     );
    // });

    // it('places sell orders', async () => {
    //     let seller = accounts[1];
    //     let sellAmount = web3.toBigNumber(2e18);

    //     await divToken.mint(seller, sellAmount);
    //     await divToken.approve(exchange.address, sellAmount, { from: seller });

    //     let sellOrdersLengthBefore = await exchange.sellOrdersLength();
    //     let sellOrderIndexesBefore = await exchange.getSellOrderIndexes(seller);

    //     await exchange.placeSellOrder(sellAmount, { from: seller });

    //     let sellOrdersLengthAfter = await exchange.sellOrdersLength();
    //     let sellOrderIndexesAfter = await exchange.getSellOrderIndexes(seller);

    //     assert.equal(
    //         sellOrdersLengthAfter.valueOf(),
    //         sellOrdersLengthBefore.plus(1).valueOf(),
    //         "The number of sell orders was not incremented"
    //     );

    //     assert.equal(
    //         sellOrderIndexesAfter.length,
    //         sellOrderIndexesBefore.length + 1,
    //         "The sell order index was not stored"
    //     );

    //     assert.equal(
    //         sellOrderIndexesAfter[sellOrderIndexesAfter.length - 1].valueOf(),
    //         sellOrdersLengthAfter.minus(1).valueOf(),
    //         "The stored index was not correct"
    //     );

    //     let sellOrder = new Order(await exchange.getSellOrder(sellOrdersLengthAfter.minus(1)));

    //     assert.equal(sellOrder.sender, seller, "The sender of the order was not stored correctly");
    //     assert.equal(sellOrder.amount.valueOf(), sellAmount.valueOf(), "The amount was no stored correctly");
    //     assert.equal(sellOrder.amountFilled.valueOf(), 0, "The filled amount is not equal to zero");
    //     assert.equal(sellOrder.cumulativeAmount.valueOf(), sellAmount.valueOf(), "The cumulative amount is not correct");
    //     assert.equal(sellOrder.finished, false, "The order was initialized with finished set to true");

    //     await divToken.mint(seller, 100);
    //     await divToken.approve(exchange.address, 100);
    //     await expectThrow(
    //         exchange.placeSellOrder(0, { from: seller }),
    //         "Cannot place sell orders with a 0 amount"
    //     );
    // });

    // it('implements a mininum amount for orders', async () => {
    //     assert.fail('TODO owner can set mininum amount for waitlisted orders to prevent flooding');
    // })

    // it('places sell orders on receiveApproval from divToken', async () => {
    //     let seller = accounts[5];
    //     let sellAmount = web3.toBigNumber(6e18);
    //     await divToken.mint(seller, sellAmount);

    //     await divToken.approveAndCall(exchange.address, sellAmount, "", {from: seller});

    //     let sellOrderIndexes = await exchange.getSellOrderIndexes(seller);

    //     assert(sellOrderIndexes.length > 0, "The sell order index was not registered");

    //     let sellOrderIndex = sellOrderIndexes[sellOrderIndexes.length - 1];
    //     let sellOrder = new Order(await exchange.sellOrders(sellOrderIndex));

    //     delete sellOrder.cumulativeAmount; //We're not testing this value in this spec
    //     assert.deepEqual(
    //         sellOrder,
    //         {
    //             sender: seller,
    //             amount: sellAmount,
    //             amountFilled: web3.toBigNumber(0),
    //             amountCanceled: web3.toBigNumber(0),
    //             index: sellOrderIndex,
    //             finished: false
    //         },
    //         "The stored sell order was not correct"
    //     );
    // });

    // it('logs an event on placeSellOrder', async () => {
    //     let seller = accounts[1];
    //     let sellAmount = web3.toBigNumber(2e18);

    //     await divToken.mint(seller, sellAmount);
    //     await divToken.approve(exchange.address, sellAmount, { from: seller });

    //     let sellOrdersLength = await exchange.sellOrdersLength();

    //     await expectEvent(
    //         exchange.placeSellOrder.sendTransaction(sellAmount, { from: seller }),
    //         exchange.BuyOrderPlaced(),
    //         { index: sellOrdersLength, sender: seller, amount: sellAmount }
    //     );
    // });


    // let buyOrderAmounts = [
    //     web3.toWei(3, 'ether'),
    //     web3.toWei(10, 'ether')
    // ];
    // buyOrderAmounts.forEach(orderAmount => {
    //     it('calculates the amount that can be filled of a buy order ', async () => {
    //         await treasury.setTotalPoolSize(web3.toWei(5, 'ether'));

    //         await divToken.mint(exchange.address, 5e18);
    //         let divReserve = await exchange.divReserve();
    //         let divReserveInWei = await exchange.toWei(divReserve);
    //         let totalDivFilled = await exchange.totalDivFilled();
    //         let totalDivFilledinWei = await exchange.toWei(totalDivFilled);

    //         let out = await transactionListener.listen(
    //             exchange.placeBuyOrder.sendTransaction({
    //                 value: orderAmount,
    //                 from: accounts[5]
    //             }),
    //             exchange.BuyOrderPlaced()
    //         );

    //         let buyOrder = new Order(await exchange.buyOrders(out.index));

    //         let reserveLeft = divReserveInWei
    //             .plus(totalDivFilledinWei)
    //             .minus(buyOrder.cumulativeAmount.minus(buyOrder.amount));

    //         let amountLeft = buyOrder.amount
    //             .minus(buyOrder.amountFilled)
    //             .minus(buyOrder.amountCanceled);

    //         let actualFillableAmount = await exchange.buyOrderFillableAmount(out.index);

    //         let expectedFillableAmount = BigNumber.min(
    //             reserveLeft,
    //             amountLeft
    //         );

    //         assert.equal(
    //             actualFillableAmount.valueOf(),
    //             expectedFillableAmount.valueOf(),
    //             "The fillable amount was not correct"
    //         );

    //         transactionListener.dispose();
    //     });
    // });

    // let sellOrderAmounts = [
    //     3e18,
    //     10e18
    // ];
    // sellOrderAmounts.forEach(orderAmount => {
    //     it('calculates the amount that can be filled of a sell order', async () => {
    //         await treasury.setTotalPoolSize(web3.toWei(5, 'ether'));

    //         await divToken.mint(exchange.address, 5e18);
    //         let weiReserve = await exchange.weiReserve();
    //         let weiReserveInDiv = await exchange.toDiv(weiReserve);
    //         let totalWeiFilled = await exchange.totalWeiFilled();
    //         let totalWeiFilledinDiv = await exchange.toDiv(totalWeiFilled);

    //         await divToken.mint(accounts[1], orderAmount);

    //         let out = await transactionListener.listen(
    //             divToken.approveAndCall.sendTransaction(
    //                 exchange.address,
    //                 orderAmount,
    //                 "",
    //                 { from: accounts[1] }
    //             ),
    //             exchange.SellOrderPlaced()
    //         );

    //         let sellOrder = new Order(await exchange.sellOrders(out.index));

    //         let reserveLeft = weiReserveInDiv
    //             .plus(totalWeiFilledinDiv)
    //             .minus(sellOrder.cumulativeAmount.minus(sellOrder.amount));

    //         let amountLeft = sellOrder.amount
    //             .minus(sellOrder.amountFilled)
    //             .minus(sellOrder.amountCanceled);

    //         let actualFillableAmount = await exchange.sellOrderFillableAmount(out.index);

    //         let expectedFillableAmount = BigNumber.min(
    //             reserveLeft,
    //             amountLeft
    //         );

    //         assert.equal(
    //             actualFillableAmount.valueOf(),
    //             expectedFillableAmount.valueOf(),
    //             "The fillable amount was not correct"
    //         );

    //         transactionListener.dispose();
    //     });
    // });

    // it('fills buy orders', async () => {
    //     let seller = accounts[2];
    //     let sellAmount = 100e18;
    //     await divToken.mint(seller, sellAmount);
    //     await divToken.approve(exchange.address, sellAmount, { from: seller });
    //     await exchange.placeSellOrder(sellAmount, { from: seller });

    //     let buyer = accounts[1];
    //     let buyAmount = web3.toBigNumber(web3.toWei(4, 'ether'));

    //     let totalWeiFilledBefore = await exchange.totalWeiFilled();
    //     let totalDivFilledBefore = await exchange.totalDivFilled();
    //     let buyOrderIndex
    //     try {
    //         buyOrderIndex = (await transactionListener.listen(
    //             exchange.placeBuyOrder.sendTransaction({ value: buyAmount, from: buyer }),
    //             exchange.BuyOrderPlaced()
    //         )).index;
    //     } finally {
    //         transactionListener.dispose();
    //     }

    //     let buyerBalanceBefore = await divToken.balanceOf(buyer);

    //     await exchange.fillBuyOrder(buyOrderIndex);

    //     let buyerBalanceAfter = await divToken.balanceOf(buyer);

    //     let buyOrder = new Order(await exchange.getBuyOrder(buyOrderIndex));

    //     let totalWeiFilledAfter = await exchange.totalWeiFilled();
    //     let totalDivFilledAfter = await exchange.totalDivFilled();
    //     let buyAmountInDiv = await exchange.toDiv(buyAmount);

    //     assert.deepEqual(
    //         buyerBalanceAfter,
    //         buyerBalanceBefore.plus(buyAmountInDiv),
    //         "The amount was not added to the buyer's balance"
    //     );

    //     assert.deepEqual(
    //         buyOrder.amountFilled,
    //         buyAmount,
    //         "The order was not fully filled"
    //     );

    //     assert.deepEqual(
    //         totalWeiFilledAfter,
    //         totalWeiFilledBefore.plus(buyAmount),
    //         "The total amount of wei that was filled was not updated correctly"
    //     );
    //     assert.fail('TODO: filling orders entails filling opposing orders until enough there\'s reserve to cancel all instantly');
    //     //TODO: That means fill enough of orders so that your order's amount is used up
    // });

    // it('logs an event on fillBuyOrder', async () => {
    //     let seller = accounts[2];
    //     let sellAmount = web3.toBigNumber(100e18);
    //     await divToken.mint(seller, sellAmount);
    //     await divToken.approve(exchange.address, sellAmount, { from: seller });
    //     await exchange.placeSellOrder(sellAmount, { from: seller });

    //     let buyer = accounts[1]
    //     let buyAmount = web3.toWei(4, 'ether');
    //     let buyOrderIndex;
    //     try {
    //         buyOrderIndex = (await transactionListener.listen(
    //             exchange.placeBuyOrder.sendTransaction({ value: buyAmount, from: buyer }),
    //             exchange.BuyOrderPlaced()
    //         )).index;
    //     } finally {
    //         transactionListener.dispose();
    //     }

    //     await expectEvent(
    //         exchange.fillBuyOrder.sendTransaction(buyOrderIndex),
    //         exchange.BuyOrderFilled(),
    //         { index: buyOrderIndex, amountFilled: buyAmount }
    //     );
    // });

    // it('fills sell orders', async () => {
    //     let buyer = accounts[2]
    //     let buyAmount = web3.toWei(20, 'ether');
    //     await exchange.placeBuyOrder({ value: buyAmount, from: buyer });

    //     let seller = accounts[1];
    //     let sellAmount = web3.toBigNumber(1e18);
    //     await divToken.mint(seller, sellAmount);
    //     await divToken.approve(exchange.address, sellAmount, { from: seller });

    //     let totalDivFilledBefore = await exchange.totalDivFilled();
    //     let totalWeiFilledBefore = await exchange.totalWeiFilled();

    //     let sellOrderIndex
    //     try {
    //         sellOrderIndex = (await transactionListener.listen(
    //             exchange.placeSellOrder.sendTransaction(sellAmount, { from: seller }),
    //             exchange.SellOrderPlaced()
    //         )).index;
    //     } finally {
    //         transactionListener.dispose();
    //     }

    //     let sellerPaymentsBefore = await exchange.payments(seller);

    //     await exchange.fillSellOrder(sellOrderIndex);

    //     let sellOrder = new Order(await exchange.getSellOrder(sellOrderIndex));

    //     let sellerPaymentsAfter = await exchange.payments(seller);

    //     let totalDivFilledAfter = await exchange.totalDivFilled();
    //     let totalWeiFilledAfter = await exchange.totalWeiFilled();
    //     let sellAmountInWei = await exchange.toWei(sellAmount);

    //     assert.deepEqual(
    //         sellerPaymentsAfter,
    //         sellerPaymentsBefore.plus(sellAmountInWei),
    //         "The amount was not added to the sellers payments"
    //     );

    //     assert.deepEqual(
    //         sellOrder.amountFilled,
    //         sellAmount,
    //         "The order was not fully filled"
    //     );

    //     assert.deepEqual(
    //         totalDivFilledAfter,
    //         totalDivFilledBefore.plus(sellAmount),
    //         "The total amount of DIV that was filled was not updated correctly"
    //     );

    //     assert.fail('TODO: filling orders entails filling opposing orders until enough there\'s reserve to cancel all instantly');
    //     //TODO: That means fill enough of orders so that your order's amount is used up
    // });

    // it('logs an event on fillSellOrder()', async () => {
    //     let buyer = accounts[2]
    //     let buyAmount = web3.toWei(5, 'ether');
    //     await exchange.placeBuyOrder({ value: buyAmount, from: buyer });

    //     let seller = accounts[2];
    //     let sellAmount = web3.toBigNumber(1e18);
    //     await divToken.mint(seller, sellAmount);
    //     await divToken.approve(exchange.address, sellAmount, { from: seller });

    //     let sellOrderIndex;
    //     try {
    //         sellOrderIndex = (await transactionListener.listen(
    //             exchange.placeSellOrder.sendTransaction(sellAmount, { from: seller }),
    //             exchange.SellOrderPlaced()
    //         )).index;
    //     } finally {
    //         transactionListener.dispose();
    //     }

    //     await expectEvent(
    //         exchange.fillSellOrder.sendTransaction(sellOrderIndex),
    //         exchange.SellOrderFilled(),
    //         { index: sellOrderIndex, amountFilled: sellAmount }
    //     );
    // });

    // it('instantly fills buy orders if DIV is available in reserve and the user chooses to', async () => {
    //     assert.fail('TODO');
    // });

    // it('instantly fills sell orders if Ether is available in reserve and the user chooses to', async () =>{
    //     assert.fail('TODO');
    // });

    // it('cancels buy orders', async () => {
    //  assert.fail('TODO');
    // });

    // it('cancels sell orders', async () => {
    //     assert.fail('TODO');
    // });

    // it('calculates the price of DIV tokens', async () => {
    //     await treasury.setTotalPoolSize(0);

    //     let decimals = (await divToken.decimals()).valueOf();

    //     let totalDivSupply = await divToken.totalSupply();
    //     let expectedDivPrice = web3.toBigNumber(10 ** decimals);

    //     let actualDivPrice = await exchange.divPrice();

    //     assert.deepEqual(
    //         actualDivPrice,
    //         expectedDivPrice,
    //         "When both DivisionsToken.totalSupply() and Treasury.getTotalPoolSize() are 0, " +
    //         "price should be 10 ** DivisionsToken.decimals()"
    //     );

    //     let mintedDiv = 5 * 10 ** decimals;
    //     await divToken.mint(exchange.address, mintedDiv);

    //     actualDivPrice = await exchange.divPrice();

    //     assert.deepEqual(
    //         actualDivPrice,
    //         expectedDivPrice,
    //         "When DivisionsToken.totalSupply() > 0 and Treasury.getTotalPoolSize() == 0," +
    //         "price should be 10 ** DivisionsToken.decimals()"
    //     );

    //     await divToken.burnFrom(exchange.address, mintedDiv);
    //     let totalPoolSize = web3.toBigNumber(web3.toWei(4, 'ether'));
    //     await treasury.setTotalPoolSize(totalPoolSize);

    //     actualDivPrice = await exchange.divPrice();
    //     assert.deepEqual(
    //         actualDivPrice,
    //         expectedDivPrice,
    //         "When DivisionsToken.totalSupply() == 0 and Treasury.getTotalPoolSize() > 0," +
    //         "price should be 10 ** DivisionsToken.decimals()"
    //     );

    //     await divToken.mint(exchange.address, mintedDiv);

    //     expectedDivPrice = totalPoolSize
    //         .mul(web3.toBigNumber(10)
    //             .pow(await divToken.decimals())
    //         )
    //         .div(await divToken.totalSupply());

    //     actualDivPrice = await exchange.divPrice();

    //     assert.deepEqual(
    //         actualDivPrice,
    //         expectedDivPrice,
    //         "When DivisionsToken.totalSupply() > 0 and Treasury.getTotalPoolSize() > 0, price should be " +
    //         "(Treasury.getTotalPoolSizeeDivisionsToken.decimals()) /" +
    //         "DivisionsToken.totalSupply()"
    //     );

    // });

    // it('converts wei amounts to DIV', async () => {
    //     await divToken.mint(exchange.address, 3e18);
    //     await treasury.setTotalPoolSize(5e18);
    //     let divPrice = await exchange.divPrice();
    //     let priceMultiplier = web3.toBigNumber(10).pow(await divToken.decimals());

    //     let weiAmount = web3.toBigNumber(web3.toWei(20, 'ether'));

    //     let expectedDivAmount = weiAmount.mul(priceMultiplier).divToInt(divPrice)

    //     let actualDivAmount = await exchange.toDiv(weiAmount);

    //     assert.deepEqual(
    //         actualDivAmount,
    //         expectedDivAmount,
    //         "The converted amount is not correct"
    //     );
    // });

    // it('converts DIV amounts to wei', async () => {
    //     await divToken.mint(exchange.address, 3e18);
    //     await treasury.setTotalPoolSize(5e18);
    //     let divPrice = await exchange.divPrice();
    //     let priceMultiplier = web3.toBigNumber(10).pow(await divToken.decimals());

    //     let divAmount = web3.toBigNumber(20e18);

    //     let expectedWeiAmount = divAmount.mul(divPrice).divToInt(priceMultiplier);

    //     let actualWeiAmount = await exchange.toWei(divAmount);

    //     assert.deepEqual(
    //         expectedWeiAmount,
    //         actualWeiAmount,
    //         "The converted amount is not correct"
    //     );
    // });

    it('sends wei reserve to the treasury, fills buy orders and mints DIV when it does', async () => {
        let orderIndexes = [];
        let buyAmount = web3.toBigNumber(web3.toWei(0.5, 'ether'));
        let totalBuyAmount = web3.toBigNumber(0);
        try {
            for (let i = 0; i < 10; i++) {
                totalBuyAmount = totalBuyAmount.add(buyAmount);
                orderIndexes.push(
                    (await transactionListener.listen(
                        exchange.placeBuyOrder
                            .sendTransaction({ value: buyAmount, from: accounts[i % 5 + 5] }),
                        exchange.BuyOrderPlaced()
                    )).index
                );
            }
        } finally {
            transactionListener.dispose();
        }

        await expectThrow(
            exchange.transferWeiToTreasury(totalBuyAmount),
            "Only the stake manager can have the exchange transfer wei to the treasury"
        );

        let totalDivSupplyBefore = await divToken.totalSupply();
        let weiReserveBefore = await exchange.weiReserve();

        await expectEvent(
            stakeManager.simulateFillTreasury.sendTransaction(totalBuyAmount),
            treasury.DepositCalled(),
            { from: exchange.address, value: totalBuyAmount }
        );        

        let totalDivSupplyAfter = await divToken.totalSupply();

        assert.deepEqual(
            totalDivSupplyAfter,
            totalDivSupplyBefore.plus(await exchange.toDiv(totalBuyAmount)),
            "The total supply was not updated correctly"
        );

        for(let orderIndex in orderIndexes) {
            let order = new Order(await exchange.buyOrders(orderIndex));
            assert.deepEqual(
                order.amountFilled,
                buyAmount,
                "The order was not filled"
            );
        };
    });

    it('handles ether deposits by the treasury, filling sell orders and burning DIV', async () => {
        let orderIndexes = [];
        let sellAmount = web3.toBigNumber(0.5e18);
        let sellAmountInWei = await exchange.toWei(sellAmount);
        let totalSellAmount = web3.toBigNumber(0);
        try {
            for (let i = 0; i < 10; i++) {
                totalSellAmount = totalSellAmount.add(sellAmount);
                let seller = accounts[i % 5 + 5];
                await divToken.mint(seller, sellAmount);
                orderIndexes.push(
                    (await transactionListener.listen(
                        divToken.approveAndCall
                            .sendTransaction(exchange.address, sellAmount, "", { from: seller }),
                        exchange.SellOrderPlaced()
                    )).index
                );
                await web3.eth.sendTransaction({ from: seller, to: accounts[0], value: sellAmountInWei });
            }
        } finally {
            transactionListener.dispose();
        }

        let totalDivSupplyBefore = await divToken.totalSupply();
        let totalSellAmountInWei = await exchange.toWei(totalSellAmount);

        await exchange.handleEtherDeposit({ value: totalSellAmountInWei });

        let totalDivSupplyAfter = await divToken.totalSupply();

        assert.deepEqual(
            totalDivSupplyAfter,
            totalDivSupplyBefore.sub(totalSellAmountInWei),
            "The total supply was not updated correctly"
        );

        for (let orderIndex in orderIndexes) {
            let order = new Order(await exchange.sellOrders(orderIndex));
            assert.deepEqual(
                order.amountFilled,
                sellAmount,
                "The order at index " + order.index.valueOf() + " was not filled"
            );
        }
    });
});

class Order {

    constructor(orderArray) {
        this.sender = orderArray[0];
        this.amount = orderArray[1];
        this.cumulativeAmount = orderArray[2];
        this.amountFilled = orderArray[3];
        this.amountCanceled = orderArray[4];
        this.index = orderArray[5];
        this.finished = orderArray[6]
    }
}