.PHONY: build dev clean install

build:
	pnpm install && pnpm run build

dev:
	pnpm run dev

clean:
	rm -rf dist node_modules

install:
	pnpm install
