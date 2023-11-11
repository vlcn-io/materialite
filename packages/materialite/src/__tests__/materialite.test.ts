import { expect, test } from "vitest";
import { Materialite } from "../materialite.js";
import util from "util";
import { ArrayView } from "../views/ArrayView.js";

function inspect(e: any) {
  console.log(util.inspect(e, false, null, true));
}

test("Materialite#setSource", () => {
  const materialite = new Materialite();
  const set = materialite.newStatelessSet<number>();

  set.stream.map((v) => v + 1).effect((v) => inspect(v));
  set.add(1);
  set.add(1);
  set.delete(1);
});

// test("Materialite - reduce for groupBy", () => {
//   const materialite = new Materialite();
//   type Item = {
//     id: number;
//     category: "a" | "b" | "c";
//     name: string;
//   };
//   const set = materialite.newSet<Item>();
//   const stream = set.stream.reduce(
//     (x) => {
//       const grouping =
//       return [x, 1];
//     },
//     (item) => item.category
//   );
// });

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

  const playlists = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    name: `Playlist ${i}`,
  }));
  const tracks = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    name: `Track ${i}`,
    album_id: Math.floor(i / 10),
    length: i * 1000,
  }));
  const albums = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    name: `Album ${i}`,
  }));
  const playlistsTracks: TrackPlaylist[] = [];
  let j = 0;
  for (const playlist of playlists) {
    for (let i = 0; i < 10; i++) {
      playlistsTracks.push({
        track_id: j++,
        playlist_id: playlist.id,
      });
    }
  }

  const trackArtists: TrackArtist[] = [];
  for (let i = 0; i < tracks.length; i++) {
    trackArtists.push({
      track_id: i,
      artist_id: i % 10,
    });
  }
  const artists = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    name: `Artist ${i}`,
  }));

  const materialite = new Materialite();

  // TODO: what if operators are attached after the source is committed?
  // Maybe no initial construction allowed?
  const playlistSource = materialite.newStatelessSet<Playlist>();
  const trackSource = materialite.newStatelessSet<Track>();
  const albumSource = materialite.newStatelessSet<Album>();
  const playlistTrackSource = materialite.newStatelessSet<TrackPlaylist>();
  const trackArtistSource = materialite.newStatelessSet<TrackArtist>();
  const artistSource = materialite.newStatelessSet<Artist>();

  // playlistTrackSource.stream.debug((v) => inspect(v));

  const stream = playlistSource.stream
    .filter((playlist) => playlist.id === 1)
    .join(
      playlistTrackSource.stream,
      (playlist) => playlist.id,
      (trackPlaylist) => trackPlaylist.playlist_id
    )
    .join(
      trackSource.stream,
      ([_playlist, trackPlaylist]) => trackPlaylist.track_id,
      (track) => track.id
    )
    .join(
      albumSource.stream,
      ([_playlist, _trackPlaylist, track]) => track.album_id,
      (album) => album.id
    )
    .join(
      trackArtistSource.stream,
      ([_playlist, _trackPlaylist, track, _album]) => track.id,
      (trackArtist) => trackArtist.track_id
    )
    .join(
      artistSource.stream,
      ([_playlist, _trackPlaylist, _track, _album, trackArtist]) =>
        trackArtist.artist_id,
      (artist) => artist.id
    )
    .reduce(
      (tracks) => {
        if (tracks.length == 0) {
          return [];
        }
        const [playlist, _, track, album, __] = tracks[0]![0];
        const ret = {
          id: track.id,
          name: track.name,
          album_name: album.name,
          artists: tracks.map((t) => t[0][5].name),
          length: track.length,
          playlist: playlist.name,
        };
        return [[ret, 1]];
      },
      ([_, __, track]) => track.id
    );

  const sink = new ArrayView(materialite, stream);

  let result: any[] = [];
  let callCount = 0;
  sink.on((d) => {
    result = d;
    callCount += 1;
    console.log(result);
  });

  materialite.tx(() => {
    playlistSource.addAll(playlists);
    trackSource.addAll(tracks);
    albumSource.addAll(albums);
    playlistTrackSource.addAll(playlistsTracks);
    trackArtistSource.addAll(trackArtists);
    artistSource.addAll(artists);
  });

  expect(callCount).toBe(1);
  expect(result).toEqual([
    {
      id: 19,
      name: "Track 19",
      album_name: "Album 1",
      artists: ["Artist 9"],
      length: 19000,
      playlist: "Playlist 1",
    },
    {
      id: 18,
      name: "Track 18",
      album_name: "Album 1",
      artists: ["Artist 8"],
      length: 18000,
      playlist: "Playlist 1",
    },
    {
      id: 17,
      name: "Track 17",
      album_name: "Album 1",
      artists: ["Artist 7"],
      length: 17000,
      playlist: "Playlist 1",
    },
    {
      id: 16,
      name: "Track 16",
      album_name: "Album 1",
      artists: ["Artist 6"],
      length: 16000,
      playlist: "Playlist 1",
    },
    {
      id: 15,
      name: "Track 15",
      album_name: "Album 1",
      artists: ["Artist 5"],
      length: 15000,
      playlist: "Playlist 1",
    },
    {
      id: 14,
      name: "Track 14",
      album_name: "Album 1",
      artists: ["Artist 4"],
      length: 14000,
      playlist: "Playlist 1",
    },
    {
      id: 13,
      name: "Track 13",
      album_name: "Album 1",
      artists: ["Artist 3"],
      length: 13000,
      playlist: "Playlist 1",
    },
    {
      id: 12,
      name: "Track 12",
      album_name: "Album 1",
      artists: ["Artist 2"],
      length: 12000,
      playlist: "Playlist 1",
    },
    {
      id: 11,
      name: "Track 11",
      album_name: "Album 1",
      artists: ["Artist 1"],
      length: 11000,
      playlist: "Playlist 1",
    },
    {
      id: 10,
      name: "Track 10",
      album_name: "Album 1",
      artists: ["Artist 0"],
      length: 10000,
      playlist: "Playlist 1",
    },
  ]);
});
