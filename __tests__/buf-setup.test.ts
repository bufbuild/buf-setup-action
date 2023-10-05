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
import * as io from "@actions/io";
import fs from "fs";
import cp from "child_process";
import osm, { type } from "os";
import path from "path";
import * as run from "../src/run";
import * as buf from "../src/buf";

const win32Join = path.win32.join;
const posixJoin = path.posix.join;

jest.setTimeout(10000);

describe("buf-setup", () => {
  let inputs = {} as any;
  let os = {} as any;

  let inSpy: jest.SpyInstance;
  let platSpy: jest.SpyInstance;
  let archSpy: jest.SpyInstance;
  let joinSpy: jest.SpyInstance;
  let execSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;
  let dbgSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let existsSpy: jest.SpyInstance;
  let readFileSpy: jest.SpyInstance;
  let getSpy: jest.SpyInstance;
  let whichSpy: jest.SpyInstance;
  let writeSpy: jest.SpyInstance;
  let failedSpy: jest.SpyInstance;

  beforeAll(async () => {
    // Stub out Environment file functionality so we can verify it writes to
    // standard out (toolkit is backwards compatible).
    process.env["GITHUB_ENV"] = "";
  }, 100000);

  beforeEach(() => {
    // Stub out ENV file functionality so we can verify it writes to standard out.
    process.env["GITHUB_PATH"] = "";

    // @actions/core
    inputs = {};
    // Defaults as per action.yml
    inputs["version"] = "1.26.0";
    inputs["buf_domain"] = "buf.build";
    logSpy = jest.spyOn(core, "info");
    dbgSpy = jest.spyOn(core, "debug");
    warnSpy = jest.spyOn(core, "warning");
    inSpy = jest.spyOn(core, "getInput");
    inSpy.mockImplementation((name) => inputs[name] ?? "");
    failedSpy = jest.spyOn(core, "setFailed");

    // buf methods.
    getSpy = jest.spyOn(buf, "getBuf");
    getSpy.mockImplementation(
      async (): Promise<string | Error> => "/usr/local"
    );

    // os methods.
    os = {};
    platSpy = jest.spyOn(osm, "platform");
    platSpy.mockImplementation(() => os["platform"]);
    archSpy = jest.spyOn(osm, "arch");
    archSpy.mockImplementation(() => os["arch"]);

    // cp methods.
    execSpy = jest.spyOn(cp, "execSync");

    // path methods.

    joinSpy = jest.spyOn(path, "join");
    joinSpy.mockImplementation((...paths: string[]): string => {
      // Switch path join behaviour based on set os.platform.
      if (os["platform"] == "win32") {
        return win32Join(...paths);
      }

      return posixJoin(...paths);
    });

    // fs methods.
    existsSpy = jest.spyOn(fs, "existsSync");
    readFileSpy = jest.spyOn(fs, "readFileSync");

    // io methods.
    whichSpy = jest.spyOn(io, "which");

    // process methods.
    writeSpy = jest.spyOn(process.stdout, "write");
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Prevent non-zero exit code as set by core.setFailed from failing tests.
    process.exitCode = 0;
  });

  afterAll(async () => {
    jest.restoreAllMocks();
  }, 100000);

  describe("go-version-file", () => {
    const versionFile = (filename: string, version: string): string => {
      const basename = path.basename(filename);
      if (basename === "go.mod") {
        return `module example.com/mymodule

go 1.14

require (
    example.com/othermodule v1.2.3
    example.com/thismodule v1.2.3
    github.com/bufbuild/buf ${version}
)

replace example.com/thatmodule => ../thatmodule
exclude example.com/thismodule v1.3.0
`;
      }

      return version + "\n";
    };

    const cases = [
      ["", "1.26.0", false], // No file specified, so expect version input to be used.
      ["go.mod", "v1.26.1", true], // go.mod file specified, so expect parsed version from file to be used.
      ["go.mod", "", false], // go.mod file missing, so expect an error.
      ["otherDir/go.mod", "v1.26.2", true], // pathed go.mod file specified, so expect parsed version from file to be used.
      ["buf.version", "v1.26.3", true], // buf.version file specified, so expect version with "v" prefix stripped.
    ];

    it.each(cases)(
      'filename: "%s" version: "%s" exists: %s',
      async (filename, version, exists) => {
        inputs["go_version_file"] = filename;
        existsSpy.mockImplementation(() => exists);
        readFileSpy.mockImplementation(() =>
          Buffer.from(versionFile(filename.toString(), version.toString()))
        );

        await run.run();

        if (filename !== "") {
          expect(warnSpy).toHaveBeenCalledWith(
            "Both version and go_version_file inputs are specified, go_version_file will be preferred"
          );

          if (!exists) {
            // Missing file, so expect an error in the log.
            expect(writeSpy).toHaveBeenCalledWith(
              `::error::The specified go version file: "${filename}" does not exist${osm.EOL}`
            );
            return;
          }
        }

        // Success case.
        expect(logSpy).toHaveBeenCalledWith(
          `Setting up buf version "${version}"`
        );
        expect(logSpy).toHaveBeenCalledWith(
          `Successfully setup buf version ${version}`
        );
      }
    );
  });
});
