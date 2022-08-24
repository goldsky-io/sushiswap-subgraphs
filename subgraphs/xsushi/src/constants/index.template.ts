import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const XSUSHI = 'xSushi'
export const TRANSFER = 'TRANSFER'
export const MINT = 'MINT'
export const BURN = 'BURN'
export const BIG_DECIMAL_1E18 = BigDecimal.fromString('1e18')
export const ADDRESS_ZERO = Address.fromString('0x0000000000000000000000000000000000000000')

export const XSUSHI_ADDRESS = Address.fromString('{{ xSushi.address }}')

export const BIG_INT_ZERO = BigInt.fromI32(0)
export const BIG_DECIMAL_ZERO = BigDecimal.fromString('0')
export const BIG_DECIMAL_ONE = BigDecimal.fromString('1')
export const BIG_INT_ONE = BigInt.fromI32(1)

export const HOUR_IN_SECONDS = 3600
export const DAY_IN_SECONDS = HOUR_IN_SECONDS * 24
export const WEEK_IN_SECONDS = DAY_IN_SECONDS * 7
