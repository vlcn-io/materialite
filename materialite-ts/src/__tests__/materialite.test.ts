import { test } from "vitest";
import { Materialite } from "../materialite";
import util from "util";
import { DifferenceStream } from "../core/graph/DifferenceStream";

function inspect(e: any) {
  console.log(util.inspect(e, false, null, true));
}

test("Materialite#setSource", () => {
  const materialite = new Materialite();
  const set = materialite.newSet<number>();

  set.stream.map((v) => v + 1).debug((v) => inspect(v));
  set.add(1);
  set.add(1);
  set.delete(1);
});

test("Materialite#setSource - nothing released until commit", () => {});

test("db/overtone example - materialize track view", () => {
  type Track = {
    id: number;
    name: string;
    album_id: number;
    length: number;
  };
  type Artist = {
    id: number;
    name: string;
  };
  type TrackArtist = {
    track_id: number;
    artist_id: number;
  };
  type Album = {
    id: number;
    name: string;
  };
  type Playlist = {
    id: number;
    name: string;
  };
  type TrackPlaylist = {
    track_id: number;
    playlist_id: number;
  };
  // type MaterializedTrack = {
  //   id: number;
  //   name: string;
  //   album_name: string;
  //   artists: string[];
  //   length: number;
  // };

  const playlists = Array.from(
    { length: 10 },
    (_, i) =>
      [
        i,
        {
          id: i,
          name: `Playlist ${i}`,
        },
      ] as const
  );
  const tracks = Array.from(
    { length: 100 },
    (_, i) =>
      [
        i,
        {
          id: i,
          name: `Track ${i}`,
          album_id: Math.floor(i / 10),
          length: i * 1000,
        },
      ] as const
  );
  const albums = Array.from(
    { length: 10 },
    (_, i) =>
      [
        i,
        {
          id: i,
          name: `Album ${i}`,
        },
      ] as const
  );
  const playlistsTracks: (readonly [number, TrackPlaylist])[] = [];
  let j = 0;
  for (const playlist of playlists) {
    for (let i = 0; i < 10; i++) {
      playlistsTracks.push([
        playlist[0]!,
        {
          track_id: j++,
          playlist_id: playlist[0]!,
        },
      ] as const);
    }
  }

  const trackArtists: (readonly [number, TrackArtist])[] = [];
  for (let i = 0; i < tracks.length; i++) {
    trackArtists.push([
      i,
      {
        track_id: i,
        artist_id: i % 10,
      },
    ]);
  }
  const artists = Array.from(
    { length: 10 },
    (_, i) =>
      [
        i,
        {
          id: i,
          name: `Artist ${i}`,
        },
      ] as const
  );

  const materialite = new Materialite();

  // TODO: what if operators are attached after the source is committed?
  // Maybe no initial construction allowed?
  const playlistSource = materialite.newSet<readonly [number, Playlist]>();
  const trackSource = materialite.newSet<readonly [number, Track]>();
  const albumSource = materialite.newSet<readonly [number, Album]>();
  const playlistTrackSource =
    materialite.newSet<readonly [number, TrackPlaylist]>();
  const trackArtistSource =
    materialite.newSet<readonly [number, TrackArtist]>();
  const artistSource = materialite.newSet<readonly [number, Artist]>();

  // playlistTrackSource.stream.debug((v) => inspect(v));

  DifferenceStream.join(
    playlistSource.stream.filter(([id, _]) => id === 1),
    playlistTrackSource.stream
  )
    .map(([_, [pl, tp]]) => {})
    .debug(inspect);

  // .join(playlistTrackSource.stream)
  // .map(([_, [playlist, trackPlaylist]]) => {
  //   return [trackPlaylist.track_id, playlist];
  // })
  // .debug((v) => inspect(v));

  playlistSource.addAll(playlists);
  // trackSource.extend(tracks);
  // albumSource.extend(albums);
  playlistTrackSource.addAll(playlistsTracks);
  // trackArtistSource.extend(trackArtists);
  // artistSource.extend(artists);
});
