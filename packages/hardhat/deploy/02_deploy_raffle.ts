import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the Raffle contract that uses ETH as the prize currency
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployRaffle: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Raffle parameters
  // Prize: 1 ETH (1 * 10^18 wei)
  const prizeAmount = hre.ethers.parseEther("1");
  // Total quotas: 100
  const totalQuotas = 100;

  console.log("Deploying Raffle contract...");
  console.log("Prize Amount:", prizeAmount.toString(), "wei (1 ETH)");
  console.log("Total Quotas:", totalQuotas.toString());
  console.log("Price per Quota:", hre.ethers.formatEther(prizeAmount / BigInt(totalQuotas)), "ETH");

  await deploy("Raffle", {
    from: deployer,
    args: [prizeAmount, totalQuotas],
    log: true,
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const raffle = await hre.ethers.getContract<Contract>("Raffle", deployer);
  console.log("Raffle deployed at:", raffle.target);

  // Display raffle info
  const raffleInfo = await raffle.getRaffleInfo();
  console.log("\n=== Raffle Information ===");
  console.log("Prize Amount:", raffleInfo[0].toString(), "wei");
  console.log("Total Quotas:", raffleInfo[1].toString());
  console.log("Quota Price:", raffleInfo[3].toString(), "wei");
  console.log("Quota Price:", hre.ethers.formatEther(raffleInfo[3]), "ETH");
  console.log("========================");
};

export default deployRaffle;

// Tags are useful if you have multiple deploy files and only want to run one of them.
deployRaffle.tags = ["Raffle"];

