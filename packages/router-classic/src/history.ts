
export interface HistoryLocation {
  path: string
  search: string
}

export interface NavigateOptions {
  replace: boolean
}

export type NavigateFunction = (location: HistoryLocation, options?: NavigateOptions) => void

export interface History {
  navigate: NavigateFunction
  pop(): void
  get location(): HistoryLocation
}


export function createBrowserHistory(): History {
  const history = window.history

  return {
    navigate(location, options) {
      const { path, search } = location
      const url = path + search
      if (options?.replace) {
        history.replaceState(null, '', url)
      } else {
        history.pushState(null, '', url)
      }
    },
    pop() {
      history.back()
    },
    get location() {
      const { pathname, search } = window.location
      return { path: pathname, search }
    }
  }
}

export function createStaticHistory(location: HistoryLocation): History {
  return {
    navigate() {
      throw new Error('You cannot call navigate on a static history')
    },
    pop() {
      throw new Error('You cannot call pop on a static history')
    },
    get location() {
      return location
    }
  }
}

export function createMemoryHistory(location: HistoryLocation): History {
  let index = 0
  const stack = [location]

  return {
    navigate(location, options) {
      if (options?.replace) {
        stack[index] = location
      } else {
        index++
        stack[index] = location
      }
    },
    pop() {
      if (index > 0) {
        index--
      }
    },
    get location() {
      return stack[index]
    }
  }
}
