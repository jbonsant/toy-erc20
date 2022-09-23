// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/* Errors */
error ToyToken__NotOwner();
error ToyToken__NoEthSent();
error ToyToken__NotEnoughTokens();

/**
 * @title Toy Token
 * @author Jeremie Bonsant
 * @notice This contract is for creating ERC20 Toy Token. 
 *         With this contract, some random amount of Toy Tokens can be bought.
 * @dev The randomness used in this contract is predicatable. This is not safe.
 */
contract ToyToken is ERC20 {

    /* State variables */

    uint16 public constant EXCHANGE_RATE_MIN = 10;
    uint16 public constant EXCHANGE_RATE_MAX = 100;
    uint16 private constant EXCHANGE_RATE_RANGE = EXCHANGE_RATE_MAX - EXCHANGE_RATE_MIN;

    address private immutable i_owner;

    /* Events */

    /**
    * @dev Emitted on randomEtherToToy()
    * @param buyer The address of the buyer
    * @param ethAmount The amount of ETH in Wei used in the exchange
    * @param exchangeRate The exchange rate used (tokenAmount = ethAmount * exchangeRate)
    **/
    event TokenBought(address indexed buyer, uint256 ethAmount, uint16 exchangeRate);

    /* Modifiers */

    modifier onlyOwner() {
        if (msg.sender != i_owner) revert ToyToken__NotOwner();
        _;
    }

    /* Functions */ 

    constructor() ERC20("Toy Token", "TOY") {
        i_owner = msg.sender;
        _mint(msg.sender, 100 * 10**uint(decimals()));
    }

    /* Public Functions */

    /**
     * @notice Buy some random amount of Toy Tokens with some Ethers.
     * The exchange rate is pseudo-random. 
     * For 'n' amount Ether, the buyer can get between 10n and 100n Toy Tokens.
     */
    function randomEtherToToy() public payable {
        if (msg.value == 0) {
            revert ToyToken__NoEthSent();
        }

        uint16 exchangeRate = _generateRandomExchangeRate();
        uint256 amountToBuy = msg.value * exchangeRate;

        if (balanceOf(i_owner) < amountToBuy) {
            revert ToyToken__NotEnoughTokens();
        }

        _transfer(i_owner, msg.sender, amountToBuy);

        emit TokenBought(msg.sender, msg.value, exchangeRate);
    }

    /**
     * @notice Withdraw all the ethers from the contract.
     */
    function withdraw() public onlyOwner {
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    /* Getter Functions */

    /**
     * @notice Returns the contract owner address.
     */
    function getOwner() public view returns (address) {
        return i_owner;
    }

    /* Private functions */

    /**
     * @notice Generate a random exchange rate as a whole number between EXCHANGE_RATE_MIN and EXCHANGE_RATE_MAX
     * IMPORTANT : Randomness provided by this is predicatable. This is not safe.
     * @return the exchange rate generated
     */
    function _generateRandomExchangeRate() private view returns (uint16) {
        uint256 randomNumber = uint256(keccak256(abi.encodePacked(msg.sender, block.timestamp)));
        return uint16(EXCHANGE_RATE_MIN + randomNumber % EXCHANGE_RATE_RANGE);
    }
}