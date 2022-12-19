import { ChainId } from "@certusone/wormhole-sdk";
import {
  Dialog,
  DialogTitle,
  IconButton,
  List,
  ListItem, ListItemText,
  makeStyles
} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import { useCallback } from "react";
import { Wallet } from "wormhole-wallet-aggregator";
import { useWalletsForChain } from "wormhole-wallet-aggregator-react";

const useStyles = makeStyles((theme) => ({
  flexTitle: {
    display: "flex",
    alignItems: "center",
    "& > div": {
      flexGrow: 1,
      marginRight: theme.spacing(4),
    },
    "& > button": {
      marginRight: theme.spacing(-1),
    },
  },
  icon: {
    height: 24,
    width: 24,
  },
}));

const WalletOptions = ({
  wallet,
  onSelect,
  onClose,
}: {
  wallet: Wallet;
  onSelect: (w: Wallet) => Promise<void>;
  onClose: () => void;
}) => {
  const handleClick = useCallback(() => {
    onSelect(wallet).then(onClose);
  }, [wallet, onClose]);

  return (
    <ListItem button onClick={handleClick}>
      {/* <ListItemIcon>
        <img
          src={connection.icon}
          alt={connection.name}
          className={classes.icon}
        />
      </ListItemIcon> */}
      <ListItemText>{wallet.getName()}</ListItemText>
    </ListItem>
  );
};

const ConnectWalletDialog = ({
  isOpen,
  onSelect,
  onClose,
  chainId,
}: {
  isOpen: boolean;
  onSelect: (w: Wallet) => Promise<void>;
  onClose: () => void;
  chainId: ChainId;
}) => {
  const availableWallets = useWalletsForChain(chainId);

  const classes = useStyles();

  const options = availableWallets
    .map((wallet) => (
      <WalletOptions
        wallet={wallet}
        onSelect={onSelect}
        onClose={onClose}
        key={wallet.getName()}
      />
    ));

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>
        <div className={classes.flexTitle}>
          <div>Select your wallet</div>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>
      </DialogTitle>
      <List>{options}</List>
    </Dialog>
  );
};

export default ConnectWalletDialog;
