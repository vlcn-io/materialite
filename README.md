# materialite

## Install & Build

```sh
pnpm install
cd buildall
pnpm watch
```

## Test

Prerequisite: `pnpm install`

```sh
pnpm test
```

## React Demo

installed & built.

```sh
cd demos/react
pnpm dev
```

## API

# TODO:

- [ ] React strict mode. Need to re-pull on re-connect of sink to source given strict mode runs effects twice.
- [ ] Allow source to be written before sink is connected. Maybe this already works? untested.
- [ ] 