import { test } from "vitest";
import { GraphBuilder } from "../differential/dataflow/differential-dataflow.js";
import { Entry, Multiset } from "../differential/multiset.js";
import { inspect } from "../inspect.js";

/**
 * Craft an example where we have a bunch of relations and compute over those relations.
 *
 * Something like an Overtone example? Music tracks and music table?
 *
 * See if we can re-render a react component on relation change...
 *
 * - Tieing into render would be about identifying the changed row and binding to rows.
 * - Incremental update of a tree?
 */
test("tables", () => {
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
  type MaterializedTrack = {
    id: number;
    name: string;
    album_name: string;
    artists: string[];
    length: number;
  };

  // const tracks = new Map<number, Track>();
  // const artists = new Map<number, Artist>();
  // const trackArtists = new Map<number, TrackArtist>();
  // const albums = new Map<number, Album>();
  // const playlists = new Map<number, Playlist>();
  // // playlist_id -> TrackPlaylist
  // const playlistTrack = new Map<number, TrackPlaylist>();

  const graphBuilder = new GraphBuilder();
  const [tracksStream, tracksStreamWriter] =
    graphBuilder.newInput<[number, Track]>();
  const [artistStream, artistStreamWriter] =
    graphBuilder.newInput<[number, Artist]>();
  const [trackArtistStream, trackArtistStreamWriter] =
    graphBuilder.newInput<[number, TrackArtist]>();
  const [albumsStream, albumsStreamWriter] =
    graphBuilder.newInput<[number, Album]>();
  const [playlistStream, playlistStreamWriter] =
    graphBuilder.newInput<[number, Playlist]>();
  const [playlistTrackStream, playlistTrackStreamWriter] =
    graphBuilder.newInput<[number, TrackPlaylist]>();

  // create a view of the items in a playlist
  /*const playlistView =*/ playlistStream
    // filter down to playlist 1
    .filter(([_, playlist]) => playlist.id === 1)
    // join in the playlist->track table
    .join(playlistTrackStream)
    .map((v: any) => {
      // re-key by track_id
      const [_, [playlist, tp]] = v;
      return [tp.track_id, playlist];
    })
    // join in tracks
    .join(tracksStream)
    // re-key by album_id
    .map((v: any) => {
      const [_, [_playlist, track]] = v;
      return [track.album_id, track];
    })
    // join in album
    .join(albumsStream)
    // re-key by track_id
    .map((v: any) => {
      const [_, [track, album]] = v;
      return [track.id, [track, album]];
    })
    .join(trackArtistStream)
    // re-key by atrist_id
    .map((v: any) => {
      const [_, [[track, album], trackArtist]] = v;
      return [trackArtist.artist_id, [track, album]];
    })
    // join in artist id
    .join(artistStream)
    // re-key by track id
    .map((v: any) => {
      const [_, [[track, album], artist]] = v;
      return [track.id, [track, album, artist]];
    })
    // reduce to a single row per track
    .reduce((tracks: Entry<[Track, Album, Artist]>[]) => {
      if (tracks.length == 0) {
        return [];
      }
      const firstTrack = tracks[0]![0];
      const track: MaterializedTrack = {
        id: firstTrack[0].id,
        name: firstTrack[0].name,
        album_name: firstTrack[1].name,
        artists: tracks.map((t) => t[0][2].name),
        length: firstTrack[0].length,
      };
      return [[track, 1]];
    })
    .debug(inspect);

  const graph = graphBuilder.build();

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

  // Just add them all in a single mutliset
  playlistStreamWriter.sendData(
    new Multiset(playlists.map((p) => [[p.id, p], 1]))
  );
  playlistTrackStreamWriter.sendData(
    new Multiset(playlistsTracks.map((p) => [[p.playlist_id, p], 1]))
  );
  tracksStreamWriter.sendData(new Multiset(tracks.map((t) => [[t.id, t], 1])));
  albumsStreamWriter.sendData(new Multiset(albums.map((a) => [[a.id, a], 1])));
  trackArtistStreamWriter.sendData(
    new Multiset(trackArtists.map((ta) => [[ta.track_id, ta], 1]))
  );
  artistStreamWriter.sendData(new Multiset(artists.map((a) => [[a.id, a], 1])));

  graph.step();

  // const playlistView = tracksStream
  //   .join(trackArtistsStream)
  //   .join(artistsStream)
  //   .join(albumsStream)
  //   .join(playlistTrackStream)
  //   .filter(([_, [_, [_, [_, [playlistId, _]]]]]) => playlistId === 1)
  //   .map(([[trackId, track], [_, [artistId, artist]], [_, [_, album]], _]) => {
  //     return {
  //       trackId,
  //       track,
  //       artistId,
  //       artist,
  //       album,
  //     };
  //   });
});
