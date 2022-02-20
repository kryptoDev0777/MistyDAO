import { useState, useEffect } from "react";
import { addresses, TOKEN_DECIMALS } from "../../constants";
import { Link, SvgIcon, Popper, Button, Paper, Typography, Divider, Box, Fade, Slide } from "@material-ui/core";
import { ReactComponent as InfoIcon } from "../../assets/icons/info-fill.svg";
import { ReactComponent as ArrowUpIcon } from "../../assets/icons/arrow-up.svg";
import "./mistymenu.scss";
import { usdt } from "src/helpers/AllBonds";
import { useWeb3Context } from "../../hooks/web3Context";

import MistyImg from "src/assets/tokens/mistylogo.png";
import SMistyImg from "src/assets/tokens/mistylogo.png";

const addTokenToWallet = (tokenSymbol, tokenAddress) => async () => {
  if (window.ethereum) {
    const host = window.location.origin;
    // NOTE (appleseed): 33T token defaults to sGLA logo since we don't have a 33T logo yet
    let tokenPath;
    // if (tokenSymbol === "GLA") {

    // } ? MistyImg : SMistyImg;
    switch (tokenSymbol) {
      case "MIST":
        tokenPath = MistyImg;
        break;
      default:
        tokenPath = SMistyImg;
    }
    const imageURL = `${host}/${tokenPath}`;

    try {
      await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: TOKEN_DECIMALS,
            image: imageURL,
          },
        },
      });
    } catch (error) {
      console.log(error);
    }
  }
};

function MistyMenu() {
  const [anchorEl, setAnchorEl] = useState(null);
  const isEthereumAPIAvailable = window.ethereum;
  const { chainID } = useWeb3Context();

  const networkID = chainID;

  const SMIST_ADDRESS = addresses[networkID].SMIST_ADDRESS;
  const MIST_ADDRESS = addresses[networkID].MIST_ADDRESS;
  const USDC_ADDRESS = addresses[networkID].USDC_ADDRESS;

  const handleClick = event => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const open = Boolean(anchorEl);
  const id = "mist-popper";
  const usdtAddress = usdt.getAddressForReserve(networkID);
  return (
    <Box
      component="div"
      onMouseEnter={e => handleClick(e)}
      onMouseLeave={e => handleClick(e)}
      id="mist-menu-button-hover"
    >
      <Button id="mist-menu-button" size="large" variant="contained" color="secondary" title="MIST" aria-describedby={id}>
        <SvgIcon component={InfoIcon} color="primary" />
        <Typography>MIST</Typography>
      </Button>

      <Popper id={id} open={open} anchorEl={anchorEl} placement="bottom-start" transition>
        {({ TransitionProps }) => {
          return (
            <Fade {...TransitionProps} timeout={100}>
              <Paper className="mist-menu" elevation={1}>
                <Box component="div" className="buy-tokens">
                  <Link
                    href={`https://pancakeswap.finance/swap?inputCurrency=&outputCurrency=${MIST_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="large" variant="contained" color="secondary" fullWidth>
                      <Typography align="left">
                        Buy on PancakeSwap <SvgIcon component={ArrowUpIcon} htmlColor="#A3A3A3" />
                      </Typography>
                    </Button>
                  </Link>

                  {/* <Link
                    href={`https://apeswap.finance/#/add/${USDC_ADDRESS}/${MIST_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="large" variant="contained" color="secondary" fullWidth>
                      <Typography align="left">
                        Buy on Apeswap <SvgIcon component={ArrowUpIcon} htmlColor="#A3A3A3" />
                      </Typography>
                    </Button>
                  </Link> */}
                </Box>

                {isEthereumAPIAvailable ? (
                  <Box className="add-tokens">
                    <Divider color="secondary" />
                    <p>ADD TOKEN TO WALLET</p>
                    <Box display="flex" flexDirection="row" justifyContent="space-between">
                      <Button variant="contained" color="secondary" onClick={addTokenToWallet("MIST", MIST_ADDRESS)}>
                        {/* <SvgIcon
                          component={mistTokenImg}
                          viewBox="0 0 32 32"
                          style={{ height: "25px", width: "25px" }}
                        /> */}
                        <Typography variant="body1">MIST</Typography>
                      </Button>
                      <Button variant="contained" color="secondary" onClick={addTokenToWallet("sMIST", SMIST_ADDRESS)}>
                        {/* <SvgIcon
                          component={smistTokenImg}
                          viewBox="0 0 100 100"
                          style={{ height: "25px", width: "25px" }}
                        /> */}
                        <Typography variant="body1">sMIST</Typography>
                      </Button>
                    </Box>
                  </Box>
                ) : null}
              </Paper>
            </Fade>
          );
        }}
      </Popper>
    </Box>
  );
}

export default MistyMenu;
