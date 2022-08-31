const { expect } = require("chai");
const { BigNumber } = require("ethers");
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { advanceTimeAndBlock } = require("../utils/blocktime");

describe("RewardToken", function () {
  before(async () => {
    const RewardToken = await hre.ethers.getContractFactory("RewardToken");
    rewardToken = await RewardToken.deploy();
    await rewardToken.deployed();
  });
  it("Should Mint", async function () {
    const symbol = await rewardToken.symbol();
    const name = await rewardToken.name();
    const decimal = await rewardToken.decimals();
    const accounts = await ethers.getSigners();
    const tokenHolder = accounts[1];

    expect(symbol).to.equal("RT");
    expect(name).to.equal("RewardToken");
    expect(decimal).to.equal(18);
    await rewardToken.mint(
      tokenHolder.address,
      BigNumber.from("100000000000000000").toString()
    );
    const balance = await rewardToken.balanceOf(tokenHolder.address);
    expect(balance).to.equal("100000000000000000");
  });
});
