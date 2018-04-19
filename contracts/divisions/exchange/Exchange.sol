pragma solidity 0.4.21;

import "../../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../../node_modules/zeppelin-solidity/contracts/payment/PullPayment.sol";

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

    function buyOrdersLength() public view returns (uint256 length);
    function sellOrdersLength() public view returns (uint256 length);

    function weiReserve() public view returns (uint256 reserve);
    function divReserve() public view returns (uint256 reserve);

    function placeBuyOrder() payable external;
    function placeSellOrder(uint256 _amount) external;

    function canFillBuyOrderAmount(uint256 _index) public view returns (uint256 amount);
    function canFillSellOrderAmount(uint256 _index) public view returns (uint256 amount);

    function fillBuyOrder(uint256 _index) external;
    function fillSellOrder(uint256 _index) external;

    function divPrice() public view returns (uint256); //Price of 10**18 DIV in Wei
    function toDiv(uint256 _weiAmount) public view returns (uint256);
    function toWei(uint256 _divAmount) public view returns (uint256);

    function transferWeiToTreasury(uint256 amount) external;
    function handleDepositFromTreasury() external payable;

    event BuyOrderPlaced(uint256 index, address sender, uint256 amount);
    event BuyOrderFilled(uint256 indexed index, uint256 amountFilled);
    
    event SellOrderPlaced(uint256 index, address sender, uint256 amount);
    event SellOrderFilled(uint256 indexed index, uint256 amountFilled);

    event WeiReserveUpdated(uint256 weiReserve);
    event DivReserveUpdated(uint256 divReserve);
}

contract Exchange is AExchange {

    function Exchange(ADivisionsToken _divToken, AStakeManager _stakeManager) public {
        divToken = _divToken;
        stakeManager = _stakeManager;
    }

    function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData) external {
        require(_token == address(divToken));
        //TODO
    }

    function buyOrdersLength() public view returns (uint256) {
        return buyOrders.length;
    }
    function sellOrdersLength() public view returns (uint256) {
        return sellOrders.length;
    }

    function weiReserve() public view returns (uint256) {
        return address(this).balance.sub(totalPayments);
    }
    function divReserve() public view returns (uint256) {
        return divToken.balanceOf(address(this));
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
        require(_amount > 0);
        divToken.transferFrom(msg.sender, address(this), _amount);

        sellOrders.push(Order ({
            sender: msg.sender,
            amount: _amount,
            cumulativeAmount: lastBuyOrderCumulativeAmount().add(_amount),
            amountFilled: 0
        }));

        sellOrderIndexes[msg.sender].push(sellOrders.length - 1);

        emit SellOrderPlaced(buyOrders.length - 1, msg.sender, _amount);
    }

    function canFillBuyOrderAmount(uint256 _index) public view returns (uint256) {
        return 0;
    }

    function canFillSellOrderAmount(uint256 _index) public view returns (uint256) {
        return 0;
    }

    function getBuyOrderIndexes(address _buyer) public view returns (uint256[]) {
        return buyOrderIndexes[_buyer];
    }

    function getSellOrderIndexes(address _seller) public view returns (uint256[]) {
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

    function divPrice() public view returns (uint256) { //Price of 10**18 DIV in Wei
        return 10 ** 18;
    }

    function toDiv(uint256 _weiAmount) public view returns (uint256) {

    }
    function toWei(uint256 _divAmount) public view returns (uint256) {

    }

    function transferWeiToTreasury(uint256 amount) external {

    }
    function handleDepositFromTreasury() external payable {
        
    }

    function lastBuyOrderCumulativeAmount() private view returns (uint256) {
        if(buyOrders.length == 0) return 0;
        else return buyOrders[buyOrders.length - 1].cumulativeAmount;
    }

    function lastSellOrderCumulativeAmount() private view returns (uint256) {
        if(sellOrders.length == 0) return 0;
        else return sellOrders[sellOrders.length - 1].cumulativeAmount;
    }

}