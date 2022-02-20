import { ethers } from "ethers";
import { addresses } from "../constants";
import { abi as MistStaking } from "../abi/MistStaking.json";
import { abi as ierc20Abi } from "../abi/IERC20.json";
import { abi as sMist } from "../abi/sMist.json";
import { setAll, getTokenPrice, getMarketPrice } from "../helpers";
import apollo from "../lib/apolloClient.js";
import { createSlice, createSelector, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "src/store";
import { IBaseAsyncThunk } from "./interfaces";

const initialState = {
  loading: false,
  loadingMarketPrice: false,
};
const circulatingSupply = {
  inputs: [],
  name: "circulatingSupply",
  outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
  stateMutability: "view",
  type: "function",
};
export const loadAppDetails = createAsyncThunk(
  "app/loadAppDetails",
  async ({ networkID, provider }: IBaseAsyncThunk, { dispatch }) => {
    const protocolMetricsQuery = `
  query {
    _meta {
      block {
        number
      }
    }
    protocolMetrics(first: 1, orderBy: timestamp, orderDirection: desc) {
      timestamp
      mistyCirculatingSupply
      sMistCirculatingSupply
      totalSupply
      mistyPrice
      marketCap
      totalValueLocked
      treasuryMarketValue
      nextEpochRebase
      nextDistributedMist
    }
  }
  `;

    const stakingContract = new ethers.Contract(
      addresses[networkID].STAKING_ADDRESS as string,
      MistStaking,
      provider,
    );
    // NOTE (appleseed): marketPrice from Graph was delayed, so get CoinGecko price
    // let marketPrice;
    // try {
    //   const originalPromiseResult = await dispatch(
    //     loadMarketPrice({ networkID: networkID, provider: provider }),
    //   ).unwrap();
    //   marketPrice = originalPromiseResult?.marketPrice;
    // } catch (rejectedValueOrSerializedError) {
    //   // handle error here
    //   console.error("Returned a null response from dispatch(loadMarketPrice)");
    //   return;
    // }
    const marketPrice = ((await getMarketPrice({networkID, provider})) / Math.pow(10, 9));
    
    const sMistMainContract = new ethers.Contract(addresses[networkID].SMIST_ADDRESS as string, sMist, provider);
    const mistyContract = new ethers.Contract(addresses[networkID].MIST_ADDRESS as string, ierc20Abi, provider);
    const mistyBalance = await mistyContract.balanceOf(addresses[networkID].STAKING_ADDRESS);
    const stakingTVL = marketPrice * mistyBalance / 1000000000;
    const circ = await sMistMainContract.circulatingSupply();
    const circSupply = circ / 1000000000;
    const total = await mistyContract.totalSupply();
    const totalSupply = total / 1000000000;
    const marketCap = marketPrice * circSupply;
    if (!provider) {
      console.error("failed to connect to provider, please connect your wallet");
      return {
        stakingTVL,
        marketPrice,
        marketCap,
        circSupply,
        totalSupply,
      };
    }
    const currentTime = Math.floor(Date.now()/1000);

    // Calculating staking
    const epoch = await stakingContract.epoch();
    const stakingReward = epoch.distribute;
    const stakingRebase = stakingReward / circ;
    const fiveDayRate = Math.pow(1 + stakingRebase, 5 * 3) - 1;
    const stakingAPY = Math.pow(1 + stakingRebase, 365 * 3) - 1;
    const epochNumber = epoch.number;
    // Current index

    console.log('debug->',stakingReward, stakingRebase, stakingAPY)
    const currentIndex = await stakingContract.index();
    const endTime = epoch.endTime;
    
    return {
      currentIndex: ethers.utils.formatUnits(currentIndex, "gwei"),
      currentTime,
      fiveDayRate,
      stakingAPY,
      stakingTVL,
      stakingRebase,
      marketCap,
      marketPrice,
      circSupply,
      totalSupply,
      endTime,
      epochNumber
    } as IAppData;
  },
);

/**
 * checks if app.slice has marketPrice already
 * if yes then simply load that state
 * if no then fetches via `loadMarketPrice`
 *
 * `usage`:
 * ```
 * const originalPromiseResult = await dispatch(
 *    findOrLoadMarketPrice({ networkID: networkID, provider: provider }),
 *  ).unwrap();
 * originalPromiseResult?.whateverValue;
 * ```
 */
export const findOrLoadMarketPrice = createAsyncThunk(
  "app/findOrLoadMarketPrice",
  async ({ networkID, provider }: IBaseAsyncThunk, { dispatch, getState }) => {
    const state: any = getState();
    let marketPrice;
    // check if we already have loaded market price
    if (state.app.loadingMarketPrice === false && state.app.marketPrice) {
      // go get marketPrice from app.state
      marketPrice = state.app.marketPrice;
    } else {
      // we don't have marketPrice in app.state, so go get it
      try {
        const originalPromiseResult = await dispatch(
          loadMarketPrice({ networkID: networkID, provider: provider }),
        ).unwrap();
        marketPrice = originalPromiseResult?.marketPrice;
      } catch (rejectedValueOrSerializedError) {
        // handle error here
        console.error("Returned a null response from dispatch(loadMarketPrice)");
        return;
      }
    }
    return { marketPrice };
  },
);

/**
 * - fetches the misty price from CoinGecko (via getTokenPrice)
 * - falls back to fetch marketPrice from misty-dai contract
 * - updates the App.slice when it runs
 */
const loadMarketPrice = createAsyncThunk("app/loadMarketPrice", async ({ networkID, provider }: IBaseAsyncThunk) => {
  let marketPrice: number;
  try {
    marketPrice = await getMarketPrice({ networkID, provider });
    marketPrice = marketPrice / Math.pow(10, 9);
  } catch (e) {
    marketPrice = await getTokenPrice("mist");
  }
  return { marketPrice };
});

interface IAppData {
  readonly circSupply: number;
  readonly currentIndex?: string;
  readonly currentTime?: number;
  readonly fiveDayRate?: number;
  readonly marketCap: number;
  readonly marketPrice: number;
  readonly stakingAPY?: number;
  readonly stakingRebase?: number;
  readonly stakingTVL: number;
  readonly totalSupply: number;
  readonly treasuryBalance?: number;
  readonly endTime?: number;
}

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    fetchAppSuccess(state, action) {
      setAll(state, action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadAppDetails.pending, state => {
        state.loading = true;
      })
      .addCase(loadAppDetails.fulfilled, (state, action) => {
        setAll(state, action.payload);
        state.loading = false;
      })
      .addCase(loadAppDetails.rejected, (state, { error }) => {
        state.loading = false;
        console.error(error.name, error.message, error.stack);
      })
      .addCase(loadMarketPrice.pending, (state, action) => {
        state.loadingMarketPrice = true;
      })
      .addCase(loadMarketPrice.fulfilled, (state, action) => {
        setAll(state, action.payload);
        state.loadingMarketPrice = false;
      })
      .addCase(loadMarketPrice.rejected, (state, { error }) => {
        state.loadingMarketPrice = false;
        console.error(error.name, error.message, error.stack);
      });
  },
});

const baseInfo = (state: RootState) => state.app;

export default appSlice.reducer;

export const { fetchAppSuccess } = appSlice.actions;

export const getAppState = createSelector(baseInfo, app => app);
