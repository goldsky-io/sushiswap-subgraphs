import { BigInt, ethereum } from '@graphprotocol/graph-ts'
import { ZERO_ADDRESS, BIG_INT_ZERO } from '../constants'
import { Pool, NativeRewarderPool } from '../../generated/schema'
import { getMiniChef } from './minichef'

export function getPool(pid: BigInt, block: ethereum.Block): Pool {
  const miniChef = getMiniChef(block)

  let pool = Pool.load(pid.toString())

  if (pool === null) {
    pool = new Pool(pid.toString())
    pool.miniChef = miniChef.id
    pool.pair = ZERO_ADDRESS
    pool.allocPoint = BIG_INT_ZERO
    pool.lastRewardTime = BIG_INT_ZERO
    pool.accSushiPerShare = BIG_INT_ZERO
    pool.slpBalance = BIG_INT_ZERO
    pool.userCount = BIG_INT_ZERO
    pool.timestamp = block.timestamp
    pool.block = block.number
    pool.save()
  }

  return pool as Pool
}


export function getNativeRewarderPool(pid: BigInt): NativeRewarderPool {
  let pool = NativeRewarderPool.load(pid.toString())

  if (pool === null) {
    pool = new NativeRewarderPool(pid.toString())
    pool.allocPoint = BIG_INT_ZERO
    pool.save()
  }

  return pool as NativeRewarderPool
}
