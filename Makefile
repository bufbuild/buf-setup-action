# See https://tech.davis-hansson.com/p/make/
SHELL := bash
.DELETE_ON_ERROR:
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := all
MAKEFLAGS += --warn-undefined-variables
MAKEFLAGS += --no-builtin-rules
MAKEFLAGS += --no-print-directory
BIN := .tmp/bin
COPYRIGHT_YEARS := 2020-2025
LICENSE_IGNORE := -e dist\/

UNAME_OS := $(shell uname -s)

ifeq ($(UNAME_OS),Darwin)
SED_I := sed -i ''
else
SED_I := sed -i
endif

PHONY: all
all: ## Format, Lint and build (default)
	$(MAKE) build

.PHONY: format
format: node_modules
	npm run format

.PHONY: lint
lint: node_modules
	npm run lint

.PHONY: build
build: node_modules format lint
	npm run build

.PHONY: updateversion
updateversion:
ifndef VERSION
	$(error "VERSION must be set")
endif
	$(SED_I) "s/default: '[0-9].[0-9][0-9]*\.[0-9][0-9]*[-rc0-9]*'/default: '$(VERSION)'/g" action.yml
	$(SED_I) "s/[0-9].[0-9][0-9]*\.[0-9][0-9]*[-rc0-9]*/$(VERSION)/g" README.md

.PHONY: generate
generate: $(BIN)/license-header ## Regenerate licenses
	@# We want to operate on a list of modified and new files, excluding
	@# deleted and ignored files. git-ls-files can't do this alone. comm -23 takes
	@# two files and prints the union, dropping lines common to both (-3) and
	@# those only in the second file (-2). We make one git-ls-files call for
	@# the modified, cached, and new (--others) files, and a second for the
	@# deleted files.
	comm -23 \
		<(git ls-files --cached --modified --others --no-empty-directory --exclude-standard | sort -u | grep -v $(LICENSE_IGNORE) ) \
		<(git ls-files --deleted | sort -u) | \
		xargs $(BIN)/license-header \
			--license-type apache \
			--copyright-holder "Buf Technologies, Inc." \
			--year-range "$(COPYRIGHT_YEARS)"

.PHONY: checkgenerate
checkgenerate:
	@# Used in CI to verify that `make generate` doesn't produce a diff.
	test -z "$$(git status --porcelain | tee /dev/stderr)"

node_modules: package-lock.json
	npm ci

$(BIN)/license-header: Makefile
	@mkdir -p $(@D)
	GOBIN=$(abspath $(@D)) go install \
		  github.com/bufbuild/buf/private/pkg/licenseheader/cmd/license-header@v1.6.0
