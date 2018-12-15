import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class KodiService implements OnDestroy {

  private static KODI_URL = 'http://192.168.1.3:8080/jsonrpc';

  private requestId = 1;
  private unsubscribe: Subject<void> = new Subject();

  libraryInfoChanged = new Subject<any>();
  directoryLoaded = new Subject<any>();
  playerPlaying = new Subject<string>();
  playerSpeedChanged = new Subject<number>();
  playerStopped = new Subject<void>();

  constructor(private httpClient: HttpClient) {
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  loadLibraryInfo() {
    this.httpClient
      .jsonp(this.createRequestUrl('Files.GetSources', {media: 'music'}), 'callback')
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        const libraryInfo = {
          url: res.result.sources[0].file,
          name: res.result.sources[0].label
        };
        this.libraryInfoChanged.next(libraryInfo);
      });
  }

  loadDirectory(directory: string) {
    const params = {
      directory: directory,
      media: 'music',
      sort: {method: 'label', order: 'ascending'}
    };
    const url = this.createRequestUrl('Files.GetDirectory', params);

    this.httpClient
      .jsonp(url, 'callback')
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        const directoryData = {
          url: directory,
          toc: res.result.files.filter((elm: any) => elm.label !== '@eaDir')
        };
        this.directoryLoaded.next(directoryData);
      });
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
      .subscribe((res) => {
        console.debug(res);
        this.playerPlaying.next(url);
      });
  }

  pauseOrResume() {
    this.httpClient
      .jsonp(this.createRequestUrl('Player.PlayPause', {playerid: 0, play: 'toggle'}), 'callback')
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        this.playerSpeedChanged.next(res.result.speed);
      });
  }

  stop() {
    this.httpClient
      .jsonp(this.createRequestUrl('Player.Stop', {playerid: 0}), 'callback')
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.playerStopped.next();
      });
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
    console.debug(request);
    return request;
  }
}
