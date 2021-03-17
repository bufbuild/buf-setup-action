.PHONY: build
build:
	tsc && esbuild \
		--minify \
		--bundle \
		--sourcemap \
		'--define:process.env.NODE_ENV="production"' \
		--outdir=dist \
		--platform=node \
		--target=node12 \
		./src/main.ts
