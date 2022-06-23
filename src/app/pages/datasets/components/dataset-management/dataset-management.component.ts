import { NestedTreeControl } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TrackByFunction,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { pluck } from 'rxjs/operators';
import { Dataset } from 'app/interfaces/dataset.interface';
import { IxFilter } from 'app/modules/ix-filters/ix-filters.interface';
import { IxNestedTreeDataSource } from 'app/modules/ix-tree/ix-tree-nested-datasource';
import { DatasetStore } from 'app/pages/datasets/store/dataset-store.service';
import { getDatasetAndParentsById } from 'app/pages/datasets/utils/get-datasets-in-tree-by-id.utils';
import { AppLoaderService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-management',
  templateUrl: './dataset-management.component.html',
  styleUrls: ['./dataset-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetsManagementComponent implements OnInit {
  selectedDataset: Dataset;
  selectedDatasetParent: Dataset | undefined;

  dataSource = new IxNestedTreeDataSource<Dataset>();
  treeControl = new NestedTreeControl<Dataset, string>((dataset) => dataset.children, {
    trackBy: (dataset) => dataset.id,
  });
  readonly trackByFn: TrackByFunction<Dataset> = (_, dataset) => dataset.id;
  readonly hasNestedChild = (_: number, dataset: Dataset): boolean => Boolean(dataset.children?.length);

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private loader: AppLoaderService, // TODO: Replace with a better approach
    private datasetStore: DatasetStore,
  ) { }

  ngOnInit(): void {
    this.loadTree();

    this.datasetStore.onReloadList
      .pipe(untilDestroyed(this))
      .subscribe(() => this.loadTree());
  }

  onFilter(filters: IxFilter[]): void {
    this.dataSource.filter(filters);
  }

  onSearch(query: string): void {
    this.dataSource.search(query);
  }

  private loadTree(): void {
    this.loader.open();
    this.ws.call('pool.dataset.query', [[], {
      extra: {
        flat: false,
        properties: [
          'name',
          'type',
          'used',
          'available',
          'mountpoint',
          'encryption',
          'encryptionroot',
          'keyformat',
          'keystatus',
          'locked',
        ],
      },
      order_by: ['name'],
    }]).pipe(
      untilDestroyed(this),
    ).subscribe(
      (datasets: Dataset[]) => {
        this.dataSource.data = datasets;
        this.treeControl.dataNodes = datasets;
        this.loader.close();
        const routeDatasetId = this.activatedRoute.snapshot.paramMap.get('datasetId');
        if (routeDatasetId) {
          this.selectByDatasetId(routeDatasetId);
        } else {
          this.selectFirstNode();
        }

        this.listenForRouteChanges();
        this.cdr.markForCheck();
      },
      (err) => {
        console.error(err); // TODO: Handle error.
        this.loader.close();
      },
    );
  }

  private selectByDatasetId(selectedDatasetId: string): void {
    const selectedBranch = getDatasetAndParentsById(this.treeControl.dataNodes, selectedDatasetId);
    if (!selectedBranch) {
      return;
    }

    this.selectedDataset = selectedBranch[selectedBranch.length - 1];
    this.selectedDatasetParent = selectedBranch[selectedBranch.length - 2];

    selectedBranch.forEach((dataset) => this.treeControl.expand(dataset));
  }

  private selectFirstNode(): void {
    if (!this.treeControl?.dataNodes.length) {
      return;
    }

    const dataset = this.treeControl.dataNodes[0];
    this.treeControl.expand(dataset);
    this.selectedDataset = dataset;
    this.selectedDatasetParent = undefined;
  }

  private listenForRouteChanges(): void {
    this.activatedRoute.params.pipe(
      pluck('datasetId'),
      untilDestroyed(this),
    ).subscribe(
      (datasetId) => this.selectByDatasetId(datasetId),
    );
  }
}
