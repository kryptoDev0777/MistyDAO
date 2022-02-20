export const THE_GRAPH_URL = "https://api.thegraph.com/subgraphs/name/wkich/misty-subgraph";
export const EPOCH_INTERVAL = 9600;

// NOTE could get this from an outside source since it changes slightly over time
export const BLOCK_RATE_SECONDS = 1;

export const TOKEN_DECIMALS = 9;

interface IAddresses {
  [key: number]: { [key: string]: string };
}

export const addresses: IAddresses = {
  
  56: {
    DAI_ADDRESS: "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3", 
    MIST_ADDRESS: "0x54Cea670B34667822152348C289Fd31b4A6CD9bc",
    STAKING_ADDRESS: "0x8fdFA17c400Fa220Ee9Df50d865682797d6893c4", // The new staking contract
    STAKING_HELPER_ADDRESS: "0xf3D09F25E3a5a52D47c009624261975f7Ff1aD81", // Helper contract used for Staking only
    SMIST_ADDRESS: "0x99cA57d7368129149067fb997f9ABc6ca2AaDfc0",
    STAKING_WARMUP: "0xabb83eA37A792567F40009dfe848b03b4F2aA55A",
    DISTRIBUTOR_ADDRESS: "0xfc4987bA4706410FB0BC28e1E68AAa133368a4D1",
    BONDINGCALC_ADDRESS: "0xD9EeC2026619113E4db68eF948cF2c546713580D",
    TREASURY_ADDRESS: "0x67502bC673c3e4A36F9fe64B2DC54563Bb5cd5f7",
    REDEEM_HELPER_ADDRESS: "0xa478E08257bB893911148682253E28aa19A54e4C",
    
  },
};

// MIST: 0x54Cea670B34667822152348C289Fd31b4A6CD9bc 
// SMIST: 0x99cA57d7368129149067fb997f9ABc6ca2AaDfc0
// Staking: 0x8fdFA17c400Fa220Ee9Df50d865682797d6893c4
// Staking Helper: 0xf3D09F25E3a5a52D47c009624261975f7Ff1aD81
// Staking Warmup: 0xd58acf43FF5268F3e5a3298f93a60D7B6788E6F1
// Calculator: 0xD9EeC2026619113E4db68eF948cF2c546713580D
// Treasury: 0x67502bC673c3e4A36F9fe64B2DC54563Bb5cd5f7
// DAO: 0x5198F82ba78756a462be2998d05fcd2eD4ce9C76
// 
// 
// 
// 
// 
// 
// 
// 
