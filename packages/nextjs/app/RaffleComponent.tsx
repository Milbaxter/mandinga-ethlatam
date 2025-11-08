"use client";

import { useState, useMemo } from "react";
import { formatEther, parseEther, Address } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { Address as AddressComponent } from "~~/components/scaffold-eth";
import { IntegerInput, IntegerVariant } from "~~/components/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { useWatchBalance } from "~~/hooks/scaffold-eth/useWatchBalance";

/**
 * RaffleComponent - A component for interacting with the Raffle smart contract
 * 
 * Features:
 * - Display raffle information (prize, quotas, etc.)
 * - Buy quotas with ETH
 * - Select winner (when quotas are sold out or 7 days passed)
 * - Claim prize (for winner)
 */
export const RaffleComponent = () => {
  const { address: connectedAddress } = useAccount();

  // Check if contract is deployed
  const { data: raffleContractInfo, isLoading: isLoadingContract } = useDeployedContractInfo({ contractName: "Raffle" });

  // Read raffle information
  const { data: raffleInfo, refetch: refetchRaffleInfo, isLoading: isLoadingRaffleInfo } = useScaffoldReadContract({
    contractName: "Raffle",
    functionName: "getRaffleInfo",
  });

  // Read user's quota purchases
  const { data: userQuotas } = useScaffoldReadContract({
    contractName: "Raffle",
    functionName: "quotasPurchased",
    args: connectedAddress ? [connectedAddress] : undefined,
  });

  // Watch user's ETH balance
  const { data: ethBalance } = useWatchBalance({ address: connectedAddress });

  // Parse raffle info
  const parsedInfo = useMemo(() => {
    if (!raffleInfo) return null;
    return {
      prizeAmount: raffleInfo[0] as bigint,
      totalQuotas: raffleInfo[1] as bigint,
      soldQuotas: raffleInfo[2] as bigint,
      quotaPrice: raffleInfo[3] as bigint,
      winner: raffleInfo[4] as Address,
      isRaffleEnded: raffleInfo[5] as boolean,
      remainingQuotas: raffleInfo[6] as bigint,
      timeRemaining: raffleInfo[7] as bigint,
    };
  }, [raffleInfo]);

  // Show loading state
  if (isLoadingContract || isLoadingRaffleInfo) {
    return (
      <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center rounded-3xl">
        <span className="loading loading-spinner loading-lg"></span>
        <p className="text-lg mt-4">Loading raffle information...</p>
      </div>
    );
  }

  // Show error if contract not deployed
  if (!raffleContractInfo) {
    return (
      <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center rounded-3xl gap-4">
        <div className="alert alert-warning">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h3 className="font-bold">Raffle Contract Not Deployed</h3>
            <div className="text-sm">
              <p>Please deploy the Raffle contract first:</p>
              <code className="block mt-2 p-2 bg-base-200 rounded">
                cd packages/hardhat && yarn deploy:local
              </code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!parsedInfo) {
    return (
      <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center rounded-3xl">
        <p className="text-lg">Loading raffle information...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-start rounded-3xl gap-4 w-full max-w-4xl">
      <h2 className="text-3xl font-bold mb-4">🎰 Raffle</h2>

      {/* Raffle Information */}
      <div className="flex flex-col gap-2 w-full">
        <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
          <div className="stat">
            <div className="stat-title">Prize Amount</div>
            <div className="stat-value text-primary">
              {formatEther(parsedInfo.prizeAmount)} ETH
            </div>
          </div>
          <div className="stat">
            <div className="stat-title">Quotas Sold</div>
            <div className="stat-value text-secondary">
              {parsedInfo.soldQuotas.toString()} / {parsedInfo.totalQuotas.toString()}
            </div>
          </div>
          <div className="stat">
            <div className="stat-title">Price per Quota</div>
            <div className="stat-value">
              {formatEther(parsedInfo.quotaPrice)} ETH
            </div>
          </div>
        </div>

        {/* Time Remaining */}
        {!parsedInfo.isRaffleEnded && parsedInfo.timeRemaining > 0n && (
          <div className="alert alert-info">
            <span>
              Time Remaining: {Math.floor(Number(parsedInfo.timeRemaining) / 3600)} hours
            </span>
          </div>
        )}

        {/* Winner Display */}
        {parsedInfo.isRaffleEnded && parsedInfo.winner && (
          <div className="alert alert-success">
            <span className="font-bold">🎉 Winner Selected!</span>
            <AddressComponent address={parsedInfo.winner} />
          </div>
        )}

        {/* User's Quotas */}
        {connectedAddress && userQuotas && Number(userQuotas) > 0 && (
          <div className="alert">
            <span>Your Quotas: {userQuotas.toString()}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {!parsedInfo.isRaffleEnded && (
        <BuyQuotaSection
          quotaPrice={parsedInfo.quotaPrice}
          remainingQuotas={parsedInfo.remainingQuotas}
          onSuccess={() => refetchRaffleInfo()}
        />
      )}

      {/* Select Winner Button (when quotas sold out or time expired) */}
      {!parsedInfo.isRaffleEnded && parsedInfo.remainingQuotas === 0n && (
        <SelectWinnerSection onSuccess={() => refetchRaffleInfo()} />
      )}

      {/* Claim Prize Button (for winner) */}
      {parsedInfo.isRaffleEnded && 
       parsedInfo.winner && 
       connectedAddress && 
       parsedInfo.winner.toLowerCase() === connectedAddress.toLowerCase() && (
        <ClaimPrizeSection onSuccess={() => refetchRaffleInfo()} />
      )}
    </div>
  );
};

/**
 * BuyQuotaSection - Component for buying quotas with ETH
 */
const BuyQuotaSection = ({
  quotaPrice,
  remainingQuotas,
  onSuccess,
}: {
  quotaPrice: bigint;
  remainingQuotas: bigint;
  onSuccess: () => void;
}) => {
  const { address: connectedAddress } = useAccount();
  const [numQuotas, setNumQuotas] = useState<string>("1");
  const [isBuying, setIsBuying] = useState(false);

  const { writeContractAsync: writeRaffleAsync } = useScaffoldWriteContract({ contractName: "Raffle" });
  const { data: ethBalance } = useWatchBalance({ address: connectedAddress });

  const handleBuyQuota = async () => {
    if (!numQuotas || Number(numQuotas) <= 0) return;
    if (BigInt(numQuotas) > remainingQuotas) {
      alert(`Only ${remainingQuotas.toString()} quotas remaining!`);
      return;
    }

    const totalCost = quotaPrice * BigInt(numQuotas || "0");
    
    if (ethBalance && ethBalance.value < totalCost) {
      alert("Insufficient ETH balance!");
      return;
    }

    try {
      setIsBuying(true);
      await writeRaffleAsync({
        functionName: "buyQuota",
        args: [BigInt(numQuotas)],
        value: totalCost,
      });
      setIsBuying(false);
      setNumQuotas("1");
      onSuccess();
    } catch (error) {
      console.error("Error buying quota:", error);
      setIsBuying(false);
    }
  };

  if (!connectedAddress) {
    return (
      <div className="alert alert-warning w-full">
        <span>Please connect your wallet to buy quotas</span>
      </div>
    );
  }

  const totalCost = quotaPrice * BigInt(numQuotas || "0");
  const hasEnoughBalance = ethBalance ? ethBalance.value >= totalCost : false;

  return (
    <div className="flex flex-col gap-4 w-full">
      <h3 className="text-xl font-bold">Buy Quotas</h3>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <IntegerInput
            value={numQuotas}
            onChange={setNumQuotas}
            placeholder="Number of quotas"
            variant={IntegerVariant.UINT256}
            disableMultiplyBy1e18
          />
          <div className="text-sm">
            Total Cost: {formatEther(totalCost)} ETH
          </div>
        </div>
        {connectedAddress && ethBalance && (
          <div className="text-xs text-gray-500">
            Your ETH Balance: {formatEther(ethBalance.value)} ETH
          </div>
        )}
        {!hasEnoughBalance && connectedAddress && (
          <div className="alert alert-warning">
            <span>Insufficient ETH balance</span>
          </div>
        )}
        <button
          className={`btn btn-primary ${isBuying ? "btn-disabled" : ""} ${!hasEnoughBalance ? "btn-disabled" : ""}`}
          onClick={handleBuyQuota}
          disabled={isBuying || !hasEnoughBalance || BigInt(numQuotas || "0") === 0n}
        >
          {isBuying ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              Buying...
            </>
          ) : (
            "Buy Quotas"
          )}
        </button>
      </div>
    </div>
  );
};

/**
 * SelectWinnerSection - Component for selecting the winner
 */
const SelectWinnerSection = ({ onSuccess }: { onSuccess: () => void }) => {
  const { writeContractAsync, isPending } = useScaffoldWriteContract({ contractName: "Raffle" });

  const handleSelectWinner = async () => {
    try {
      await writeContractAsync({
        functionName: "selectWinner",
        args: [],
      });
      onSuccess();
    } catch (error) {
      console.error("Error selecting winner:", error);
    }
  };

  return (
    <button
      className={`btn btn-success w-full ${isPending ? "btn-disabled" : ""}`}
      onClick={handleSelectWinner}
      disabled={isPending}
    >
      {isPending ? (
        <>
          <span className="loading loading-spinner loading-xs"></span>
          Selecting Winner...
        </>
      ) : (
        "Select Winner"
      )}
    </button>
  );
};

/**
 * ClaimPrizeSection - Component for winner to claim their prize
 */
const ClaimPrizeSection = ({ onSuccess }: { onSuccess: () => void }) => {
  const { writeContractAsync, isPending } = useScaffoldWriteContract({ contractName: "Raffle" });

  const handleClaimPrize = async () => {
    try {
      await writeContractAsync({
        functionName: "claimPrize",
        args: [],
      });
      onSuccess();
    } catch (error) {
      console.error("Error claiming prize:", error);
    }
  };

  return (
    <button
      className={`btn btn-success w-full ${isPending ? "btn-disabled" : ""}`}
      onClick={handleClaimPrize}
      disabled={isPending}
    >
      {isPending ? (
        <>
          <span className="loading loading-spinner loading-xs"></span>
          Claiming...
        </>
      ) : (
        "Claim Prize"
      )}
    </button>
  );
};

