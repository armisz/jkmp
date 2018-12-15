import {Component, OnDestroy, OnInit} from '@angular/core';
import {KodiService} from '../kodi/kodi.service';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';

@Component({
  selector: 'app-library',
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.css']
})
export class LibraryComponent implements OnInit, OnDestroy {
  libraryInfo: any;
  currentDirectory: any;

  private unsubscribe: Subject<void> = new Subject();

  constructor(private kodi: KodiService) {}

  ngOnInit() {
    this.kodi.libraryInfoChanged.pipe(takeUntil(this.unsubscribe)).subscribe(this.libraryInfoChanged);
    this.kodi.directoryLoaded.pipe(takeUntil(this.unsubscribe)).subscribe(this.directoryLoaded);
    this.kodi.loadLibraryInfo();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  private libraryInfoChanged = (data) => {
    this.libraryInfo = data;
    this.kodi.loadDirectory(this.libraryInfo.url);
  }

  private directoryLoaded = (data) => {
    this.currentDirectory = data;
  }

  onLoadDirectory(directory: string) {
    this.kodi.loadDirectory(directory);
  }

  onPlayFile(file: string) {
    this.kodi.playFile(file);
  }

  onPlayDirectory(directory: string) {
    this.kodi.playDirectory(directory);
  }
}
