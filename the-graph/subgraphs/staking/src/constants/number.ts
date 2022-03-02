import { BigInt } from "@graphprotocol/graph-ts"

const MAX_UINT256_VALUE = BigInt.fromString('57896044618658097711785492504343953926634992332820282019728792003956564819968') // 2^256 / 2
export const DEFAULT_REWARD_PER_LIQUIDITY = MAX_UINT256_VALUE.div(BigInt.fromU32(2 as u8))