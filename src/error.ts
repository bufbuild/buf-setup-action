// Copyright 2020-2021 Buf Technologies, Inc.
//
// All rights reserved.

// Error is the built-in error type.
export interface Error {
  message: string;
}

// isError determines if the given value is an Error.
// https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export function isError(value: any): value is Error {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return (value as Error).message !== undefined;
}
