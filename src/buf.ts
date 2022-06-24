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

import * as os from "os";
import * as path from "path";
import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";
import { Octokit } from "@octokit/core";
import { Error, isError } from "./error";

// versionPrefix is used in Github release names, and can
// optionally be specified in the action's version parameter.
const versionPrefix = "v";

export async function getBuf(
  version: string,
  githubToken: string
): Promise<string | Error> {
  const binaryPath = tc.find("buf", version, os.arch());
  if (binaryPath !== "") {
    core.info(`Found in cache @ ${binaryPath}`);
    return binaryPath;
  }

  core.info(`Resolving the download URL for the current platform...`);
  const downloadURL = await getDownloadURL(version, githubToken);
  if (isError(downloadURL)) {
    return downloadURL;
  }

  let cacheDir = "";
  core.info(`Downloading buf version "${version}" from ${downloadURL}`);
  if (downloadURL.endsWith(".tar.gz")) {
    const downloadPath = await tc.downloadTool(downloadURL);
    core.info(
      `Successfully downloaded buf version "${version}" from ${downloadURL}`
    );

    core.info("Extracting buf...");
    const extractPath = await tc.extractTar(downloadPath);
    core.info(`Successfully extracted buf to ${extractPath}`);

    core.info("Adding buf to the cache...");
    cacheDir = await tc.cacheDir(
      path.join(extractPath, "buf"),
      "buf",
      version,
      os.arch()
    );
  } else {
    // For Windows, we only download the .exe for `buf` CLI becasue we do not create `.tar.gz`
    // bundles for Windows releases.
    const downloadPath = await tc.downloadTool(
      downloadURL,
      "C:\\Users\\runneradmin\\buf-download\\buf.exe"
    );
    core.info(
      `Successfully downloaded buf version "${version}" from ${downloadURL} to ${downloadPath}`
    );

    core.info("Adding buf to the cache...");
    cacheDir = await tc.cacheDir(
      path.dirname(downloadPath),
      "buf",
      version,
      os.arch()
    );
  }
  core.info(`Successfully cached buf to ${cacheDir}`);
  return cacheDir;
}

// getDownloadURL resolves Buf's Github download URL for the
// current architecture and platform.
async function getDownloadURL(
  version: string,
  githubToken: string
): Promise<string | Error> {
  let architecture = "";
  switch (os.arch()) {
    // The available architectures can be found at:
    // https://nodejs.org/api/process.html#process_process_arch
    case "x64":
      architecture = "x86_64";
      break;
    case "arm64":
      architecture = "arm64";
      break;
    default:
      return {
        message: `The "${os.arch()}" architecture is not supported with a Buf release.`,
      };
  }
  let platform = "";
  switch (os.platform()) {
    // The available platforms can be found at:
    // https://nodejs.org/api/process.html#process_process_platform
    case "linux":
      platform = "Linux";
      break;
    case "darwin":
      platform = "Darwin";
      break;
    case "win32":
      platform = "Windows";
      break;
    default:
      return {
        message: `The "${os.platform()}" platform is not supported with a Buf release.`,
      };
  }
  // The asset name is determined by the buf release structure found at:
  // https://github.com/bufbuild/buf/blob/8255257bd94c9f1b5faa27242211c5caad05be79/make/buf/scripts/release.bash#L102
  let assetName = "";
  // For Windows, we only download the .exe for `buf` CLI
  if (platform === "Windows") {
    assetName = `buf-${platform}-${architecture}.exe`;
  } else {
    assetName = `buf-${platform}-${architecture}.tar.gz`;
  }
  const octokit = new Octokit({ auth: githubToken });
  if (version === "latest") {
    const { data: releases } = await octokit.request(
      "GET /repos/{owner}/{repo}/releases",
      {
        owner: "bufbuild",
        repo: "buf",
        per_page: 1,
      }
    );
    for (const asset of releases[0].assets) {
      if (assetName === asset.name) {
        return asset.browser_download_url;
      }
    }
    return {
      message: `Unable to find Buf version "${version}" for platform "${platform}" and architecture "${architecture}".`,
    };
  }
  const tag = releaseTagForVersion(version);
  const { data: release } = await octokit.request(
    "GET /repos/{owner}/{repo}/releases/tags/{tag}",
    {
      owner: "bufbuild",
      repo: "buf",
      tag: tag,
    }
  );
  for (const asset of release.assets) {
    if (assetName === asset.name) {
      return asset.browser_download_url;
    }
  }
  return {
    message: `Unable to find Buf version "${version}" for platform "${platform}" and architecture "${architecture}".`,
  };
}

// releaseTagForVersion returns the release tag name based on a given version configuration.
// Github releases include the 'v' prefix, but the `buf --version` does not. Thus, we permit
// both versions, e.g. v0.38.0 and 0.38.0.
function releaseTagForVersion(version: string): string {
  if (version.indexOf(versionPrefix) === 0) {
    return version;
  }
  return versionPrefix + version;
}
