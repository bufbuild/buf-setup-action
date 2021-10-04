SHELL := /usr/bin/env bash -o pipefail

UNAME_OS := $(shell uname -s)

ifeq ($(UNAME_OS),Darwin)
SED_I := sed -i ''
else
SED_I := sed -i
endif

.DEFAULT_GOAL := build

.PHONY: build
build:
	@tsc
	@eslint ./src
	@esbuild \
		--minify \
		--bundle \
		--sourcemap \
		'--define:process.env.NODE_ENV="production"' \
		--outdir=dist \
		--platform=node \
		--target=node12 \
		./src/main.ts

.PHONY: updateversion
updateversion:
ifndef VERSION
	$(error "VERSION must be set")
endif
	$(SED_I) "s/default: '[0-9].[0-9][0-9]*\.[0-9][0-9]*[-rc0-9]*'/default: '$(VERSION)'/g" action.yml
