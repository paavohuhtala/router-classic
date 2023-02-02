import { err, ok, Result } from "./util";

export type Parser<T> = (value: string) => Result<T, string>
export type NamedParser<Name extends string, T> = { name: Name, parse: Parser<T>, serialize: (value: T) => string }

type ParamRoutePart<Name extends string, T = unknown> =
  | { type: 'param' } & NamedParser<Name, T>

type StaticRoutePart<Name extends string> =
  | { type: 'static'; value: Name }

export type RoutePart<Name extends string, T = unknown> =
  | StaticRoutePart<Name>
  | ParamRoutePart<Name, T>

export type Path = Array<RoutePart<any, any>>

// Print static strings as is, and print params as :paramName
export type PathToExpressRoute<Parts extends Array<any>> =
  Parts extends [infer Head extends RoutePart<any, any>, ...infer Tail] ?
  Head extends { type: 'static' } ? `/${Head['value']}${PathToExpressRoute<Tail>}` :
  Head extends { type: 'param' } ? `/:${Head['name']}${PathToExpressRoute<Tail>}` :
  never :
  ''


export interface Route<TPath extends Path, ChildRoutes extends Array<Route<any, any>>> {
  path: TPath
  children: ChildRoutes
}

// Parsers
export const p = {
  number<Name extends string>(name: Name): NamedParser<Name, number> {
    return {
      name,
      parse(value) {
        const number = Number(value)
        if (Number.isNaN(number)) {
          return err(`Expected ${name} to be a number`)
        }
        return ok(number)
      },
      serialize(value) {
        return value.toString()
      }
    }
  },
  string<Name extends string>(name: Name): NamedParser<Name, string> {
    return {
      name,
      parse: (value) => ok(value),
      serialize: (value) => value
    }
  },
  regex<Name extends string>(name: Name, regex: RegExp): NamedParser<Name, string> {
    return {
      name,
      parse(value) {
        if (!regex.test(value)) {
          return err(`Expected ${name} to match ${regex}`)
        }
        return ok(value)
      },
      serialize: (value) => value
    }
  }
}

// Tagged template literal to define a route

export type PathLiteralPart<Name extends string, T = unknown> =
  | string
  | NamedParser<Name, T>
  | Path

export type PathLiteralPartToPathParts<Part> =
  Part extends string ? [{ type: 'static', value: Part }] :
  Part extends NamedParser<any, any> ?
  [{ type: 'param' } & Part] :
  Part extends Path ? Part :
  never

export type PathLiteralPartsToPathParts<Parts extends Array<any>> =
  Parts extends [infer Head, ...infer Tail] ? [...PathLiteralPartToPathParts<Head>, ...PathLiteralPartsToPathParts<Tail>] : []


function path<Parts extends Array<PathLiteralPart<any, any>>>(...parts: Parts): PathLiteralPartsToPathParts<Parts> {
  return parts.flatMap<RoutePart<any, any>>(part => {
    if (typeof part === 'string') {
      return [{ type: 'static', value: part }]
    } else if (typeof part === 'object' && 'parse' in part) {
      return [{ type: 'param', ...part }]
    } else {
      return part
    }
  }) as PathLiteralPartsToPathParts<Parts>
}

export type PropsForPath<TPath> =
  TPath extends [infer Head, ...infer Tail] ?
  Head extends ParamRoutePart<infer Name, infer T> ? { [K in Name]: T } & PropsForPath<Tail> : PropsForPath<Tail> : {}

export type EmptyToNever<T> = {} extends T ? never : T

function pathToString<P extends Path>(path: P, props: EmptyToNever<PropsForPath<P>>): string {
  return path.map(part => {
    if (part.type === 'static') {
      return part.value
    } else {
      return (props as any)[part.name]
    }
  }).join('/')
}


type Concat<A extends Array<any>, B extends Array<any>> = [...A, ...B]
type CombinePaths<A extends Path, B extends Path> = Concat<A, B>

function subPath<Parent extends Path, Child extends Path>(parent: Parent, child: Child): CombinePaths<Parent, Child> {
  return [...parent, ...child]
}

const apiPath = path("api")
const customerFragment = path("customers", p.string("customerId"))
const orderFragment = path("orders", p.regex("orderId", /[A-F]{3}-[0-9]{3}/))
const customerOrderPath = path(apiPath, customerFragment, orderFragment)

type ExamplePath = PathToExpressRoute<typeof customerOrderPath>
const exampleUrl = pathToString(customerOrderPath, { customerId: "abc123", orderId: "FOO123" })

/*export type Unzip<A extends Array<any>, B extends Array<any>> =
  // If both arrays have elements, take the first element from each and recurse
  A extends [infer Head, ...infer Tail] ? B extends [infer Head2, ...infer Tail2]
  ? [Head, Head2, ...Unzip<Tail, Tail2>]

  // If only A has elements, return A
  : A
  // Otherwise return B - if B has elements, it will be returned, otherwise it will be an empty array
  : B

export type PathLiteralPartsToPathParts<Parts extends Array<any>> =
  Parts extends [infer Head, ...infer Tail] ? [PathLiteralPartToPathPart<Head>, ...PathLiteralPartsToPathParts<Tail>] : []

export function path<Strings extends string[], Parts extends Array<PathLiteralPart<any>>>(constants: Strings, ...parts: Parts[]): PathLiteralPartsToPathParts<Unzip<Strings, Parts>> {
  throw new Error('This function is only used for type inference')
}

const example = path`/foo/${p.number('bar')}/baz`*/

