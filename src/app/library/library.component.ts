import {Component, OnDestroy, OnInit} from '@angular/core';
import {KodiService} from '../kodi/kodi.service';
import {map, takeUntil} from 'rxjs/operators';
import {BehaviorSubject, merge, Observable, Subject} from 'rxjs';
import {FlatTreeControl} from '@angular/cdk/tree';
import {CollectionViewer, SelectionChange} from '@angular/cdk/collections';

/** Flat node with expandable and level information */
export class DynamicFlatNode {
  isLoading: boolean;

  constructor(public item: any,
              public level: number,
              public expandable: boolean) {
  }
}

@Component({
  selector: 'app-library',
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.css']
})
export class LibraryComponent implements OnInit, OnDestroy {
  libraryInfo: any;

  treeControl: FlatTreeControl<DynamicFlatNode>;
  treeDataChange = new BehaviorSubject<DynamicFlatNode[]>([]);

  currentlyPlaying = '';

  private unsubscribe: Subject<void> = new Subject();

  constructor(private kodi: KodiService) {
    this.treeControl = new FlatTreeControl<DynamicFlatNode>(this.getLevel, this.isExpandableNode);
  }

  ngOnInit() {
    this.kodi.playerPlaying.pipe(takeUntil(this.unsubscribe)).subscribe(this.playerPlaying);
    this.kodi.playerStopped.pipe(takeUntil(this.unsubscribe)).subscribe(this.playerStopped);
    this.kodi.playerChanged.pipe(takeUntil(this.unsubscribe)).subscribe(this.playerChanged);

    this.kodi.loadLibraryInfo().pipe(takeUntil(this.unsubscribe)).subscribe(this.libraryInfoLoaded);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  get treeData(): DynamicFlatNode[] {
    return this.treeDataChange.value;
  }

  set treeData(value: DynamicFlatNode[]) {
    this.treeControl.dataNodes = value;
    this.treeDataChange.next(value);
  }

  connect(collectionViewer: CollectionViewer): Observable<DynamicFlatNode[]> {
    this.treeControl.expansionModel.onChange.subscribe(change => {
      if ((change as SelectionChange<DynamicFlatNode>).added ||
        (change as SelectionChange<DynamicFlatNode>).removed) {
        this.handleTreeControl(change as SelectionChange<DynamicFlatNode>);
      }
    });

    return merge(collectionViewer.viewChange, this.treeDataChange).pipe(map(() => this.treeData));
  }

  /** Handle expand/collapse behaviors */
  handleTreeControl(change: SelectionChange<DynamicFlatNode>) {
    if (change.added) {
      change.added.forEach(node => this.toggleNode(node, true));
    }
    if (change.removed) {
      change.removed.slice().reverse().forEach(node => this.toggleNode(node, false));
    }
  }

  /** Toggle the node, remove from display list */
  toggleNode(node: DynamicFlatNode, expand: boolean) {
    node.isLoading = true;

    this.getChildren(node.item.file)
      .subscribe((children) => {
        const index = this.treeData.indexOf(node);
        if (!children || index < 0) { // If no children, or cannot find the node, no op
          return;
        }

        if (expand) {
          const nodes = children.toc.map(item => new DynamicFlatNode(item, node.level + 1, this.isExpandableItem(item)));
          this.treeData.splice(index + 1, 0, ...nodes);
        } else {
          let count = 0;
          for (let i = index + 1; i < this.treeData.length && this.treeData[i].level > node.level; i++, count++) {
          }
          this.treeData.splice(index + 1, count);
        }

        // notify the change
        this.treeDataChange.next(this.treeData);
        node.isLoading = false;
      });
  }

  getLevel = (node: DynamicFlatNode) => node.level;

  isExpandableNode = (node: DynamicFlatNode) => node.expandable;

  isExpandableItem = (item: any) => item.filetype === 'directory';

  hasChild = (_: number, node: DynamicFlatNode) => node.expandable;

  getChildren(directory: string) {
    return this.kodi.loadDirectory(directory)
      .pipe(takeUntil(this.unsubscribe));
  }

  onPlayFile(node: DynamicFlatNode) {
    this.kodi.playFile(node.item.file);
  }

  onPlayDirectory(node: DynamicFlatNode) {
    this.kodi.playDirectory(node.item.file);
  }

  private libraryInfoLoaded = (libraryInfo: any) => {
    this.libraryInfo = libraryInfo;
    this.getChildren(this.libraryInfo.file)
      .subscribe((children: any) => {
        this.treeData = children.toc.map(item => new DynamicFlatNode(item, 0, this.isExpandableItem(item)));
      });
  }

  private playerPlaying = (file) => {
    this.currentlyPlaying = file;
  };

  private playerStopped = () => {
    this.currentlyPlaying = '';
  };

  private playerChanged = (data: any) => {
    this.currentlyPlaying = data.file;
  };

  getPlayableItemStyle(node: DynamicFlatNode) {
    const isPlaying = this.currentlyPlaying === node.item.file;
    return {
      'cursor': 'pointer',
      'font-weight': isPlaying ? 'bold' : 'normal'
    };
  }
}
