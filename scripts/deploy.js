// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const ONE_DAY_IN_SECS = 24 * 60 * 60;
  const unlockTime = currentTimestampInSeconds + ONE_DAY_IN_SECS;

  const targetAmount = hre.ethers.utils.parseEther("1");

  const Project = await hre.ethers.getContractFactory("RewardToken");
  const project = await Project.deploy();
  console.log("address:", project.address, unlockTime);
  await project.deployed();
  const ProjectFactory = await hre.ethers.getContractFactory("MasterChef");
  const projectFactory = await ProjectFactory.deploy(project.address);
  console.log("factory address:", projectFactory.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
