import {
  ChainId,
  CHAIN_ID_ALGORAND,
  CHAIN_ID_APTOS,
  CHAIN_ID_INJECTIVE,
  CHAIN_ID_NEAR,
  CHAIN_ID_SOLANA,
  CHAIN_ID_XPLA,
  isEVMChain,
  isTerraChain
} from "@certusone/wormhole-sdk";
import { useConnectedWallet } from "@terra-money/wallet-provider";
import { useConnectedWallet as useXplaConnectedWallet } from "@xpla/wallet-provider";
import { useCallback, useMemo } from "react";
import { EVMWallet } from "wallet-aggregator-evm";
import { useWalletFromChain } from "wallet-aggregator-react";
import { useAptosContext } from "../contexts/AptosWalletContext";
import {
  useEthereumProvider
} from "../contexts/EthereumProviderContext";
import { useInjectiveContext } from "../contexts/InjectiveWalletContext";
import { useNearContext } from "../contexts/NearWalletContext";
import { useSolanaWallet } from "../contexts/SolanaWalletContext";
import { APTOS_NETWORK, CLUSTER, getEvmChainId } from "../utils/consts";

const createWalletStatus = (
  isReady: boolean,
  statusMessage: string = "",
  forceNetworkSwitch: () => void,
  walletAddress?: string
) => ({
  isReady,
  statusMessage,
  forceNetworkSwitch,
  walletAddress,
});

function useIsWalletReady(
  chainId: ChainId,
  enableNetworkAutoswitch: boolean = true
): {
  isReady: boolean;
  statusMessage: string;
  walletAddress?: string;
  forceNetworkSwitch: () => void;
} {
  const autoSwitch = enableNetworkAutoswitch;
  const solanaWallet = useSolanaWallet();
  const solPK = solanaWallet?.publicKey;
  const terraWallet = useConnectedWallet();
  const hasTerraWallet = !!terraWallet;
  const {
    provider,
    signerAddress,
    chainId: evmChainId,
    wallet: ethWallet
  } = useEthereumProvider();
  const hasEthInfo = !!provider && !!signerAddress;
  const correctEvmNetwork = getEvmChainId(chainId);
  const hasCorrectEvmNetwork = evmChainId === correctEvmNetwork;
  const wallet = useWalletFromChain(chainId);
  const algoPK = wallet?.getPublicKey();
  const xplaWallet = useXplaConnectedWallet();
  const hasXplaWallet = !!xplaWallet;
  const { address: aptosAddress, network: aptosNetwork } = useAptosContext();
  const hasAptosWallet = !!aptosAddress;
  // The wallets do not all match on network names and the adapter doesn't seem to normalize this yet.
  // Petra = "Testnet"
  // Martian = "Testnet"
  // Pontam = "Aptos testnet"
  // Nightly = undefined... error on NightlyWallet.ts
  const hasCorrectAptosNetwork = aptosNetwork?.toLowerCase()
    .includes(APTOS_NETWORK.toLowerCase());
  const { address: injAddress } = useInjectiveContext();
  const hasInjWallet = !!injAddress;
  const { accountId: nearPK } = useNearContext();

  const forceNetworkSwitch = useCallback(async () => {
    if (provider && correctEvmNetwork) {
      if (!isEVMChain(chainId)) {
        return;
      }

      if (!ethWallet) {
        return;
      }

      await (ethWallet as EVMWallet).switchChain(correctEvmNetwork);
    }
  }, [provider, correctEvmNetwork, ethWallet, chainId]);

  return useMemo(() => {
    if (isTerraChain(chainId) && hasTerraWallet && terraWallet?.walletAddress) {
      // TODO: terraWallet does not update on wallet changes
      return createWalletStatus(
        true,
        undefined,
        forceNetworkSwitch,
        terraWallet.walletAddress
      );
    }
    if (chainId === CHAIN_ID_SOLANA && solPK) {
      return createWalletStatus(
        true,
        undefined,
        forceNetworkSwitch,
        solPK.toString()
      );
    }
    if (chainId === CHAIN_ID_ALGORAND && algoPK) {
      return createWalletStatus(true, undefined, forceNetworkSwitch, algoPK);
    }
    if (
      chainId === CHAIN_ID_XPLA &&
      hasXplaWallet &&
      xplaWallet?.walletAddress
    ) {
      return createWalletStatus(
        true,
        undefined,
        forceNetworkSwitch,
        xplaWallet.walletAddress
      );
    }
    if (chainId === CHAIN_ID_APTOS && hasAptosWallet && aptosAddress) {
      if (hasCorrectAptosNetwork) {
        return createWalletStatus(
          true,
          undefined,
          forceNetworkSwitch,
          aptosAddress
        );
      } else {
        return createWalletStatus(
          false,
          `Wallet is not connected to ${APTOS_NETWORK}.`,
          forceNetworkSwitch,
          undefined
        );
      }
    }
    if (chainId === CHAIN_ID_INJECTIVE && hasInjWallet && injAddress) {
      return createWalletStatus(
        true,
        undefined,
        forceNetworkSwitch,
        injAddress
      );
    }
    if (chainId === CHAIN_ID_NEAR && nearPK) {
      return createWalletStatus(true, undefined, forceNetworkSwitch, nearPK);
    }
    if (isEVMChain(chainId) && hasEthInfo && signerAddress) {
      if (hasCorrectEvmNetwork) {
        return createWalletStatus(
          true,
          undefined,
          forceNetworkSwitch,
          signerAddress
        );
      } else {
        if (provider && correctEvmNetwork && autoSwitch) {
          forceNetworkSwitch();
        }
        return createWalletStatus(
          false,
          `Wallet is not connected to ${CLUSTER}. Expected Chain ID: ${correctEvmNetwork}`,
          forceNetworkSwitch,
          undefined
        );
      }
    }

    return createWalletStatus(
      false,
      "Wallet not connected",
      forceNetworkSwitch,
      undefined
    );
  }, [
    chainId,
    autoSwitch,
    forceNetworkSwitch,
    hasTerraWallet,
    solPK,
    hasEthInfo,
    correctEvmNetwork,
    hasCorrectEvmNetwork,
    provider,
    signerAddress,
    terraWallet,
    algoPK,
    xplaWallet,
    hasXplaWallet,
    hasAptosWallet,
    aptosAddress,
    hasCorrectAptosNetwork,
    hasInjWallet,
    injAddress,
    nearPK,
  ]);
}

export default useIsWalletReady;
