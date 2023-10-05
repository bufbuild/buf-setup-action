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

import * as core from "@actions/core";
import * as path from "path";
import fs from "fs";

/**
 * Resolves the version of buf to use as determined from either "version" or
 * "go_version_file" inputs.
 *
 * If "go_version_file" is specified and the corresponding go.mod file contains
 * a version for github.com/bufbuild/buf it will be preferred over the value
 * of "version".
 *
 * @throws {@link error#Error}
 * Thrown if the filename specified by `go_version_file` doesn't exist.
 *
 * @returns The version of buf.
 */
export function resolveVersionInput(): string {
  const version = core.getInput("version");
  const versionFilePath = core.getInput("go_version_file");

  if (versionFilePath !== "") {
    if (version !== "") {
      core.warning(
        "Both version and go_version_file inputs are specified, go_version_file will be preferred"
      );
    }

    const goVersion = parseGoVersionFile(versionFilePath);
    if (goVersion !== "") {
      return goVersion;
    }
  }

  return version;
}

/**
 * Parses the contents of the file specified by `versionFilePath` and returns the
 * version.
 *
 * If the filename is "go.mod" then it looks for the entry for "github.com/bufbuild/buf"
 * and returns that or blank string if not found. Otherwise it returns the trimmed
 * contents of the file.
 *
 * @throws {@link error#Error}
 * Thrown if `versionFilePath` doesn't exist.
 *
 * @returns The version of github.com/bufbuild/buf if found otherwise empty string.
 */
function parseGoVersionFile(versionFilePath: string): string {
  if (!fs.existsSync(versionFilePath)) {
    throw new Error(
      `The specified go version file: "${versionFilePath}" does not exist`
    );
  }

  const contents = fs.readFileSync(versionFilePath).toString();
  const basename = path.basename(versionFilePath);
  if (basename === "go.mod") {
    const match = contents.match(
      /^\s+github.com\/bufbuild\/buf (v\d+(?:\.\d+)*)/m
    );
    return match ? match[1] : "";
  }

  return contents.trim();
}
