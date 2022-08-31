const { expect } = require("chai");
const { BigNumber } = require("ethers");
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { advanceTimeAndBlock } = require("../utils/blocktime");

describe("MockToken", function () {
  before(async () => {
    const MockToken = await hre.ethers.getContractFactory("ERC20Mock");
    mockToken = await MockToken.deploy(
      "LP Token",
      "LP",
      "1000000000000000000000"
    );
    await mockToken.deployed();
  });
  it("Should mint to owner", async function () {
    const symbol = await mockToken.symbol();
    const name = await mockToken.name();
    const decimal = await mockToken.decimals();
    const accounts = await ethers.getSigners();
    const owner = accounts[0];

    expect(symbol).to.equal("LP");
    expect(name).to.equal("LP Token");
    expect(decimal).to.equal(18);
    const balance = await mockToken.balanceOf(owner.address);
    expect(balance).to.equal("1000000000000000000000");
  });
});
