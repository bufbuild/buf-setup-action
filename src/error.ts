// Copyright 2020-2022 Buf Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
