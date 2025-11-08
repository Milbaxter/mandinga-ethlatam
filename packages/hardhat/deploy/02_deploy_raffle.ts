import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Chainlink VRF v2 configuration for different networks
 */
const VRF_CONFIG: Record<number, { coordinator: string; keyHash: string; subscriptionId?: number }> = {
  // Sepolia Testnet
  11155111: {
    coordinator: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
    keyHash: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
  },
  // Arbitrum Sepolia Testnet
  421614: {
    coordinator: "0x9Ddfa818818916dB676401007977829a15915cc6",
    keyHash: "0x83d1b6e3388bed3d76426974512bb0d270e9542a765cd667242ea26c0cc0b730",
  },
  // Ethereum Mainnet
  1: {
    coordinator: "0x271682DEB8C4E0901D1a1550aD2e64D568E69909",
    keyHash: "0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef",
  },
  // Arbitrum One
  42161: {
    coordinator: "0x41034678D6C633D8a95c75e1138A360a28bA15D1",
    keyHash: "0x08ba8f62ff6c40a58877a106147661db43bc58dabfb0ca6fcd2fdd66a0c096a9",
  },
  // Base Mainnet
  8453: {
    coordinator: "0x41034678D6C633D8a95c75e1138A360a28bA15D1",
    keyHash: "0x08ba8f62ff6c40a58877a106147661db43bc58dabfb0ca6fcd2fdd66a0c096a9",
  },
  // Base Sepolia
  84532: {
    coordinator: "0x9Ddfa818818916dB676401007977829a15915cc6",
    keyHash: "0x83d1b6e3388bed3d76426974512bb0d270e9542a765cd667242ea26c0cc0b730",
  },
  // Optimism Mainnet
  10: {
    coordinator: "0x41034678D6C633D8a95c75e1138A360a28bA15D1",
    keyHash: "0x08ba8f62ff6c40a58877a106147661db43bc58dabfb0ca6fcd2fdd66a0c096a9",
  },
  // Optimism Sepolia
  11155420: {
    coordinator: "0x9Ddfa818818916dB676401007977829a15915cc6",
    keyHash: "0x83d1b6e3388bed3d76426974512bb0d270e9542a765cd667242ea26c0cc0b730",
  },
};

/**
 * Get VRF configuration for the current network
 */
async function getVRFConfig(hre: HardhatRuntimeEnvironment) {
  const chainId = Number(await hre.getChainId());
  const networkName = hre.network.name;

  // Check environment variables first
  const envCoordinator = process.env.VRF_COORDINATOR;
  const envKeyHash = process.env.VRF_KEY_HASH;
  const envSubscriptionId = process.env.VRF_SUBSCRIPTION_ID;

  if (envCoordinator && envKeyHash && envSubscriptionId) {
    return {
      coordinator: envCoordinator,
      keyHash: envKeyHash,
      subscriptionId: BigInt(envSubscriptionId),
    };
  }

  // Check network-specific config
  const networkConfig = VRF_CONFIG[chainId];
  if (networkConfig) {
    const subscriptionId = envSubscriptionId
      ? BigInt(envSubscriptionId)
      : networkConfig.subscriptionId
        ? BigInt(networkConfig.subscriptionId)
        : null;

    if (!subscriptionId) {
      throw new Error(
        `VRF Subscription ID not provided for network ${networkName} (chainId: ${chainId}). ` +
          `Please set VRF_SUBSCRIPTION_ID environment variable or add it to VRF_CONFIG.`
      );
    }

    return {
      coordinator: networkConfig.coordinator,
      keyHash: networkConfig.keyHash,
      subscriptionId: subscriptionId,
    };
  }

  // For localhost/hardhat, we need a mock or skip VRF
  if (networkName === "localhost" || networkName === "hardhat") {
    console.warn(
      "⚠️  WARNING: Chainlink VRF is not configured for localhost/hardhat network. " +
        "You may need to deploy a mock VRF Coordinator or use a testnet."
    );
    // For localhost, you can use a mock address or skip VRF
    // For now, we'll throw an error to make it explicit
    throw new Error(
      `Chainlink VRF is not configured for ${networkName}. ` +
        `Please set VRF_COORDINATOR, VRF_KEY_HASH, and VRF_SUBSCRIPTION_ID environment variables, ` +
        `or deploy to a supported testnet (Sepolia, Arbitrum Sepolia, etc.).`
    );
  }

  throw new Error(
    `Chainlink VRF configuration not found for network ${networkName} (chainId: ${chainId}). ` +
      `Please set VRF_COORDINATOR, VRF_KEY_HASH, and VRF_SUBSCRIPTION_ID environment variables.`
  );
}

/**
 * Deploys the Raffle contract that uses ETH as the prize currency and Chainlink VRF for randomness
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

  // Get Chainlink VRF configuration
  const vrfConfig = await getVRFConfig(hre);

  console.log("Deploying Raffle contract...");
  console.log("Prize Amount:", prizeAmount.toString(), "wei (1 ETH)");
  console.log("Total Quotas:", totalQuotas.toString());
  console.log("Price per Quota:", hre.ethers.formatEther(prizeAmount / BigInt(totalQuotas)), "ETH");
  console.log("\n=== Chainlink VRF Configuration ===");
  console.log("VRF Coordinator:", vrfConfig.coordinator);
  console.log("Key Hash:", vrfConfig.keyHash);
  console.log("Subscription ID:", vrfConfig.subscriptionId.toString());
  console.log("=====================================\n");

  await deploy("Raffle", {
    from: deployer,
    args: [
      prizeAmount,
      totalQuotas,
      vrfConfig.coordinator,
      vrfConfig.subscriptionId,
      vrfConfig.keyHash,
    ],
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
  console.log("\n⚠️  IMPORTANT: Make sure your Chainlink VRF subscription has sufficient LINK balance!");
  console.log("   You can fund your subscription at: https://vrf.chain.link/");
};

export default deployRaffle;

// Tags are useful if you have multiple deploy files and only want to run one of them.
deployRaffle.tags = ["Raffle"];

