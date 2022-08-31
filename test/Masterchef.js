const { expect } = require("chai");
const { BigNumber } = require("ethers");
const hre = require("hardhat");
const { ethers } = require("hardhat");
const {
  getLatestBlockTimestamp,
  advanceTimeAndBlock,
} = require("../utils/blocktime");

describe("MasterChef", function () {
  beforeEach(async () => {
    const RewardToken = await hre.ethers.getContractFactory("RewardToken");
    rewardToken = await RewardToken.deploy();
    await rewardToken.deployed();
    const MockToken = await hre.ethers.getContractFactory("ERC20Mock");
    mockToken = await MockToken.deploy(
      "LP Token",
      "LP",
      "1000000000000000000000"
    );
    await mockToken.deployed();
    const MasterChef = await hre.ethers.getContractFactory("MasterChef");
    const latestTimestamp = await getLatestBlockTimestamp();
    masterChef = await MasterChef.deploy(
      rewardToken.address,
      1,
      latestTimestamp + 10,
      mockToken.address
    );
    await masterChef.deployed();
  });
  it("Should deposit", async function () {
    const [owner, bob, alice] = await ethers.getSigners();

    await mockToken
      .connect(bob)
      .approve(masterChef.address, ethers.constants.MaxUint256);
    await mockToken
      .connect(alice)
      .approve(masterChef.address, ethers.constants.MaxUint256);

    await mockToken
      .connect(owner)
      .mint(
        bob.address,
        BigNumber.from(ethers.utils.parseUnits("10000000", 18)).toString()
      );
    await mockToken
      .connect(owner)
      .mint(
        alice.address,
        BigNumber.from(ethers.utils.parseUnits("10000000", 18)).toString()
      );
    const balance = await mockToken.balanceOf(bob.address);
    await masterChef.connect(bob).deposit(ethers.utils.parseUnits("10", 18));
    await masterChef.connect(alice).deposit(ethers.utils.parseUnits("10", 18));
    const bobInfo = await masterChef.userInfo(bob.address);
    const aliceInfo = await masterChef.userInfo(alice.address);
    expect(bobInfo).to.equal(ethers.utils.parseUnits("10", 18));
    expect(aliceInfo).to.equal(ethers.utils.parseUnits("10", 18));
  });
  it("Should update the pool", async function () {
    const [owner, bob, alice] = await ethers.getSigners();

    await mockToken
      .connect(bob)
      .approve(masterChef.address, ethers.constants.MaxUint256);
    await mockToken
      .connect(alice)
      .approve(masterChef.address, ethers.constants.MaxUint256);

    await mockToken
      .connect(owner)
      .mint(
        bob.address,
        BigNumber.from(ethers.utils.parseUnits("10000000", 18)).toString()
      );
    await mockToken
      .connect(owner)
      .mint(
        alice.address,
        BigNumber.from(ethers.utils.parseUnits("10000000", 18)).toString()
      );
    const balance = await mockToken.balanceOf(bob.address);
    await masterChef.connect(bob).deposit(ethers.utils.parseUnits("10", 18));
    const bobInfo = await masterChef.userInfo(bob.address);
    advanceTimeAndBlock(30000);
    const rewardBalance = await rewardToken.balanceOf(bob.address);
    console.log("ccc:", rewardBalance);
    // const accRewardPerShare = await masterChef.accRewardPerShare();
    await masterChef.connect(alice).deposit(ethers.utils.parseUnits("10", 18));
    const aliceInfo = await masterChef.userInfo(alice.address);
    console;
    expect(bobInfo).to.equal(ethers.utils.parseUnits("10", 18));
    expect(aliceInfo).to.equal(ethers.utils.parseUnits("10", 18));
  });
});
