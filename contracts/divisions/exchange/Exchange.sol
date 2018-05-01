pragma solidity 0.4.23;

import "../../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../../node_modules/zeppelin-solidity/contracts/payment/PullPayment.sol";
import "../../../node_modules/zeppelin-solidity/contracts/math/Math.sol";

import "../stake/Treasury.sol";
import "../stake/StakeManager.sol";
import "../token/DivisionsToken.sol";
import "../token/ITokenRecipient.sol";

contract AExchange is Ownable, PullPayment, ITokenRecipient {
    ATreasury public treasury;
    ADivisionsToken public divToken;
    AStakeManager public stakeManager;

    struct Order {
        address sender; //The account that placed the order
        uint256 amount; //The amount. Wei for buy orders, DIV for sell orders
        uint256 cumulativeAmount; //The amount + the sum of all amounts before this order
        uint256 amountFilled; //The amount of the order that was filled
        uint256 amountCancelled; //The amount of the order that was cancelled and refunded
        uint256 index; //The index of the orer
        bool finished; //Whether the order was filled completely or canceled
    }

    // The minimum amount of a buy order in wei
    uint256 public minBuyOrderAmount;
    // The minumum amount of a sell order in DIV
    uint256 public minSellOrderAmount;
    
    function setMinBuyOrderAmount(uint256 _min) external;
    function setMinSellOrderAmount(uint256 _max) external;

    Order[] public buyOrders;
    //All buy orders with index < buyOrderCursor are finished
    uint256 public buyOrderCursor;
    mapping(address => uint256[]) buyOrderIndexes;
    
    Order[] public sellOrders;
    //All sell orders with index < sellOrderCursor are finished
    uint256 public sellOrderCursor;
    mapping(address => uint256[]) sellOrderIndexes;

    //The total amount that was filled in sell orders
    uint256 public totalSellAmountFilled;
    //The total amount that was filled in buy orders
    uint256 public totalBuyAmountFilled;

    //The length of the array of buy orders
    function buyOrdersLength() public view returns (uint256 length);
    //The length of the array of sell orders
    function sellOrdersLength() public view returns (uint256 length);

    //The amount of wei currently in reserve
    function weiReserve() public view returns (uint256 reserve);
    //The amount of div currently in reserve
    function divReserve() public view returns (uint256 reserve);

    //Place a buy order on the waiting list
    function placeBuyOrder() payable external;
    //Place a sell order on the waiting list
    function placeSellOrder(uint256 _amount) external;

    //Place a buy order and fill it immediately as much as possible
    function placeAndFillBuyOrder() payable external;
    //Place a sell order and fill it immediately as much as possible
    function placeAndFillSellOrder(uint256 _amount) external;

    //The amount of a buy order that can be filled immediately
    function buyOrderFillableAmount(uint256 _index) external view returns (uint256 amount);
    //The amount of a sell order that can be filled immediately
    function sellOrderFillableAmount(uint256 _index) external view returns (uint256 amount);

    //Get the order indexes of a buyer
    function getBuyOrderIndexes(address _buyer) public view returns (uint256[] indexes);
    //Get the order indexes of a seller
    function getSellOrderIndexes(address _seller) public view returns (uint256[] indexes);

    //Fills a buy order as far as possible, also filling sell orders with the equivalent amount in DIV
    function fillBuyOrder(uint256 _index) external;
    //Fills a sell order as far as possible, also filling buy order with the equivalent amount in ether
    function fillSellOrder(uint256 _index) external;

    //Cancels a buy order and refunds the amount that's left
    function cancelBuyOrder(uint256 _index) external;
    //Cancels a sell order and refunds the amount that's left
    function cancelSellOrder(uint256 _index) external;

    //Price of 10**18 DIV in Wei
    function divPrice() public view returns (uint256 price);
    //Converts an amount of wei to the DIV equivalent
    function toDiv(uint256 _weiAmount) external view returns (uint256 divAmount);
    //Converts an amount of DIV to the wei equivalent
    function toWei(uint256 _divAmount) external view returns (uint256 weiAmount);

    //Transfers wei to the treasury, minting an equivalent
    //amount DIV and filling open buy orders with it
    function transferWeiToTreasury(uint256 _amount) external;
    //Fills open sell orders with the received ether deposit,
    //burning an equivalent amount of DIV
    function handleEtherDeposit() external payable;

    event BuyOrderPlaced(uint256 index, address sender, uint256 amount);
    event BuyOrderFilled(uint256 indexed index, uint256 amountFilled);
    event BuyOrderCanceled(uint256 indexed index);

    event SellOrderPlaced(uint256 index, address sender, uint256 amount);
    event SellOrderFilled(uint256 indexed index, uint256 amountFilled);
    event SellOrderCanceled(uint256 indexed index);
}

contract Exchange is AExchange {

    uint64 constant priceMultiplier = 1e18;

    function Exchange(ADivisionsToken _divToken, AStakeManager _stakeManager) public {
        divToken = _divToken;
        stakeManager = _stakeManager;
        treasury = _stakeManager.treasury();

        totalSellAmountFilled = 0;
        totalBuyAmountFilled = 0;

        buyOrderCursor = 0;
        sellOrderCursor = 0;
    }
    
    function setMinBuyOrderAmount(uint256 _min) external onlyOwner {
        minBuyOrderAmount = _min;
    }

    function setMinSellOrderAmount(uint256 _min) external onlyOwner {
        minSellOrderAmount = _min;
    }

    function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData) external {
        require(_token == address(divToken));
        require(_token == msg.sender);

        Order storage sellOrder = placeSellOrder(_value, _from);
        
        // if _extraData == 0xef0c7686
        if(_extraData.length == 4 && keccak256(_extraData) == keccak256(bytes4(keccak256("placeAndFillSellOrder")))) {
            fillSellOrderWithBuyOrders(sellOrder, divPrice());    
        }        
    }

    function buyOrdersLength() public view returns (uint256) {
        return buyOrders.length;
    }

    function sellOrdersLength() public view returns (uint256) {
        return sellOrders.length;
    }

    function weiReserve() public view returns (uint256 reserve) {
        return reserve = address(this).balance.sub(totalPayments);
    }

    function divReserve() public view returns (uint256 reserve) {
        return reserve = divToken.balanceOf(address(this));
    }

    function placeBuyOrder() payable external {
        placeBuyOrder(msg.value, msg.sender);
    }

    function placeBuyOrder(uint256 _amount, address _sender) internal returns (Order storage buyOrder) {
        require(_amount >= minBuyOrderAmount);

        uint256 index = buyOrders.length;

        buyOrders.push(Order ({
            sender: _sender,
            amount: _amount,
            cumulativeAmount: lastBuyOrderCumulativeAmount().add(_amount),
            amountFilled: 0,
            amountCancelled: 0,
            index: index,
            finished: false
        }));
        
        buyOrderIndexes[_sender].push(index);

        emit BuyOrderPlaced(index, _sender, _amount);

        return buyOrder = buyOrders[index];
    }

    function placeSellOrder(uint256 _amount) external {
        placeSellOrder(_amount, msg.sender);
    }

    function placeSellOrder(uint256 _amount, address _sender) internal returns (Order storage sellOrder) {
        require(_amount > 0);
        divToken.transferFrom(_sender, address(this), _amount);

        uint256 index = sellOrders.length;

        sellOrders.push(Order ({
            sender: _sender,
            amount: _amount,
            cumulativeAmount: lastSellOrderCumulativeAmount().add(_amount),
            amountFilled: 0,
            amountCancelled: 0,
            index: index,
            finished: false
        }));

        sellOrderIndexes[_sender].push(index);

        emit SellOrderPlaced(index, _sender, _amount);

        return sellOrder = sellOrders[index];
    }

    function placeAndFillBuyOrder() payable external {
        Order storage buyOrder = placeBuyOrder(msg.value, msg.sender);
        fillBuyOrderWithSellOrders(buyOrder, divPrice());
    }

    function placeAndFillSellOrder(uint256 _amount) external {
        Order storage sellOrder = placeSellOrder(_amount, msg.sender);
        fillSellOrderWithBuyOrders(sellOrder, divPrice());
    }

    function buyOrderFillableAmount(uint256 _index) external view returns (uint256 amount) {
        Order storage buyOrder = buyOrders[_index];
        return amount = Math.min256(buyOrderReserveLeft(buyOrder, divPrice()), orderAmountLeft(buyOrder));
    }

    function sellOrderFillableAmount(uint256 _index) external view returns (uint256 amount) {
        Order storage sellOrder = sellOrders[_index];
        return amount = Math.min256(sellOrderReserveLeft(sellOrder, divPrice()), orderAmountLeft(sellOrder));
    }

    function buyOrderReserveLeft(Order storage _buyOrder, uint256 _divPrice) internal view returns(uint256 reserveLeft) {
        return reserveLeft = toWei(divReserve(), _divPrice) + totalBuyAmountFilled + _buyOrder.amount - _buyOrder.cumulativeAmount;
    }

    function sellOrderReserveLeft(Order storage _sellOrder, uint256 _divPrice) internal view returns(uint256 reserveLeft) {
        return reserveLeft = toDiv(weiReserve(), _divPrice) + totalSellAmountFilled + _sellOrder.amount - _sellOrder.cumulativeAmount;
    }

    function orderAmountLeft(Order storage _order) internal view returns(uint256 amountLeft){
        return amountLeft = _order.amount - _order.amountFilled - _order.amountCancelled;
    }

    function getBuyOrderIndexes(address _buyer) public view returns (uint256[] indexes) {
        return buyOrderIndexes[_buyer];
    }

    function getSellOrderIndexes(address _seller) public view returns (uint256[] indexes) {
        return sellOrderIndexes[_seller];
    }

    function fillBuyOrder(uint256 _index) external {
        Order storage buyOrder = buyOrders[_index];
        fillBuyOrderWithSellOrders(buyOrder, divPrice());
    }  

    function fillSellOrder(uint256 _index) external {
        Order storage sellOrder = sellOrders[_index];
        fillSellOrderWithBuyOrders(sellOrder, divPrice());
    }

    function fillBuyOrderWithSellOrders(Order storage _buyOrder, uint256 _divPrice) internal {
        uint256 buyAmountFilled = fillBuyOrderUpUntil(_buyOrder, _buyOrder.amount, _divPrice);
        
        uint256 sellAmountToFill = toDiv(buyAmountFilled, _divPrice);
        
        // Require that an equivalent total amount of sell order is filled
        require(fillFirstOpenSellOrdersUpUntil(sellAmountToFill, _divPrice) == sellAmountToFill);
    }

    function fillSellOrderWithBuyOrders(Order storage _sellOrder, uint256 _divPrice) internal {
        uint256 sellAmountFilled = fillSellOrderUpUntil(_sellOrder, _sellOrder.amount, _divPrice);
        
        uint256 buyAmountToFill = toWei(sellAmountFilled, _divPrice);
        
        // Require that an equivalent total amount of buy order is filled
        require(fillFirstOpenBuyOrdersUpUntil(buyAmountToFill, _divPrice) == buyAmountToFill);
    }

    // Fills the first open sell orders until the _amount is reached, returns the amount it actually did fill
    function fillFirstOpenBuyOrdersUpUntil(uint256 _amount, uint256 _divPrice) internal returns (uint256 filledAmount){
        uint256 amountLeftToFill = _amount;
        
        uint256 tempCursor = buyOrderCursor;
        while(amountLeftToFill > 0) {
            Order storage buyOrder = getNextBuyOrder(tempCursor);

            if(buyOrder.sender == address(0))
                break;
            
            uint256 amountFilled = fillBuyOrderUpUntil(buyOrder, amountLeftToFill, _divPrice);
            
            assert(amountFilled > 0);

            amountLeftToFill -= amountFilled;
            tempCursor = buyOrder.index;
        }
        buyOrderCursor = tempCursor;

        return filledAmount = _amount - amountLeftToFill;
    }

    // Fills the first open sell orders until the _amount is reached, returns the amount it actually did fill
    function fillFirstOpenSellOrdersUpUntil(uint256 _amount, uint256 _divPrice) internal returns (uint256 filledAmount) {
        uint256 amountLeftToFill = _amount;

        uint256 tempCursor = sellOrderCursor;
        while(amountLeftToFill > 0) {
            Order storage sellOrder = getNextSellOrder(tempCursor);
            
            if(sellOrder.sender == address(0))
                break;
            
            uint256 amountFilled = fillSellOrderUpUntil(sellOrder, amountLeftToFill, _divPrice);

            assert(amountFilled > 0);

            amountLeftToFill -= amountFilled;
            tempCursor = sellOrder.index;
        }
        sellOrderCursor = tempCursor;

        return filledAmount = _amount - amountLeftToFill;
    }

    // Fills a buy order with a maximum. Returns the amount it actually did fill
    function fillBuyOrderUpUntil(Order storage _buyOrder, uint256 _max, uint256 _divPrice) internal returns (uint256 filledAmount) {
        // The amount left in reserve that can be used to fill this order and every open order before it
        uint256 reserveLeft = buyOrderReserveLeft(_buyOrder, _divPrice);
        // The amount the order needs to be filled completely
        uint256 amountLeft = orderAmountLeft(_buyOrder);
        
        //The amount we can fill to this order at this time
        uint256 fillableAmount = Math.min256(reserveLeft, amountLeft);
        
        if(fillableAmount > 0){
            filledAmount = Math.min256(_max, fillableAmount);
            
            if(filledAmount > 0){
                // Add the filled amount to the order
                _buyOrder.amountFilled += filledAmount;
                // Update the total amount of wei filled
                totalBuyAmountFilled += filledAmount;

                // Transfer the equivalent in DIV to the sender
                divToken.transfer(_buyOrder.sender, toDiv(filledAmount, _divPrice));

                emit BuyOrderFilled(_buyOrder.index, filledAmount);
                
                // Record whether the order was filled completely
                _buyOrder.finished = filledAmount == amountLeft;
                return filledAmount;
            }
        }
        return filledAmount = 0;
    }

    // Fills a sell order with a maximum. Returns the amount it actually did fill
    function fillSellOrderUpUntil(Order storage _sellOrder, uint256 _max, uint256 _divPrice) internal returns (uint256 filledAmount) {
        // The amount left in reserve that can be used to fill this order and every open order before it
        uint256 reserveLeft = sellOrderReserveLeft(_sellOrder, _divPrice);
        // The amount the order needs to be filled completely
        uint256 amountLeft = orderAmountLeft(_sellOrder);

        //The amount we can fill to this order at this time
        uint256 fillableAmount = Math.min256(reserveLeft, amountLeft);
      
        if(fillableAmount > 0){
            filledAmount = Math.min256(_max, fillableAmount);
            
            if(filledAmount > 0){
                // Add the filled amount to the order
                _sellOrder.amountFilled += filledAmount;
                // Update the total amount of DIV filled
                totalSellAmountFilled += filledAmount;
                
                // Send the equivalent in wei to the sender
                asyncSend(_sellOrder.sender, toWei(filledAmount, _divPrice));

                emit SellOrderFilled(_sellOrder.index, filledAmount);

                // Record whether the order was filled completely
                _sellOrder.finished = filledAmount == amountLeft;
                return filledAmount;
            }
        }
        return filledAmount = 0;
    }

    function cancelBuyOrder(uint256 _index) external {
        Order storage buyOrder = buyOrders[_index];
        require(msg.sender == buyOrder.sender);

        uint256 amountLeft = orderAmountLeft(buyOrder);

        require(amountLeft > 0);
        assert(amountLeft <= weiReserve());
        
        buyOrder.amountCancelled += amountLeft;
        asyncSend(buyOrder.sender, amountLeft);

        emit BuyOrderCanceled(_index);
    }

    function cancelSellOrder(uint256 _index) external {
        Order storage sellOrder = sellOrders[_index];
        require(msg.sender == sellOrder.sender);

        uint256 amountLeft = orderAmountLeft(sellOrder);

        require(amountLeft > 0);
        assert(amountLeft <= divReserve());

        sellOrder.amountCancelled += amountLeft;
        divToken.transfer(sellOrder.sender, amountLeft);

        emit SellOrderCanceled(_index);

    }
    
    //Price in [priceMultiplier] * wei / DIV
    function divPrice() public view returns (uint256 price) {
        uint256 totalPoolSize;
        uint256 totalSupply = divToken.totalSupply();
        
        // calculate treasury.getTotalPoolSize() only once when necessary
        // as it is very expensive
        if(totalSupply == 0 || (totalPoolSize = treasury.getTotalPoolSize()) == 0)
            return price = 1 * priceMultiplier;
        else
            return price = totalPoolSize.mul(priceMultiplier).div(totalSupply);
    }

    function toDiv(uint256 _weiAmount) external view returns (uint256 divAmount) {
        return divAmount = toDiv(_weiAmount, divPrice());
    }

    function toDiv(uint256 _weiAmount, uint256 _divPrice) internal pure returns (uint256 divAmount) {
        return divAmount = _weiAmount.mul(priceMultiplier).div(_divPrice);
    }

    function toWei(uint256 _divAmount) external view returns (uint256 weiAmount) {
        return weiAmount = toWei(_divAmount, divPrice());
    }

    function toWei(uint256 _divAmount, uint256 _divPrice) internal pure returns (uint256 weiAmount) {
        return weiAmount = _divAmount.mul(_divPrice).div(priceMultiplier);
    }

    function transferWeiToTreasury(uint256 _amount) external onlyStakeManager {
        require(weiReserve() >= _amount);
        uint256 price = divPrice();

        divToken.mint(address(this), toDiv(_amount, price));

        fillFirstOpenBuyOrdersUpUntil(_amount, price);
        
        treasury.deposit.value(_amount)();
    }

    function handleEtherDeposit() external payable {
        uint256 price = divPrice();
        uint256 amountLeftToFill = toDiv(msg.value, price);
        require(divReserve() >= amountLeftToFill);
        
        divToken.burn(amountLeftToFill);
        fillFirstOpenSellOrdersUpUntil(amountLeftToFill, price);
    }

    function lastBuyOrderCumulativeAmount() private view returns (uint256 amount) {
        if(buyOrders.length == 0) return amount = 0;
        else return amount = buyOrders[buyOrders.length - 1].cumulativeAmount;
    }

    function lastSellOrderCumulativeAmount() private view returns (uint256 amount) {
        if(sellOrders.length == 0) return amount = 0;
        else return amount = sellOrders[sellOrders.length - 1].cumulativeAmount;
    }

    function getNextBuyOrder(uint256 _from) internal view returns (Order storage nextBuyOrder) {
        uint256 i = _from;

        while((nextBuyOrder = buyOrders[i]).finished && nextBuyOrder.sender != address(0))
            i++;

        return nextBuyOrder;
    }

    function getNextSellOrder(uint256 _from) internal view returns (Order storage nextSellOrder) {
        uint256 i = _from;

        while((nextSellOrder = sellOrders[i]).finished && nextSellOrder.sender != address(0))
            i++;

        return nextSellOrder;
    }

    modifier onlyStakeManager() {
        require(msg.sender == address(stakeManager));
        _;
    }
}