import { ethers, BigNumber } from "ethers";
import { addresses } from "../constants";
import { abi as ierc20Abi } from "../abi/IERC20.json";
import { abi as MistyStaking } from "../abi/MistStaking.json";
import { abi as StakingHelper } from "../abi/StakingHelper.json";
import { clearPendingTxn, fetchPendingTxns, getStakingTypeText } from "./PendingTxnsSlice";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchAccountSuccess, getBalances, loadAccountDetails } from "./AccountSlice";
import { error, info } from "../slices/MessagesSlice";
import { IActionValueAsyncThunk, IChangeApprovalAsyncThunk, IJsonRPCError } from "./interfaces";
import { segmentUA } from "../helpers/userAnalyticHelpers";

interface IUAData {
  address: string;
  value: string;
  approved: boolean;
  txHash: string | null;
  type: string | null;
}

function alreadyApprovedToken(token: string, stakeAllowance: BigNumber, unstakeAllowance: BigNumber) {
  // set defaults
  let bigZero = BigNumber.from("0");
  let applicableAllowance = bigZero;

  // determine which allowance to check
  if (token === "mist") {
    applicableAllowance = stakeAllowance;
  } else if (token === "smisty") {
    applicableAllowance = unstakeAllowance;
  }

  // check if allowance exists
  if (applicableAllowance.gt(bigZero)) return true;

  return false;
}

export const changeApproval = createAsyncThunk(
  "stake/changeApproval",
  async ({ token, provider, address, networkID }: IChangeApprovalAsyncThunk, { dispatch }) => {
    if (!provider) {
      dispatch(error("Please connect your wallet!"));
      return;
    }

    const signer = provider.getSigner();
    const mistyContract = new ethers.Contract(addresses[networkID].MIST_ADDRESS as string, ierc20Abi, signer);
    const smistyContract = new ethers.Contract(addresses[networkID].SMIST_ADDRESS as string, ierc20Abi, signer);
    let approveTx;
    let stakeAllowance = await mistyContract.allowance(address, addresses[networkID].STAKING_HELPER_ADDRESS);
    let unstakeAllowance = await smistyContract.allowance(address, addresses[networkID].STAKING_ADDRESS);

    // return early if approval has already happened
    if (alreadyApprovedToken(token, stakeAllowance, unstakeAllowance)) {
      dispatch(info("Approval completed."));
      return dispatch(
        fetchAccountSuccess({
          staking: {
            mistyStake: +stakeAllowance,
            mistyUnstake: +unstakeAllowance,
          },
        }),
      );
    }

    console.log("debug unstake approve action")
    try {
      if (token === "mist") {
        // won't run if stakeAllowance > 0
        approveTx = await mistyContract.approve(
          addresses[networkID].STAKING_HELPER_ADDRESS,
          ethers.utils.parseUnits("1000000000", "gwei").toString(),
        );
      } else if (token === "smist") {
        approveTx = await smistyContract.approve(
          addresses[networkID].STAKING_ADDRESS,
          ethers.utils.parseUnits("1000000000", "gwei").toString(),
        );
      }

      const text = "Approve " + (token === "mist" ? "Staking" : "Unstaking");
      const pendingTxnType = token === "mist" ? "approve_staking" : "approve_unstaking";
      dispatch(fetchPendingTxns({ txnHash: approveTx.hash, text, type: pendingTxnType }));

      await approveTx.wait();
    } catch (e: unknown) {
      dispatch(error((e as IJsonRPCError).message));
      return;
    } finally {
      if (approveTx) {
        dispatch(clearPendingTxn(approveTx.hash));
      }
    }

    // go get fresh allowances
    stakeAllowance = await mistyContract.allowance(address, addresses[networkID].STAKING_HELPER_ADDRESS);
    unstakeAllowance = await smistyContract.allowance(address, addresses[networkID].STAKING_ADDRESS);

    return dispatch(
      fetchAccountSuccess({
        staking: {
          mistyStake: +stakeAllowance,
          mistyUnstake: +unstakeAllowance,
        },
      }),
    );
  },
);

export const changeStake = createAsyncThunk(
  "stake/changeStake",
  async ({ action, value, provider, address, networkID, callback }: IActionValueAsyncThunk, { dispatch }) => {
    if (!provider) {
      dispatch(error("Please connect your wallet!"));
      return;
    }

    console.log("debug unstake action")
    const signer = provider.getSigner();
    let staking, stakingHelper;
    staking = new ethers.Contract(addresses[networkID].STAKING_ADDRESS as string, MistyStaking, signer);
    stakingHelper = new ethers.Contract(addresses[networkID].STAKING_HELPER_ADDRESS as string, StakingHelper, signer);

    let stakeTx;
    let uaData: IUAData = {
      address: address,
      value: value,
      approved: true,
      txHash: null,
      type: null,
    };

    try {
      if (action === "stake") {
        uaData.type = "stake";
        stakeTx = await stakingHelper.stake(ethers.utils.parseUnits(value, "gwei"), address);
      } else {
        uaData.type = "unstake";
        stakeTx = await staking.unstake(ethers.utils.parseUnits(value, "gwei"), true);
      }
      const pendingTxnType = action === "stake" ? "staking" : "unstaking";
      uaData.txHash = stakeTx.hash;
      dispatch(fetchPendingTxns({ txnHash: stakeTx.hash, text: getStakingTypeText(action), type: pendingTxnType }));
      callback?.();
      await stakeTx.wait();
      await new Promise<void>((resolve, reject) => {
        setTimeout(async () => {
          try {
            await dispatch(loadAccountDetails({ networkID, address, provider }));
            resolve();
          } catch (error) {
            reject(error);
          }
        }, 5000);
      });
    } catch (e: unknown) {
      uaData.approved = false;
      const rpcError = e as IJsonRPCError;
      if (rpcError.code === -32603 && rpcError.message.indexOf("ds-math-sub-underflow") >= 0) {
        dispatch(
          error("You may be trying to stake more than your balance! Error code: 32603. Message: ds-math-sub-underflow"),
        );
      } else {
        dispatch(error(rpcError.message));
      }
      return;
    } finally {
      if (stakeTx) {
        // segmentUA(uaData);

        dispatch(clearPendingTxn(stakeTx.hash));
      }
    }
  },
);

export const changeForfeit = createAsyncThunk(
  "stake/forfeit",
  async ({ provider, address, networkID }: IActionValueAsyncThunk, { dispatch }) => {
    if (!provider) {
      dispatch(error("Please connect your wallet!"));
      return;
    }

    const signer = provider.getSigner();
    const staking = new ethers.Contract(addresses[networkID].STAKING_ADDRESS as string, MistyStaking, signer);
    let forfeitTx;

    try {
      forfeitTx = await staking.forfeit();
      const text = "Forfeiting";
      const pendingTxnType = "forfeiting";
      dispatch(fetchPendingTxns({ txnHash: forfeitTx.hash, text, type: pendingTxnType }));
      await forfeitTx.wait();
      // dispatch(
      //   fetchAccountSuccess({
      //     staking: {
      //       mistyStake: +stakeAllowance,
      //       mistyUnstake: +unstakeAllowance,
      //     },
      //   })
      //   // success(messages.tx_successfully_send)
      //   );
    } catch (e: any) {
      // return metamaskErrorWrap(e, dispatch);
      return false;
    } finally {
      if (forfeitTx) {
        dispatch(clearPendingTxn(forfeitTx.hash));
      }
    }
    // await sleep(7);
    // dispatch(info(messages.balance_update_soon));
    // await sleep(15);
    // await dispatch(loadAccountDetails({ address, networkID, provider }));
    // dispatch(info(messages.balance_updated));
    return;
  },
);

export const changeClaim = createAsyncThunk(
  "stake/changeClaim",
  async ({ provider, address, networkID }: IActionValueAsyncThunk, { dispatch }) => {
    if (!provider) {
      dispatch(error("Please connect your wallet!"));
      return;
    }

    const signer = provider.getSigner();
    const staking = new ethers.Contract(addresses[networkID].STAKING_ADDRESS as string, MistyStaking, signer);
    let claimTx;

    try {
      claimTx = await staking.claim(address);
      const text = "Claiming";
      const pendingTxnType = "claiming";
      dispatch(fetchPendingTxns({ txnHash: claimTx.hash, text, type: pendingTxnType }));
      await claimTx.wait();
      // dispatch(success(messages.tx_successfully_send));
    } catch (e: any) {
      // return metamaskErrorWrap(e, dispatch);
      return false;
    } finally {
      if (claimTx) {
        dispatch(clearPendingTxn(claimTx.hash));
      }
    }
    // await sleep(7);
    // dispatch(info(messages.balance_update_soon));
    // await sleep(7);
    // await dispatch(loadAccountDetails({ address, networkID, provider }));
    // dispatch(info(messages.balance_updated));
    // return;
  },
);
