pragma solidity 0.4.21;

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
        address sender;
        uint256 amount; 
        uint256 cumulativeAmount;
        uint256 amountFilled;
        uint256 amountCancelled;
        uint256 index;
        bool finished;
    }
    
    Order[] public buyOrders;
    uint256 public buyOrderCursor;
    mapping(address => uint256[]) buyOrderIndexes;
    
    Order[] public sellOrders;
    uint256 public sellOrderCursor;
    mapping(address => uint256[]) sellOrderIndexes;

    uint256 public totalDivFilled;
    uint256 public totalWeiFilled;

    function buyOrdersLength() public view returns (uint256 length);
    function sellOrdersLength() public view returns (uint256 length);

    function weiReserve() public view returns (uint256 reserve);
    function divReserve() public view returns (uint256 reserve);

    function placeBuyOrder() payable external;
    function placeSellOrder(uint256 _amount) external;

    function buyOrderFillableAmount(uint256 _index) external view returns (uint256 amount);
    function sellOrderFillableAmount(uint256 _index) external view returns (uint256 amount);

    function getBuyOrderIndexes(address _buyer) public view returns (uint256[] indexes);
    function getSellOrderIndexes(address _seller) public view returns (uint256[] indexes);

    function fillBuyOrder(uint256 _index) external;
    function fillSellOrder(uint256 _index) external;

    function cancelBuyOrder(uint256 _index) external;
    function cancelSellOrder(uint256 _index) external;

    function divPrice() public view returns (uint256 price); //Price of 10**18 DIV in Wei
    function toDiv(uint256 _weiAmount) external view returns (uint256 divAmount);
    function toWei(uint256 _divAmount) external view returns (uint256 weiAmount);

    function transferWeiToTreasury(uint256 _amount) external;
    function handleDepositFromTreasury() external payable;

    event BuyOrderPlaced(uint256 index, address sender, uint256 amount);
    event BuyOrderFilled(uint256 indexed index, uint256 amountFilled);
    
    event SellOrderPlaced(uint256 index, address sender, uint256 amount);
    event SellOrderFilled(uint256 indexed index, uint256 amountFilled);

    event WeiReserveUpdated(uint256 weiReserve);
    event DivReserveUpdated(uint256 divReserve);
}

contract Exchange is AExchange {

    uint64 constant priceMultiplier = 10 ** 18;

    function Exchange(ADivisionsToken _divToken, AStakeManager _stakeManager) public {
        divToken = _divToken;
        stakeManager = _stakeManager;
        treasury = _stakeManager.treasury();
        totalDivFilled = 0;
        totalWeiFilled = 0;
        buyOrderCursor = 0;
        sellOrderCursor = 0;
    }

    function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData) external {
        require(_token == address(divToken));
        require(_token == msg.sender);
        
        placeSellOrder(_value, _from);
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
        require(msg.value > 0);

        uint256 index = buyOrders.length;

        buyOrders.push(Order ({
            sender: msg.sender,
            amount: msg.value,
            cumulativeAmount: lastBuyOrderCumulativeAmount().add(msg.value),
            amountFilled: 0,
            amountCancelled: 0,
            index: index,
            finished: false
        }));
        
        buyOrderIndexes[msg.sender].push(index);

        emit BuyOrderPlaced(index, msg.sender, msg.value);
    }

    function placeSellOrder(uint256 _amount) external {
        placeSellOrder(_amount, msg.sender);
    }

    function placeSellOrder(uint256 _amount, address _sender) internal {
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
        return reserveLeft = toWei(divReserve() + totalDivFilled, _divPrice) - (_buyOrder.cumulativeAmount - _buyOrder.amount);
    }

    function sellOrderReserveLeft(Order storage _sellOrder, uint256 _divPrice) internal view returns(uint256 reserveLeft) {
        return reserveLeft = toWei(weiReserve() + totalWeiFilled, _divPrice) - (_sellOrder.cumulativeAmount - _sellOrder.amount);
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

    function getBuyOrder(uint256 _index) external view returns (address, uint256, uint256, uint256) {
        Order storage buyOrder = buyOrders[_index];
        return (buyOrder.sender, buyOrder.amount, buyOrder.cumulativeAmount, buyOrder.amountFilled);
    }

    function getSellOrder(uint256 _index) external view returns (address, uint256, uint256, uint256) {
        Order storage sellOrder = sellOrders[_index];
        return (sellOrder.sender, sellOrder.amount, sellOrder.cumulativeAmount, sellOrder.amountFilled);
    }

    function fillBuyOrder(uint256 _index) external {
        Order storage buyOrder = buyOrders[_index];
        require(fillBuyOrderUpUntil(buyOrder, buyOrder.amount, divPrice()) > 0);
    }  

    function fillSellOrder(uint256 _index) external {
        Order storage sellOrder = sellOrders[_index];
        require(fillSellOrderUpUntil(sellOrder, sellOrder.amount, divPrice()) > 0);
    }

    function fillBuyOrderUpUntil(Order storage _buyOrder, uint256 _max, uint256 _divPrice) internal returns (uint256 filledAmount) {
        uint256 reserveLeft = buyOrderReserveLeft(_buyOrder, _divPrice);
        uint256 amountLeft = orderAmountLeft(_buyOrder);
        uint256 fillableAmount = Math.min256(reserveLeft, amountLeft);
        
        if(fillableAmount > 0){
            filledAmount = Math.min256(_max, fillableAmount);
            
            if(filledAmount > 0){
                _buyOrder.amountFilled += filledAmount;
                totalWeiFilled += filledAmount;
                divToken.transfer(_buyOrder.sender, toDiv(filledAmount, _divPrice));

                emit BuyOrderFilled(_buyOrder.index, filledAmount);
                
                _buyOrder.finished = filledAmount == amountLeft;
                return filledAmount;
            }
        }
        return filledAmount = 0;
    }

    function fillSellOrderUpUntil(Order storage _sellOrder, uint256 _max, uint256 _divPrice) internal returns (uint256 filledAmount) {
        
        uint256 reserveLeft = sellOrderReserveLeft(_sellOrder, _divPrice);
        uint256 amountLeft = orderAmountLeft(_sellOrder);
        uint256 fillableAmount = Math.min256(reserveLeft, amountLeft);
    
        if(fillableAmount > 0){
            filledAmount = Math.min256(_max, fillableAmount);
            
            if(filledAmount > 0){
                _sellOrder.amountFilled += filledAmount;
                totalDivFilled += filledAmount;
                
                asyncSend(_sellOrder.sender, toWei(filledAmount, _divPrice));

                emit SellOrderFilled(_sellOrder.index, filledAmount);
                return filledAmount;
            }
        }
        return filledAmount = 0;
    }

    function cancelBuyOrder(uint256 _index) external {
        Order storage buyOrder = buyOrders[_index];
        uint256 amountToCancel = buyOrder.amount - buyOrder.amountFilled - buyOrder.amountCancelled;

        require(amountToCancel > 0);
        assert(amountToCancel <= weiReserve());
        
        buyOrder.amountCancelled += amountToCancel;
        asyncSend(buyOrder.sender, amountToCancel);
    }

    function cancelSellOrder(uint256 _index) external {

    }
    
    //Price in priceMultiplier() * wei / DIV
    function divPrice() public view returns (uint256 price) {
        uint256 totalPoolSize;
        uint256 totalSupply = divToken.totalSupply();
        
        // calculate treasury.getTotalPoolSize() only once when nessecary
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

        uint256 amountLeftToFill = _amount;
        uint256 tempCursor = buyOrderCursor;
        while(amountLeftToFill > 0) {
            Order storage buyOrder = getNextBuyOrder(tempCursor);
            amountLeftToFill -= fillBuyOrderUpUntil(buyOrder, amountLeftToFill, price);
            tempCursor = buyOrder.index + 1;
        }
        buyOrderCursor = tempCursor;

        treasury.deposit.value(_amount)();
    }

    function handleDepositFromTreasury() external payable {
        
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
        do {
            nextBuyOrder = buyOrders[i];
            i++;
        } while(nextBuyOrder.finished);
        
        return nextBuyOrder;
    }

    modifier onlyStakeManager() {
        
        require(msg.sender == address(stakeManager));
        _;
    }
}