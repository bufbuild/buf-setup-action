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

import cp from "child_process";
import * as os from "os";
import * as path from "path";
import * as core from "@actions/core";
import * as io from "@actions/io";
import { getBuf } from "./buf";
import { Error, isError } from "./error";

export async function run(): Promise<void> {
  try {
    const result = await runSetup();
    if (result !== null && isError(result)) {
      core.setFailed(result.message);
    }
  } catch (error) {
    // In case we ever fail to catch an error
    // in the call chain, we catch the error
    // and mark the build as a failure. The
    // user is otherwise prone to false positives.
    if (isError(error)) {
      core.setFailed(error.message);
      return;
    }
    core.setFailed("Internal error");
  }
}

// runSetup runs the buf-setup action, and returns
// a non-empty error if it fails.
async function runSetup(): Promise<null | Error> {
  const version = core.getInput("version");
  if (version === "") {
    return {
      message: "a version was not provided",
    };
  }

  const githubToken = core.getInput("github_token");
  if (githubToken === "") {
    core.warning(
      "No github_token supplied, API requests will be subject to stricter rate limiting"
    );
  }

  core.info(`Setting up buf version "${version}"`);
  const installDir = await getBuf(version, githubToken);
  if (isError(installDir)) {
    return installDir;
  }

  core.info("Adding buf binary to PATH");
  let binaryPath = "";
  if (os.platform() === "win32") {
    core.addPath(installDir);
  } else {
    core.addPath(path.join(installDir, "bin"));
  }
  binaryPath = await io.which("buf", true);
  if (binaryPath === "") {
    return {
      message: "buf was not found on PATH",
    };
  }

  core.info(`Successfully setup buf version ${version}`);
  core.info(cp.execSync(`${binaryPath} --version`).toString());

  const bufUser = core.getInput("buf_user");
  const bufAPIToken = core.getInput("buf_api_token");
  if (bufUser !== "" && bufAPIToken !== "") {
    core.info(`buf_user and buf_token supplied, logging in...`);
    core.info(
      cp
        .execSync(
          `${binaryPath} registry login --username ${bufUser} --token-stdin`,
          { input: bufAPIToken }
        )
        .toString()
    );
    return null;
  }

  if (bufUser !== "") {
    core.info(
      `buf_user is supplied, must also supply buf_token to log into Buf Schema Registry`
    );
    return null;
  }

  if (bufAPIToken !== "") {
    core.info(
      `buf_token is supplied, must also supply buf_user to log into Buf Schema Registry`
    );
    return null;
  }

  core.info(
    `buf_user and buf_token are not supplied, not logging into Buf Schema Registry`
  );
  return null;
}
