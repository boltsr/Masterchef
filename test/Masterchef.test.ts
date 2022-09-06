import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { ethers } from "hardhat";

import {
  Erc20Mock,
  Erc20MockFactory,
  MasterChef,
  MasterChefFactory,
  RewardToken,
  RewardTokenFactory,
} from "../typechain";
import {
  advanceTime,
  advanceTimeAndBlock,
  getLatestBlockTimestamp,
} from "../utils/util";

chai.use(solidity);
const { expect } = chai;

describe("MasterChef", () => {
  let rewardToken: RewardToken, mockToken: Erc20Mock, masterChef: MasterChef;
  let owner: SignerWithAddress,
    bob: SignerWithAddress,
    alice: SignerWithAddress;
  const rewardPerSecond = ethers.utils.parseUnits("1", 18);
  const aliceAmount = ethers.utils.parseUnits("10", 18);
  const bobAmount = ethers.utils.parseUnits("10", 18);
  const startTime = 86400;

  before(async () => {
    [owner, bob, alice] = await ethers.getSigners();
  });

  beforeEach(async () => {
    const RewardToken = <RewardTokenFactory>(
      await ethers.getContractFactory("RewardToken")
    );
    rewardToken = await RewardToken.deploy();
    await rewardToken.deployed();

    const MockToken = <Erc20MockFactory>(
      await ethers.getContractFactory("ERC20Mock")
    );
    mockToken = await MockToken.deploy(
      "LP Token",
      "LP",
      ethers.utils.parseUnits("100000", 18)
    );
    await mockToken.deployed();

    const MasterChef = <MasterChefFactory>(
      await ethers.getContractFactory("MasterChef")
    );
    const latestTimestamp = await getLatestBlockTimestamp();
    masterChef = await MasterChef.deploy(
      rewardToken.address,
      rewardPerSecond,
      latestTimestamp + startTime,
      mockToken.address
    );
    await masterChef.deployed();

    await mockToken
      .connect(bob)
      .approve(masterChef.address, ethers.constants.MaxUint256);
    await mockToken
      .connect(alice)
      .approve(masterChef.address, ethers.constants.MaxUint256);
    await mockToken.mint(bob.address, ethers.utils.parseUnits("10000000", 18));
    await mockToken.mint(
      alice.address,
      ethers.utils.parseUnits("10000000", 18)
    );
    await rewardToken.transferOwnership(masterChef.address);
  });

  it("Should deposit", async () => {
    await masterChef.connect(bob).deposit(ethers.utils.parseUnits("10", 18));
    await masterChef.connect(alice).deposit(ethers.utils.parseUnits("10", 18));
    const bobInfo = await masterChef.userInfo(bob.address);
    const aliceInfo = await masterChef.userInfo(alice.address);
    expect(bobInfo.amount).to.equal(ethers.utils.parseUnits("10", 18));
    expect(aliceInfo.amount).to.equal(ethers.utils.parseUnits("10", 18));
  });

  it("Should update the pool", async () => {
    advanceTimeAndBlock(86400);
    await masterChef.connect(bob).deposit(ethers.utils.parseUnits("10", 18));
    const rewardBalance0 = await rewardToken.balanceOf(masterChef.address);
    const duration = 10;
    advanceTime(duration);
    await masterChef.updatePool();
    const rewardBalance1 = await rewardToken.balanceOf(masterChef.address);
    // const accRewardPerShare = await masterChef.accRewardPerShare();
    expect(rewardBalance1.sub(rewardBalance0)).to.equal(
      rewardPerSecond.mul(duration)
    );
  });

  it("Should update the pool", async () => {
    advanceTimeAndBlock(86400);
    await masterChef.connect(bob).deposit(ethers.utils.parseUnits("10", 18));
    const rewardBalance0 = await rewardToken.balanceOf(masterChef.address);
    const duration = 10;
    advanceTime(duration);
    await masterChef.updatePool();
    const rewardBalance1 = await rewardToken.balanceOf(masterChef.address);
    // const accRewardPerShare = await masterChef.accRewardPerShare();
    expect(rewardBalance1.sub(rewardBalance0)).to.equal(
      rewardPerSecond.mul(duration)
    );
  });

  it("Should withdraw amount and reward", async () => {
    advanceTimeAndBlock(86400);
    await masterChef.connect(bob).deposit(ethers.utils.parseUnits("10", 18));
    const mockTokenBalance0 = await mockToken.balanceOf(bob.address);
    const duration = 10;
    advanceTime(duration);
    const withdrawAmount = ethers.utils.parseUnits("4", 10);
    await masterChef.connect(bob).withdraw(withdrawAmount);
    const mockTokenBalance1 = await mockToken.balanceOf(bob.address);
    expect(mockTokenBalance1.sub(mockTokenBalance0)).to.equal(withdrawAmount);
  });

  it("Should claim", async () => {
    advanceTimeAndBlock(startTime);
    const aliceAmount = ethers.utils.parseUnits("10", 18);
    const bobAmount = ethers.utils.parseUnits("10", 18);
    await masterChef.connect(bob).deposit(bobAmount);
    const duration = 10;
    advanceTime(duration);
    const bOldInfo = await masterChef.userInfo(bob.address);
    const calcBobBalance0 = rewardPerSecond
      .mul(duration)
      .mul(bOldInfo.amount.mul(100).div(bOldInfo.amount))
      .div(100);
    await masterChef.connect(alice).deposit(aliceAmount);
    advanceTime(duration);

    await masterChef.connect(bob).claim();
    const bobBalance2 = await rewardToken.balanceOf(bob.address);
    const bobInfo = await masterChef.userInfo(bob.address);
    const aliceInfo = await masterChef.userInfo(alice.address);
    const totalSupply = bobInfo.amount.add(aliceInfo.amount);
    const calcBobBalance1 = rewardPerSecond
      .mul(duration)
      .mul(bobInfo.amount.mul(100).div(totalSupply))
      .div(100);
    expect(calcBobBalance1.add(calcBobBalance0)).to.equal(bobBalance2);
  });

  it("Should claim and witdraw", async () => {
    advanceTimeAndBlock(startTime);
    await masterChef.connect(bob).deposit(bobAmount);
    const duration = 10;
    advanceTime(duration);
    const bobInfo = await masterChef.userInfo(bob.address);
    const calcBobBalance0 = rewardPerSecond
      .mul(duration)
      .mul(bobInfo.amount.mul(100).div(bobInfo.amount))
      .div(100);
    await masterChef.connect(alice).deposit(aliceAmount);
    advanceTime(duration);
    const aliceInfo = await masterChef.userInfo(alice.address);
    const totalSupply = bobInfo.amount.add(aliceInfo.amount);

    const calcBobBalance1 = rewardPerSecond
      .mul(duration)
      .mul(bobInfo.amount.mul(100).div(totalSupply))
      .div(100);

    await masterChef.connect(bob).claimAndWitdraw(bobAmount);
    const bobBalance2 = await rewardToken.balanceOf(bob.address);
    const bobNewInfo = await masterChef.userInfo(bob.address);

    expect(calcBobBalance1.add(calcBobBalance0)).to.equal(bobBalance2);
    expect(bobNewInfo.amount).to.equal(bobInfo.amount.sub(bobAmount));
  });
});
