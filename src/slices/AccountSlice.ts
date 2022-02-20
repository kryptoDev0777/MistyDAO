import { ethers } from "ethers";
import { addresses } from "../constants";
import { abi as ierc20Abi } from "../abi/IERC20.json";
import { abi as sMIST } from "../abi/sMist.json";
import { abi as MistStaking } from "../abi/MistStaking.json";
import { setAll } from "../helpers";

import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import { RootState } from "src/store";
import { IBaseAddressAsyncThunk, ICalcUserBondDetailsAsyncThunk } from "./interfaces";

export const getBalances = createAsyncThunk(
  "account/getBalances",
  async ({ address, networkID, provider }: IBaseAddressAsyncThunk) => {
    const mistContract = new ethers.Contract(addresses[networkID].MIST_ADDRESS as string, ierc20Abi, provider);
    const mistBalance = await mistContract.balanceOf(address);
    const sMistContract = new ethers.Contract(addresses[networkID].SMIST_ADDRESS as string, ierc20Abi, provider);
    const smistBalance = await sMistContract.balanceOf(address);

    return {
      balances: {
        mist: ethers.utils.formatUnits(mistBalance, "gwei"),
        smist: ethers.utils.formatUnits(smistBalance, "gwei"),
      },
    };
  },
);

export const loadAccountDetails = createAsyncThunk(
  "account/loadAccountDetails",
  async ({ networkID, provider, address }: IBaseAddressAsyncThunk) => {
    let mistBalance = 0;
    let smistBalance = 0;
    let stakeAllowance = 0;
    let unstakeAllowance = 0;
    let daiBondAllowance = 0;
    let expiry = 0;
    let depositAmount = 0;

    const daiContract = new ethers.Contract(addresses[networkID].DAI_ADDRESS as string, ierc20Abi, provider);
    const usdtBalance = await daiContract.balanceOf(address);

    const mistContract = new ethers.Contract(addresses[networkID].MIST_ADDRESS as string, ierc20Abi, provider);
    mistBalance = await mistContract.balanceOf(address);
    stakeAllowance = await mistContract.allowance(address, addresses[networkID].STAKING_HELPER_ADDRESS);

    const sMistContract = new ethers.Contract(addresses[networkID].SMIST_ADDRESS as string, sMIST, provider);
    smistBalance = await sMistContract.balanceOf(address);
    unstakeAllowance = await sMistContract.allowance(address, addresses[networkID].STAKING_ADDRESS);

    const stakingContract = new ethers.Contract(addresses[networkID].STAKING_ADDRESS as string, MistStaking, provider);
    depositAmount = (await stakingContract.warmupInfo(address)).deposit;
    expiry = (await stakingContract.warmupInfo(address)).expiry;

    return {
      balances: {
        usdt: ethers.utils.formatEther(usdtBalance),
        mist: ethers.utils.formatUnits(mistBalance, "gwei"),
        smist: ethers.utils.formatUnits(smistBalance, "gwei"),
      },
      staking: {
        mistStake: +stakeAllowance,
        mistUnstake: +unstakeAllowance,
      },
      warmup: {
        warmupAmount: ethers.utils.formatUnits(depositAmount, "gwei"),
        expiryBlock: expiry,
      },
      bonding: {
        daiAllowance: daiBondAllowance,
      },
    };
  },
);

export interface IUserBondDetails {
  allowance: number;
  interestDue: number;
  bondMaturationBlock: number;
  pendingPayout: string; //Payout formatted in gwei.
}
export const calculateUserBondDetails = createAsyncThunk(
  "account/calculateUserBondDetails",
  async ({ address, bond, networkID, provider }: ICalcUserBondDetailsAsyncThunk) => {
    if (!address) {
      return {
        bond: "",
        displayName: "",
        bondIconSvg: "",
        isLP: false,
        isFour: false,
        allowance: 0,
        balance: "0",
        interestDue: 0,
        bondMaturationBlock: 0,
        pendingPayout: "",
      };
    }
    // dispatch(fetchBondInProgress());

    // Calculate bond details.
    const bondContract = bond.getContractForBond(networkID, provider);
    const reserveContract = bond.getContractForReserve(networkID, provider);

    let interestDue, pendingPayout, bondMaturationBlock;

    const bondDetails = await bondContract.bondInfo(address);
    interestDue = bondDetails.payout / Math.pow(10, 9);
    bondMaturationBlock = +bondDetails.vesting + +bondDetails.lastTime;
    pendingPayout = await bondContract.pendingPayoutFor(address);

    let allowance,
      balance = 0;
    allowance = await reserveContract.allowance(address, bond.getAddressForBond(networkID));
    balance = await reserveContract.balanceOf(address);
    // formatEthers takes BigNumber => String
    // let balanceVal = ethers.utils.formatEther(balance);
    // balanceVal should NOT be converted to a number. it loses decimal precision
    let deciamls = 18;
    let balanceVal;
    if (bond.decimals) {
      deciamls = bond.decimals;
      balanceVal = ethers.utils.formatUnits(balance, "mwei");
    }
    if (bond.isLP) {
      deciamls = 18;
    }
    balanceVal = ethers.utils.formatEther(balance);
    return {
      bond: bond.name,
      displayName: bond.displayName,
      bondIconSvg: bond.bondIconSvg,
      isLP: bond.isLP,
      isFour: bond.isFour,
      allowance: Number(allowance),
      balance: balanceVal.toString(),
      interestDue,
      bondMaturationBlock,
      pendingPayout: ethers.utils.formatUnits(pendingPayout, "gwei"),
    };
  },
);

interface IAccountSlice {
  bonds: { [key: string]: IUserBondDetails };
  balances: {
    mist: string;
    smist: string;
    dai: string;
  };
  loading: boolean;
}
const initialState: IAccountSlice = {
  loading: false,
  bonds: {},
  balances: { mist: "", smist: "", dai: "" },
};

const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    fetchAccountSuccess(state, action) {
      setAll(state, action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadAccountDetails.pending, state => {
        state.loading = true;
      })
      .addCase(loadAccountDetails.fulfilled, (state, action) => {
        setAll(state, action.payload);
        state.loading = false;
      })
      .addCase(loadAccountDetails.rejected, (state, { error }) => {
        state.loading = false;
        console.log(error);
      })
      .addCase(getBalances.pending, state => {
        state.loading = true;
      })
      .addCase(getBalances.fulfilled, (state, action) => {
        setAll(state, action.payload);
        state.loading = false;
      })
      .addCase(getBalances.rejected, (state, { error }) => {
        state.loading = false;
        console.log(error);
      })
      .addCase(calculateUserBondDetails.pending, state => {
        state.loading = true;
      })
      .addCase(calculateUserBondDetails.fulfilled, (state, action) => {
        if (!action.payload) return;
        const bond = action.payload.bond;
        state.bonds[bond] = action.payload;
        state.loading = false;
      })
      .addCase(calculateUserBondDetails.rejected, (state, { error }) => {
        state.loading = false;
        console.log(error);
      });
  },
});

export default accountSlice.reducer;

export const { fetchAccountSuccess } = accountSlice.actions;

const baseInfo = (state: RootState) => state.account;

export const getAccountState = createSelector(baseInfo, account => account);
