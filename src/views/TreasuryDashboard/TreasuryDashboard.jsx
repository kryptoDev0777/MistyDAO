import { useEffect, useState } from "react";
import { Paper, Grid, Typography, Box, Zoom, Container, useMediaQuery } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { useSelector } from "react-redux";
import Chart from "../../components/Chart/Chart.jsx";
import { trim, formatCurrency } from "../../helpers";
import {
  treasuryDataQuery,
  rebasesV1DataQuery,
  rebasesV2DataQuery,
  bulletpoints,
  tooltipItems,
  tooltipInfoMessages,
  itemType,
} from "./treasuryData.js";
import { useTheme } from "@material-ui/core/styles";
import "./treasury-dashboard.scss";
import apollo from "../../lib/apolloClient";
import InfoTooltip from "src/components/InfoTooltip/InfoTooltip.jsx";
import { allBondsMap } from "src/helpers/AllBonds";

function TreasuryDashboard() {
  const [data, setData] = useState(null);
  const [apy, setApy] = useState([]);
  const [runway, setRunway] = useState(null);
  const [staked, setStaked] = useState(null);
  const theme = useTheme();
  const smallerScreen = useMediaQuery("(max-width: 650px)");
  const verySmallScreen = useMediaQuery("(max-width: 379px)");

  const marketPrice = useSelector(state => {
    return state.app.marketPrice;
  });
  const circSupply = useSelector(state => {
    return state.app.circSupply;
  });
  const totalSupply = useSelector(state => {
    return state.app.totalSupply;
  });
  const marketCap = useSelector(state => {
    return state.app.marketCap;
  });
  const currentIndex = useSelector(state => {
    return state.app.currentIndex;
  });
  const rebase = useSelector(state => {
    return state.app.stakingRebase;
  });
  const backingPermist = useSelector(state => {
    if (state.bonding.loading === false) {
      let tokenBalances = 0;
      for (const bond in allBondsMap) {
        if (state.bonding[bond]) {
          tokenBalances += state.bonding[bond].purchased;
        }
      }
      return tokenBalances / state.app.circSupply;
    }
  });

  const wsmistPrice = useSelector(state => {
    return state.app.marketPrice * state.app.currentIndex;
  });

  return (
    <div id="treasury-dashboard-view" className={`${smallerScreen && "smaller"} ${verySmallScreen && "very-small"}`}>
      <Container
        style={{
          paddingLeft: smallerScreen || verySmallScreen ? "0" : "3.3rem",
          paddingRight: smallerScreen || verySmallScreen ? "0" : "3.3rem",
        }}
      >
        <Box className={`hero-metrics`}>
          <Paper className="mist-card">
            <Box display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center">
              <Box className="metric market">
                <Typography variant="h6" color="textSecondary">
                  Market Cap
                </Typography>
                <Typography variant="h5">
                  {marketCap && formatCurrency(marketCap, 0)}
                  {/* {!marketCap && <Skeleton type="text" />} */}
                </Typography>
              </Box>

              <Box className="metric price">
                <Typography variant="h6" color="textSecondary">
                  MIST Price
                </Typography>
                <Typography variant="h5">
                  {/* appleseed-fix */}
                  {marketPrice ? formatCurrency(marketPrice, 2) : <Skeleton type="text" />}
                </Typography>
              </Box>

              {/* <Box className="metric wsoprice">
                <Typography variant="h6" color="textSecondary">
                  wsMIST Price
                  <InfoTooltip
                    message={
                      "wsMIST = sMIST * index\n\nThe price of wsMIST is equal to the price of MIST multiplied by the current index"
                    }
                  />
                </Typography>

                <Typography variant="h5">
                  {wsmistPrice ? formatCurrency(wsmistPrice, 2) : <Skeleton type="text" />}
                </Typography>
              </Box> */}

              <Box className="metric circ" >
                <Typography variant="h6" color="textSecondary">
                  Circulating Supply (total)
                </Typography>
                <Typography variant="h5">
                {/* <>{new Intl.NumberFormat("en-US").format(trimmedStakingAPY)}%</> */}
                  {circSupply && totalSupply ? (
                    parseInt(circSupply) + " / " + new Intl.NumberFormat("en-US").format(totalSupply)
                  ) : (
                    <Skeleton type="text" />
                  )}
                </Typography>
              </Box>

              <Box className="metric bpo" style={{width:"45%"}}>
                <Typography variant="h6" color="textSecondary">
                  Backing per MIST
                </Typography>
                <Typography variant="h5">
                  {backingPermist ? formatCurrency(backingPermist, 2) : <Skeleton type="text" />}
                </Typography>
              </Box>

              <Box className="metric index" style={{width:"45%"}}>
                <Typography variant="h6" color="textSecondary">
                  Current Index
                  <InfoTooltip
                    message={
                      "The current index tracks the amount of sMIST accumulated since the beginning of staking. Basically, how much sMIST one would have if they staked and held a single MIST from day 1."
                    }
                  />
                </Typography>
                <Typography variant="h5">
                  {currentIndex ? trim(currentIndex, 2) + " sMIST" : <Skeleton type="text" />}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </div>
  );
}

export default TreasuryDashboard;
