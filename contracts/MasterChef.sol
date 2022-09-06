// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.8.9;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./RewardToken.sol";

/**
 * @author boltsr
 * @title Masterchef Project
 * @notice You can use this contract to deposit the tokens and get rewards by second.
 */

contract MasterChef is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    /// @notice Info of each user.
    struct UserInfo {
        // user's deposited LP amount  
        uint256 amount; 
        int256 rewardDebt;
    }
    /// @notice mapping for userInfo
    mapping(address => UserInfo) public userInfo;

    /// @dev LP token interface
    IERC20 lpToken;

    /// @dev last timestamp that received reward
    uint256 lastRewardTime;

    /// @dev reward token amount per LP token
    uint256 accRewardPerShare;

    /// @notice reward token contract
    RewardToken public reward;

    /// @notice reward token amount per second
    uint256 public rewardPerSecond;

    /// @notice start block time that pool generates reward
    uint256 public startTime;

    /// @notice event to alert the user is already deposited
    event Deposit(address indexed user, uint256 amount);

    /// @notice event to alert the user is withdrawed his lp tokens
    event Withdraw(address indexed user, uint256 amount);

    /// @notice event to alert the user is claim pending reward tokens
    event Claim(address indexed user, uint256 amount);

    /// @notice Initialize the project, config the pool
    constructor(
        RewardToken _reward,
        uint256 _rewardPerSecond,
        uint256 _startTime,
        IERC20 _lpToken
    ) {
        reward = _reward;
        rewardPerSecond = _rewardPerSecond;
        startTime = _startTime;
        lpToken = _lpToken;
    }

    /// @notice Update the pool info.
    /// @dev Update the configuration of pool when user call the deposit, withdraw and claim function.
    function updatePool() public {
        if (block.timestamp <= lastRewardTime) {
            return;
        }
        uint256 lpSupply = lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            lastRewardTime = block.timestamp;
            return;
        }
        uint256 tokenReward = (block.timestamp - lastRewardTime) *
            rewardPerSecond;
        accRewardPerShare = accRewardPerShare + tokenReward*1e12/lpSupply;
        reward.mint(address(this), tokenReward);
        lastRewardTime = block.timestamp;
    }

    /// @notice User deposite with LP tokens.
    /// @dev Update pool info and user info and get pending rewardb .
    function deposit(uint256 _amount) public {
        UserInfo storage user = userInfo[msg.sender];
        updatePool();
        lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);
        user.amount = user.amount + _amount;
        user.rewardDebt = user.rewardDebt + int256(_amount * accRewardPerShare / 1e12);
        emit Deposit(msg.sender, _amount);
    }

    /// @notice User withdraw the LP tokens.
    /// @dev Update pool info and user info and get pending reward.
    function withdraw(uint256 _amount) public {
        UserInfo storage user = userInfo[msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        updatePool();
        user.amount = user.amount - _amount;
        user.rewardDebt = user.rewardDebt - int256(_amount * accRewardPerShare / 1e12);
        lpToken.safeTransfer(address(msg.sender), _amount);
        emit Withdraw(msg.sender, _amount);
    }

    /// @notice User claim only pending reward.
    /// @dev Update pool info and user info.
    function claim() public {
        UserInfo storage user = userInfo[msg.sender];
        updatePool();
        uint256 pending = pendingReward(msg.sender);
        user.rewardDebt = int256(user.amount * accRewardPerShare / 1e12);
        safeRewardTokenTransfer(msg.sender, pending);
        emit Claim(msg.sender, pending);
    }
    function claimAndWitdraw(uint256 _amount) public {
        UserInfo storage user = userInfo[msg.sender];
        updatePool();
        uint256 pending = pendingReward(msg.sender);
        safeRewardTokenTransfer(msg.sender, pending);
        user.amount = user.amount - _amount;
        user.rewardDebt = int256(user.amount * accRewardPerShare / 1e12);
        lpToken.safeTransfer(address(msg.sender), _amount);
    }

    function pendingReward(address _user)
        public
        view
        returns (uint256)
    {
        UserInfo storage user = userInfo[_user];
        return uint256(int256(user.amount * (accRewardPerShare) / 1e12) - user.rewardDebt);
    }

    /// @notice Send reward token to user
    function safeRewardTokenTransfer(address _to, uint256 _amount) internal {
        uint256 rewardBal = reward.balanceOf(address(this));
        if (_amount > rewardBal) {
            reward.transfer(_to, rewardBal);
        } else {
            reward.transfer(_to, _amount);
        }
    }
}
