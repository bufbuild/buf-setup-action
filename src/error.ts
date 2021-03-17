// Copyright 2020-2021 Buf Technologies, Inc.
//
// All rights reserved.

import cp from 'child_process';

// Error is a generic error.
export interface Error {
  errorMessage: string;
}

// isError determines if the given value is an Error.
// https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
export function isError(value: any): value is Error {
  return (value as Error)?.errorMessage !== undefined;
}
