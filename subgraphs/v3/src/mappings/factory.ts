import { FACTORY_ADDRESS, ZERO_BI, ZERO_BD, ADDRESS_ZERO, WHITELISTED_TOKEN_ADDRESSES } from './../constants'
import { Factory } from '../../generated/schema'
import { PoolCreated } from '../../generated/Factory/Factory'
import { Pool, Token, Bundle } from '../../generated/schema'
import { Pool as PoolTemplate } from '../../generated/templates'
import { fetchTokenSymbol, fetchTokenName, fetchTokenTotalSupply, fetchTokenDecimals } from '../utils/token'
import { log } from '@graphprotocol/graph-ts'

export function handlePoolCreated(event: PoolCreated): void {

  // load factory
  let factory = Factory.load(FACTORY_ADDRESS.toHex())
  if (factory === null) {
    factory = new Factory(FACTORY_ADDRESS.toHex())
    factory.owner = ADDRESS_ZERO

    // create new bundle for tracking eth price
    let bundle = new Bundle('1')
    bundle.ethPriceUSD = ZERO_BD
    bundle.save()
  }

  let pool = new Pool(event.params.pool.toHexString()) as Pool
  let token0 = Token.load(event.params.token0.toHexString())
  let token1 = Token.load(event.params.token1.toHexString())

  // fetch info if null
  if (token0 === null) {
    token0 = new Token(event.params.token0.toHexString())
    token0.symbol = fetchTokenSymbol(event.params.token0)
    token0.name = fetchTokenName(event.params.token0)
    token0.totalSupply = fetchTokenTotalSupply(event.params.token0)
    let decimals = fetchTokenDecimals(event.params.token0)

    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      log.debug('mybug the decimal on token 0 was null', [])
      return
    }

    token0.decimals = decimals
    token0.derivedETH = ZERO_BD
    token0.whitelistPools = []
  }

  if (token1 === null) {
    token1 = new Token(event.params.token1.toHexString())
    token1.symbol = fetchTokenSymbol(event.params.token1)
    token1.name = fetchTokenName(event.params.token1)
    token1.totalSupply = fetchTokenTotalSupply(event.params.token1)
    let decimals = fetchTokenDecimals(event.params.token1)
    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      log.debug('mybug the decimal on token 0 was null', [])
      return
    }
    token1.decimals = decimals
    token1.derivedETH = ZERO_BD
    token1.whitelistPools = []
  }

  // update white listed pools
  if (WHITELISTED_TOKEN_ADDRESSES.includes(token0.id)) {
    let newPools = token1.whitelistPools
    newPools.push(pool.id)
    token1.whitelistPools = newPools
  }
  if (WHITELISTED_TOKEN_ADDRESSES.includes(token1.id)) {
    let newPools = token0.whitelistPools
    newPools.push(pool.id)
    token0.whitelistPools = newPools
  }

  pool.token0 = token0.id
  pool.token1 = token1.id
  pool.createdAtTimestamp = event.block.timestamp
  pool.createdAtBlockNumber = event.block.number
  pool.liquidity = ZERO_BI
  pool.sqrtPrice = ZERO_BI
  pool.feeGrowthGlobal0X128 = ZERO_BI
  pool.feeGrowthGlobal1X128 = ZERO_BI
  pool.token0Price = ZERO_BD
  pool.token1Price = ZERO_BD
  pool.totalValueLockedToken0 = ZERO_BD
  pool.totalValueLockedToken1 = ZERO_BD

  pool.save()
  // create the tracked contract based on the template
  PoolTemplate.create(event.params.pool)
  token0.save()
  token1.save()
  factory.save()
}
