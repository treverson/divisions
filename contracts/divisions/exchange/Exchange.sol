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

    function buyOrderFillableAmount(uint256 _index) public view returns (uint256 amount);
    function sellOrderFillableAmount(uint256 _index) public view returns (uint256 amount);

    function getBuyOrderIndexes(address _buyer) public view returns (uint256[] indexes);
    function getSellOrderIndexes(address _seller) public view returns (uint256[] indexes);

    function fillBuyOrder(uint256 _index) external;
    function fillSellOrder(uint256 _index) external;

    function divPrice() public view returns (uint256 price); //Price of 10**18 DIV in Wei
    function toDiv(uint256 _weiAmount) public view returns (uint256 divAmount);
    function toWei(uint256 _divAmount) public view returns (uint256 weiAmount);

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
    }

    function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData) external {
        require(_token == address(divToken));
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
        buyOrders.push(Order ({
            sender: msg.sender,
            amount: msg.value,
            cumulativeAmount: lastBuyOrderCumulativeAmount().add(msg.value),
            amountFilled: 0
        }));

        buyOrderIndexes[msg.sender].push(buyOrders.length - 1);

        emit BuyOrderPlaced(buyOrders.length - 1, msg.sender, msg.value);
    }

    function placeSellOrder(uint256 _amount) external {
        placeSellOrder(_amount, msg.sender);
    }

    function placeSellOrder(uint256 _amount, address _sender) internal {
        require(_amount > 0);
        divToken.transferFrom(_sender, address(this), _amount);

        sellOrders.push(Order ({
            sender: _sender,
            amount: _amount,
            cumulativeAmount: lastBuyOrderCumulativeAmount().add(_amount),
            amountFilled: 0
        }));

        sellOrderIndexes[_sender].push(sellOrders.length - 1);

        emit SellOrderPlaced(buyOrders.length - 1, _sender, _amount);
    }

    function buyOrderFillableAmount(uint256 _index) public view returns (uint256 amount) {
        Order storage buyOrder = buyOrders[_index];
        return amount = Math.min256(toWei(divReserve() + totalDivFilled) - buyOrder.cumulativeAmount, buyOrder.amount);
    }

    function sellOrderFillableAmount(uint256 _index) public view returns (uint256 amount) {
        return 0;
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

    }

    function fillSellOrder(uint256 _index) external {

    }
    
    //Price in priceMultiplier() * wei / DIV
    function divPrice() public view returns (uint256 price) {
        uint256 totalPoolSize;
        uint256 totalSupply = divToken.totalSupply();
        
        // calculate treasury.getTotalPoolSize() only once when nessecary
        if(totalSupply == 0 || (totalPoolSize = treasury.getTotalPoolSize()) == 0)
            return price = 1 * priceMultiplier;
        else
            return price = totalPoolSize.mul(priceMultiplier).div(totalSupply);
    }

    function toDiv(uint256 _weiAmount) public view returns (uint256 divAmount) {
        return divAmount = _weiAmount.mul(priceMultiplier).div(divPrice());
    }

    function toWei(uint256 _divAmount) public view returns (uint256 weiAmount) {
        return weiAmount = _divAmount.mul(divPrice()).div(priceMultiplier);
    }

    function transferWeiToTreasury(uint256 _amount) external {
        // treasury.deposit.value(_amount)();
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
}