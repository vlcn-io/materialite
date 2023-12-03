# linearite


https://github.com/vlcn-io/linearite/assets/1009003/377b64aa-3b2d-4333-8be9-931855dd77d7


## TODO:
- [ ] Paginated infinite scroll so we don't re-fetch 10k items from SQLite each time
- [ ] Deploy to fly.io
- [ ] A guide that walks through the implementation of this
- [ ] Paginated transaction sync -- right now we sync all 20,000 rows at once since they were written in a single transaction.
- [ ] Dev tools to simplify dropping the DB on the client
- [ ] Dev tools to download a copy of the DB from the browser
- [ ] Scale the example to 10 million issues

## Running

```sh
git clone git@github.com:vlcn-io/linearite.git
pnpm install
pnpm dev
```

If you're changing `Schema.ts` run `typed-sql` to auto-generate static types.

```sh
pnpm sql-watch
```
