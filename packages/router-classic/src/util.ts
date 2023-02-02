
export type Result<T, Err> =
  | { type: 'ok'; value: T }
  | { type: 'err'; value: Err }

export function ok<T, Err>(value: T): Result<T, Err> {
  return { type: 'ok', value }
}

export function err<T, Err>(value: Err): Result<T, Err> {
  return { type: 'err', value }
}

export function unwrap<T, Err>(result: Result<T, Err>): T {
  if (result.type === 'ok') {
    return result.value
  } else {
    throw new Error(`unwrap failed: ${result.value}`)
  }
}
