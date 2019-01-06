import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Subject} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class KodiService implements OnDestroy {

  private static KODI_URL = 'http://192.168.1.3/jsonrpc';
  private static PLAYER_POLL_INTERVAL = 5000;  // ms

  private requestId = 1;
  private unsubscribe: Subject<void> = new Subject();
  private readonly interval: any;

  playerPlaying = new Subject<string>();
  playerSpeedChanged = new Subject<number>();
  playerStopped = new Subject<void>();
  playerChanged = new Subject<any>();

  constructor(private httpClient: HttpClient) {
    this.interval = setInterval(() => {
      this.pollPlayer();
    }, KodiService.PLAYER_POLL_INTERVAL);
  }

  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  loadLibraryInfo() {
    return this.httpClient
      .jsonp(this.createRequestUrl('Files.GetSources', {media: 'music'}), 'callback')
      .pipe(map((res: any) => {
        const library = res.result.sources.filter((source: any) => source.file.startsWith('nfs://'))[0];
        return {
          file: library.file,
          name: library.label
        };
      }));
  }

  private pollPlayer() {
    const playerProperties = this.createRequest('Player.GetProperties', {playerid: 0, properties: ['speed', 'time', 'totaltime']});
    const playerItem = this.createRequest('Player.GetItem', {playerid: 0, properties: ['file', 'album', 'artist']});
    this.httpClient
      .jsonp(this.createRequestsUrl([playerProperties, playerItem]), 'callback')
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (res: any) => {
          let playerItemInfo = {};
          if (res[1].result.item.file) {
            playerItemInfo = {
              file: res[1].result.item.file,
              label: res[1].result.item.label,
              album: res[1].result.item.album,
              artist: res[1].result.item.artist[0],
              speed: res[0].result.speed,
              time: res[0].result.time,
              totaltime: res[0].result.totaltime,
            };
          }
          this.playerChanged.next(playerItemInfo);
        },
        err => this.panic(err)
      );
  }

  loadDirectory(directory: string) {
    const params = {
      directory: directory,
      media: 'music',
      sort: {method: 'label', order: 'ascending'}
    };

    return this.httpClient
      .jsonp(this.createRequestUrl('Files.GetDirectory', params), 'callback')
      .pipe(map((res: any) => {
        return {
          url: directory,
          toc: res.result.files.filter((elm: any) => elm.label !== '@eaDir')
        };
      }));
  }

  playDirectory(directory: string) {
    this.play(directory, {directory: directory});
  }

  playFile(file: string) {
    this.play(file, {file: file});
  }

  private play(url: string, playlistItem: any) {
    const clearPlaylist = this.createRequest('Playlist.Clear', {playlistid: 0});
    const insertIntoPlaylist = this.createRequest('Playlist.Insert', {playlistid: 0, position: 0, item: playlistItem});
    const openPlayer = this.createRequest('Player.Open', {item: {playlistid: 0, position: 0}, options: {}});

    this.httpClient
      .jsonp(this.createRequestsUrl([clearPlaylist, insertIntoPlaylist, openPlayer]), 'callback')
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        () => this.playerPlaying.next(url),
        err => this.panic(err)
      );
  }

  pauseOrResume() {
    this.httpClient
      .jsonp(this.createRequestUrl('Player.PlayPause', {playerid: 0, play: 'toggle'}), 'callback')
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (res: any) => this.playerSpeedChanged.next(res.result.speed),
        err => this.panic(err)
      );
  }

  stop() {
    const stopPlayer = this.createRequest('Player.Stop', {playerid: 0});
    const clearPlaylist = this.createRequest('Playlist.Clear', {playlistid: 0});
    this.httpClient
      .jsonp(this.createRequestsUrl([stopPlayer, clearPlaylist]), 'callback')
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        () => this.playerStopped.next(),
        err => this.panic(err)
      );
  }

  gotoPrevious() {
    this.goto('previous');
  }

  gotoNext() {
    this.goto('next');
  }

  private goto(where: string) {
    this.httpClient
      .jsonp(this.createRequestUrl('Player.GoTo', {playerid: 0, to: where}), 'callback')
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        () => {
        },
        err => this.panic(err)
      );
  }

  private createRequestUrl(method: string, params: any) {
    return KodiService.KODI_URL + '?request=' + JSON.stringify(this.createRequest(method, params));
  }

  private createRequestsUrl(requests: any[]) {
    return KodiService.KODI_URL + '?request=' + JSON.stringify(requests);
  }

  private createRequest(method: string, params: any) {
    const request = {
      method: method,
      params: params,
      id: this.requestId++,
      jsonrpc: '2.0'
    };
    // console.debug(request);
    return request;
  }

  panic = (err) => {
    console.error(err);
  }

}
