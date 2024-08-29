/* eslint-disable prefer-const */
import { Bundle, Pool, Swap, Token } from '../../generated/schema'
import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import {
  Initialize,
  Swap as SwapEvent,
} from '../../generated/templates/Pool/Pool'
import { convertTokenToDecimal, loadTransaction, safeDiv } from '../utils'
import { ZERO_BD, swapsStartBlock } from '../constants'
import { findEthPerToken, getEthPriceInUSD, getTrackedAmountUSD, sqrtPriceX96ToTokenPrices } from '../utils/pricing'

export function handleInitialize(event: Initialize): void {
  // update pool sqrt price and tick
  let pool = Pool.load(event.address.toHexString()) as Pool
  pool.sqrtPrice = event.params.sqrtPriceX96
  pool.save()

  // update token prices
  let token0 = Token.load(pool.token0) as Token
  let token1 = Token.load(pool.token1) as Token

  // update ETH price now that prices could have changed
  let bundle = Bundle.load('1') as Bundle
  bundle.ethPriceUSD = getEthPriceInUSD()
  bundle.save()

  // update token prices
  token0.derivedETH = findEthPerToken(token0)
  token1.derivedETH = findEthPerToken(token1)
  token0.save()
  token1.save()
}

export function handleSwap(event: SwapEvent): void {
  if (event.block.number.lt(swapsStartBlock)) {
    return
  }

  let bundle = Bundle.load('1') as Bundle
  let pool = Pool.load(event.address.toHexString()) as Pool

  let token0 = Token.load(pool.token0) as Token
  let token1 = Token.load(pool.token1) as Token

  // amounts - 0/1 are token deltas: can be positive or negative
  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

  // need absolute amounts for volume
  let amount0Abs = amount0
  if (amount0.lt(ZERO_BD)) {
    amount0Abs = amount0.times(BigDecimal.fromString('-1'))
  }
  let amount1Abs = amount1
  if (amount1.lt(ZERO_BD)) {
    amount1Abs = amount1.times(BigDecimal.fromString('-1'))
  }

  // get amount that should be tracked only - div 2 because cant count both input and output as volume
  let amountTotalUSDTracked = safeDiv(getTrackedAmountUSD(amount0Abs, token0, amount1Abs, token1), BigDecimal.fromString('2'))

  // Update the pool with the new active liquidity, price, and tick.
  pool.liquidity = event.params.liquidity
  pool.sqrtPrice = event.params.sqrtPriceX96
  pool.totalValueLockedToken0 = pool.totalValueLockedToken0.plus(amount0)
  pool.totalValueLockedToken1 = pool.totalValueLockedToken1.plus(amount1)

  // updated pool ratess
  let prices = sqrtPriceX96ToTokenPrices(pool.sqrtPrice, token0 as Token, token1 as Token)
  pool.token0Price = prices[0]
  pool.token1Price = prices[1]
  pool.save()

  // update USD pricing
  bundle.ethPriceUSD = getEthPriceInUSD()
  bundle.save()
  token0.derivedETH = findEthPerToken(token0 as Token)
  token1.derivedETH = findEthPerToken(token1 as Token)
  token0.save()
  token1.save()

  // create Swap event
  let transaction = loadTransaction(event)
  let swap = new Swap(transaction.id + '#' + event.logIndex.toString())
  swap.transaction = transaction.id
  swap.timestamp = transaction.timestamp
  swap.pool = pool.id
  swap.token0 = pool.token0
  swap.token1 = pool.token1
  swap.sender = event.params.sender
  swap.origin = event.transaction.from
  swap.recipient = event.params.recipient
  swap.amount0 = amount0
  swap.amount1 = amount1
  swap.amountUSD = amountTotalUSDTracked
  swap.tick = BigInt.fromI32(event.params.tick as i32)
  swap.sqrtPriceX96 = event.params.sqrtPriceX96
  swap.logIndex = event.logIndex
  swap.save()
}
