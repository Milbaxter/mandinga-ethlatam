# 🏗 COFHE Scaffold-ETH 2

Scaffold-ETH 2 (Now With CoFHE)

### CoFHE: https://cofhe-docs.fhenix.zone/docs/devdocs/overview

# CoFHE Scaffold-ETH 2 Documentation

## Overview

The CoFHE Scaffold-ETH 2 template adds support for Fully Homomorphic Encryption (FHE) operations to the standard Scaffold-ETH 2 template. This project demonstrates a **privacy-preserving Raffle system** that uses FHE encryption to keep participant data confidential while maintaining transparent winner selection and prize distribution.

### Raffle Contract Features

- **Privacy-First Design**: Participant count encrypted using FHE, ensuring participant privacy
- **Quota-Based System**: Users can purchase multiple quotas to increase their chances of winning
- **Automatic Winner Selection**: Winner is automatically selected when all quotas are sold
- **Time-Based Selection**: Manual selection available after 7 days if quotas aren't sold out
- **Secure Prize Distribution**: ETH prize claiming with reentrancy protection
- **Transparent Operations**: Winner selection and prize distribution remain verifiable on-chain

## QuickStart

To get up and testing, clone and open the repo, then:

1. Start up the local hardhat node (you will see the mocks getting deployed, explained below)

```bash
yarn chain
```

2. Deploy the Raffle contract

```bash
yarn deploy:local
```

3. Start the NextJS webapp

```bash
yarn start
```

4. Open the dApp at `http://localhost:3000` and explore the **Raffle** system:
   - Buy quotas with ETH
   - View raffle status and participant count (encrypted)
   - Select winner when conditions are met
   - Claim prize as the winner

## Integrated Tools

- Hardhat

  - `@fhenixprotocol/cofhe-contracts` - Package containing `FHE.sol`. `FHE.sol` is a library that exposes FHE arithmetic operations like `FHE.add` and `FHE.mul` along with access control functions.
  - `@cofhe/mock-contracts` - The CoFHE coprocessor exists off-chain. `@cofhe/mock-contracts` are a fully on-chain drop-in replacement for the off-chain components. These mocks allow better developer and testing experience when working with FHE. Is transparently used as a dependency of `@cofhe/hardhat-plugin`
  - `@cofhe/hardhat-plugin` - A hardhat plugin responsible for deploying the mock contracts on the hardhat network and during tests. Also exposes testing utility functions in `hre.cofhesdk.___`.
  - `@cofhe/sdk` - Primary connection to the CoFHE coprocessor. Exposes functions like `encryptInputs` (for sealing) and `decryptHandle` (for unsealing). Manages access permits. Automatically plays nicely with the mock environment.

- Nextjs
  - `@cofhe/sdk` - Primary connection to the CoFHE coprocessor. Exposes functions like `encryptInputs` (for sealing) and `decryptHandle` (for unsealing). Manages access permits. Automatically plays nicely with the mock environment.

## Working with FHE Smart Contracts

### Hardhat Setup

1. **[Hardhat Configuration](packages/hardhat/hardhat.config.ts)**:

   ```typescript
   import 'cofhe-hardhat-plugin'

   module.exports = {
   	solidity: '0.8.25',
   	evmVersion: 'cancun',
   	// ... other config
   }
   ```

2. **[TypeScript Configuration](packages/hardhat/tsconfig.json)**:

   ```json
   {
   	"compilerOptions": {
   		"target": "es2020",
   		"module": "Node16",
   		"moduleResolution": "Node16"
   	}
   }
   ```

3. **[Multicall3 Deployment](packages/hardhat/deploy/00_deploy_multicall.ts)**:
   The Multicall3 contract is deployed on the hardhat node to support the `useReadContracts` hook from viem. This allows efficient batch reading of contract data in the mock environment.

## Smart Contracts

### Raffle Contract

The [`Raffle.sol`](packages/hardhat/contracts/Raffle.sol) contract demonstrates a privacy-preserving raffle system using FHE encryption. Key features include:

- **Private Participant Tracking**: Participant count is stored in encrypted form using FHE
- **Quota-Based System**: Users can purchase multiple quotas to increase their chances
- **Automatic Winner Selection**: Winner is automatically selected when all quotas are sold
- **Time-Based Selection**: Winner can be manually selected after 7 days if quotas aren't sold out
- **Prize Distribution**: Winners can claim their ETH prize after selection

#### Key Features:

1. **Encrypted Participant Count**:
   ```solidity
   euint32 private encryptedParticipantCount;
   ```
   The total number of participants is kept private using FHE encryption, ensuring participant privacy.

2. **Quota Purchase System**:
   - Users can buy multiple quotas at a fixed price per quota
   - Each quota purchased increases the user's chances of winning
   - The participant list is stored privately on-chain

3. **Winner Selection**:
   - Automatically triggered when all quotas are sold
   - Can be manually triggered after 7 days if quotas aren't sold out
   - Uses pseudo-random number generation (can be upgraded to Chainlink VRF for production)

4. **Prize Claiming**:
   - Only the selected winner can claim the prize
   - Prize is distributed in ETH
   - Includes reentrancy protection

#### Example Usage:

```solidity
// Buy quotas
raffle.buyQuota(10, { value: quotaPrice * 10 });

// Check raffle status
(uint256 prize, uint256 total, uint256 sold, ...) = raffle.getRaffleInfo();

// Select winner manually (after 7 days or when all quotas sold)
raffle.selectWinner();

// Winner claims prize
raffle.claimPrize();
```

The Raffle contract demonstrates how FHE can be used to maintain privacy in applications where participant information should remain confidential while still allowing transparent winner selection and prize distribution.

### FHE Concepts Used in Raffle

The Raffle contract uses FHE encryption to keep participant data private. Key FHE concepts:

1. **Encrypted Types**:
   - `euint32`: Encrypted unsigned 32-bit integer
   - Used to store the participant count in encrypted form

2. **FHE Operations**:
   - `FHE.add(a, b)`: Add two encrypted values
   - `FHE.asEuint32(value)`: Convert plaintext to encrypted value
   - See `FHE.sol` for the full list of available operations

3. **Access Control**:
   - `FHE.allowThis(value)`: Allow the contract to read the value
   - `FHE.allowSender(value)`: Allow the transaction sender to read the value
   - `FHE.allowGlobal(value)`: Allow anyone to read the value
   - Access control must be explicitly set after each operation that modifies an encrypted value

### Testing the Raffle Contract

To test the Raffle contract with FHE encryption, you need to initialize the CoFHE SDK client:

```typescript
const [bob] = await hre.ethers.getSigners()

// Initialize FHE with a Hardhat signer
const client = await hre.cofhesdk.createBatteriesIncludedCofhesdkClient(bob);
```

To verify encrypted values in tests:

```typescript
// Get the encrypted participant count
const encryptedCount = await raffle.getEncryptedParticipantCount();

// Verify the encrypted value (only works in mock environment)
await hre.cofhesdk.mocks.expectPlaintext(encryptedCount, expectedValue);
```

To decrypt encrypted values:

```typescript
const encryptedCount = await raffle.getEncryptedParticipantCount();
const decryptedResult = await client.decryptHandle(encryptedCount, FheTypes.Uint32).decrypt();
```

## NextJS with FHE

### Initialization

The frontend initialization begins in [`ScaffoldEthAppWithProviders.tsx`](packages/nextjs/components/ScaffoldEthAppWithProviders.tsx) where the `useInitializeCofhe` hook is called:

```typescript
/**
* CoFHE Initialization
*
* The CoFHE SDK client is initialized in two steps.
* The client is constructed synchronously, with `supportedChains` provided at construction time.
* The useInitializeCofhe hook then makes sure the CoFHE SDK client is connected to the current wallet and is ready to function.
* It performs the following key functions:
* - Connects the CoFHE SDK client to the current provider and signer
* - Initializes the FHE keys
* - Configures the wallet client for encrypted operations
* - Handles initialization errors with user notifications
*
* This hook is essential for enabling FHE (Fully Homomorphic Encryption) operations
* throughout the application. It automatically refreshes when the connected wallet
* or chain changes to maintain proper configuration.
*/
useInitializeCofhe()
```

This hook handles the complete setup of the CoFHE system, including environment detection, wallet client configuration, and permit management initialization. It runs automatically when the wallet or chain changes, ensuring the FHE system stays properly configured.

### CoFHE Portal

The [`CofhePortal`](packages/nextjs/components/cofhe/CofhePortal.tsx) component provides a dropdown interface for managing CoFHE permits and viewing system status. It's integrated into the [`Header`](packages/nextjs/components/Header.tsx) component as a shield icon button:

```typescript
/**
 * CoFHE Portal Integration
 *
 * The CofhePortal component is integrated into the header to provide easy access to
 * CoFHE permit management functionality. It appears as a shield icon button that opens
 * a dropdown menu containing:
 * - System initialization status
 * - Active permit information
 * - Permit management controls
 *
 * This placement ensures the portal is always accessible while using the application,
 * allowing users to manage their permits and monitor system status from any page.
 */
<CofhePortal />
```

The portal displays:

- **Connection Status**: Shows whether CoFHE is connected, the connected account, and current network
- **Active Permit**: Displays details about the currently active permit including name, ID, issuer, and expiration
- **Permit Management**: Allows users to create new permits, switch between existing permits, and delete unused permits

### Frontend Components

#### Raffle Component

The [`RaffleComponent`](packages/nextjs/app/RaffleComponent.tsx) provides a complete UI for interacting with the Raffle contract:

**Features:**
- Display raffle information (prize amount, total quotas, sold quotas, etc.)
- Buy quotas with ETH
- View user's purchased quotas
- Select winner (when conditions are met)
- Claim prize (for winners)
- Real-time balance and quota tracking

**Key Interactions:**
- Uses `useScaffoldReadContract` to read raffle state
- Uses `useScaffoldWriteContract` for quota purchases and winner selection
- Displays encrypted participant count using FHE decryption
- Shows time remaining until manual selection is available

### Permit Modal

The [`CofhePermitModal`](packages/nextjs/components/cofhe/CofhePermitModal.tsx) allows users to generate cryptographic permits for accessing encrypted data. This modal automatically opens when a user attempts to decrypt a value in the `EncryptedValue` component without a valid permit:

```typescript
/**
 * CoFHE Permit Generation Modal
 *
 * This modal allows users to generate cryptographic permits for accessing encrypted data in the CoFHE system.
 * Permits are required because they provide a secure way to verify identity and control access to sensitive
 * encrypted data without revealing the underlying data itself.
 *
 * The modal provides the following options:
 * - Name: An optional identifier for the permit (max 24 chars)
 * - Expiration: How long the permit remains valid (1 day, 1 week (default), or 1 month)
 * - Recipient: (Currently unsupported) Option to share the permit with another address
 *
 * When generated, the permit requires a wallet signature (EIP712) to verify ownership.
 * This signature serves as proof that the user controls the wallet address associated with the permit.
 */
```

The modal opens in two scenarios:

1. When clicking "Generate Permit" in the CoFHE Portal
2. When attempting to decrypt an encrypted value without a valid permit

### Reference

#### EncryptedValue Component

The [`EncryptedValueCard`](packages/nextjs/components/scaffold-eth/EncryptedValueCard.tsx) provides components for displaying and interacting with encrypted values:

**EncryptedValue Component**:

- Displays encrypted values with appropriate UI states (encrypted, decrypting, decrypted, error)
- Handles permit validation and automatically opens the permit modal when needed
- Manages the decryption process using the `useDecryptValue` hook
- Shows different visual states based on the decryption status

**EncryptedZone Component**:

- Provides a visual wrapper with gradient borders to indicate encrypted content
- Includes a shield icon to clearly mark encrypted data areas

#### useCofhe Hooks

The [`useCofhe.ts`](packages/nextjs/app/useCofhe.ts) file provides comprehensive React hooks for FHE operations:

**Initialization Hooks**:

```typescript
// Hook to initialize cofhe with the connected wallet and chain configuration
// Handles initialization errors and displays toast notifications on success or error
// Refreshes when connected wallet or chain changes
useInitializeCofhe()

// Hook to check if cofhe is connected (provider, and signer)
// This is used to determine if the user is ready to use the FHE library
// FHE based interactions (encrypt / decrypt) should be disabled until this is true
useCofheConnected()

// Hook to get the current account connected to cofhe
useCofheAccount()
```

**Status Hooks**:

```typescript
// Hook to get the complete status of cofhe
// Returns Object containing chainId, account, and initialization status
// Refreshes when any of the underlying values change
useCofheStatus()

// Hook to check if the currently connected chain is supported by the application
// Returns boolean indicating if the current chain is in the target networks list
// Refreshes when chainId changes
useIsConnectedChainSupported()
```

**Permit Management Hooks**:

```typescript
// Hook to create a new permit
// Returns Async function to create a permit with optional options
// Refreshes when chainId, account, or initialization status changes
useCofheCreatePermit()

// Hook to remove a permit
// Returns Async function to remove a permit by its hash
// Refreshes when chainId, account, or initialization status changes
useCofheRemovePermit()

// Hook to select the active permit
// Returns Async function to set the active permit by its hash
// Refreshes when chainId, account, or initialization status changes
useCofheSetActivePermit()

// Hook to get the active permit object
// Returns The active permit object or null if not found/valid
// Refreshes when active permit hash changes
useCofheActivePermit()

// Hook to check if the active permit is valid
// Returns boolean indicating if the active permit is valid
// Refreshes when permit changes
useCofheIsActivePermitValid()

// Hook to get all permit objects for the current chain and account
// Returns Array of permit objects
// Refreshes when permit hashes change
useCofheAllPermits()
```

#### useDecrypt Hook

The [`useDecrypt.ts`](packages/nextjs/app/useDecrypt.ts) file provides utilities for handling encrypted value decryption:

```typescript
/**
 * Hook to decrypt a value using cofhe
 * @param fheType - The type of the value to decrypt
 * @param ctHash - The hash of the encrypted value
 * @returns Object containing a function to decrypt the value and the result of the decryption
 */
useDecryptValue(fheType, ctHash)
```

**DecryptionResult States**:

- `"no-data"`: No encrypted value provided
- `"encrypted"`: Value is encrypted and ready for decryption
- `"pending"`: Decryption is in progress
- `"success"`: Decryption completed successfully with the decrypted value
- `"error"`: Decryption failed with error message

The hook automatically handles:

- Initialization status checking
- Account validation
- Zero value handling (returns appropriate default values)
- Error handling and state management
- Automatic reset when the encrypted value changes

---

## Scaffold-ETH 2

<h4 align="center">
  <a href="https://docs.scaffoldeth.io">Documentation</a> |
  <a href="https://scaffoldeth.io">Website</a>
</h4>

🧪 An open-source, up-to-date toolkit for building decentralized applications (dapps) on the Ethereum blockchain. It's designed to make it easier for developers to create and deploy smart contracts and build user interfaces that interact with those contracts.

⚙️ Built using NextJS, RainbowKit, Hardhat, Wagmi, Viem, and Typescript.

- ✅ **Contract Hot Reload**: Your frontend auto-adapts to your smart contract as you edit it.
- 🪝 **[Custom hooks](https://docs.scaffoldeth.io/hooks/)**: Collection of React hooks wrapper around [wagmi](https://wagmi.sh/) to simplify interactions with smart contracts with typescript autocompletion.
- 🧱 [**Components**](https://docs.scaffoldeth.io/components/): Collection of common web3 components to quickly build your frontend.
- 🔥 **Burner Wallet & Local Faucet**: Quickly test your application with a burner wallet and local faucet.
- 🔐 **Integration with Wallet Providers**: Connect to different wallet providers and interact with the Ethereum network.

![Debug Contracts tab](https://github.com/scaffold-eth/scaffold-eth-2/assets/55535804/b237af0c-5027-4849-a5c1-2e31495cccb1)

## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v20.18.3)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## Project Structure

### Smart Contracts (`packages/hardhat/contracts/`)

- **Raffle.sol**: Privacy-preserving raffle system with encrypted participant tracking using FHE
- **MockUSDT.sol**: Mock USDT token for testing

### Frontend Components (`packages/nextjs/app/`)

- **RaffleComponent.tsx**: Complete UI for the Raffle system
- **useCofhe.ts**: React hooks for FHE operations
- **useDecrypt.ts**: Utilities for decrypting encrypted values

### Deployment Scripts (`packages/hardhat/deploy/`)

- **00_deploy_multicall3_only_HH.ts**: Deploys Multicall3 for local testing
- **02_deploy_raffle.ts**: Deploys the Raffle contract

## Development Workflow

1. **Start Local Blockchain**:
   ```bash
   yarn chain
   ```

2. **Deploy Contracts**:
   ```bash
   yarn deploy:local
   ```

3. **Start Frontend**:
   ```bash
   yarn start
   ```

4. **Run Tests**:
   ```bash
   yarn test
   ```

5. **Interact with Contracts**:
   - Visit `http://localhost:3000` to use the web interface
   - Visit `http://localhost:3000/debug` for the debug contracts page

## Customization

- Edit smart contracts in `packages/hardhat/contracts`
- Edit frontend components in `packages/nextjs/app`
- Edit deployment scripts in `packages/hardhat/deploy`
- Configure networks in `packages/nextjs/scaffold.config.ts`

## Documentation

Visit our [docs](https://docs.scaffoldeth.io) to learn how to start building with Scaffold-ETH 2.

To know more about its features, check out our [website](https://scaffoldeth.io).

## Contributing to Scaffold-ETH 2

We welcome contributions to Scaffold-ETH 2!

Please see [CONTRIBUTING.MD](https://github.com/scaffold-eth/scaffold-eth-2/blob/main/CONTRIBUTING.md) for more information and guidelines for contributing to Scaffold-ETH 2.
