// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @author boltsr
 * @title RewardToken Contract
 */
contract RewardToken is ERC20("RewardToken", "RT"), Ownable {
    /// @notice Creates `_amount` token to `_to`. Must only be called by the owner (MasterChef).
    function mint(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
    }
}
