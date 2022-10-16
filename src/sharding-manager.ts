import { DataSource, DeepPartial } from 'typeorm';
import { ShardingBaseEntity } from './sharding-base-entity';
import { ShardingDataSourceOptions, ShardingType } from './types/typeorm-sharding.type';
import { DataSourceOptions } from 'typeorm/data-source/DataSourceOptions';

export class ShardingManager {
    public readonly dataSources: DataSource[] = [];

    private _destroyed: boolean = false;
    public get destroyed(): boolean {
        return this._destroyed;
    }

    protected constructor(public readonly options: ShardingDataSourceOptions) {}

    protected async init(): Promise<this> {
        const { shards, ...config } = this.options;

        this.dataSources.push(
            ...(await Promise.all(
                //initialize all datasource
                this.options.shards.map((opt) => {
                    return new Promise<DataSource>(async (resolve, reject) => {
                        try {
                            const { onInitialize, ...options } = opt;
                            const dataSource = await new DataSource({ ...options, ...config } as DataSourceOptions).initialize();
                            if (onInitialize) await onInitialize(dataSource);

                            resolve(dataSource);
                        } catch (e) {
                            reject(e);
                        }
                    });
                })
            ))
        );

        this.dataSources.forEach((ds) => {
            ds.entityMetadatas.forEach((meta) => {
                const shardingType = Reflect.getMetadata('SHARDING_TYPE', meta.target);
                if (shardingType !== this.options.shardingType)
                    throw new Error(`ShardingManager: @ShardingEntity({type}) doesn't match ShardingManager.options.shardingType`);

                Reflect.defineMetadata('SHARDING_MANAGER', this, meta.target);
            });
        });

        return this;
    }

    public static async init(options: ShardingDataSourceOptions): Promise<ShardingManager> {
        return new ShardingManager(options).init();
    }

    getDataSource(entity: DeepPartial<ShardingBaseEntity>, shardingFunc: Function): DataSource {
        /*
        if (this.options.shardingType === ShardingType.MODULAR) {
            throw new Error('ShardingManager: Modular type is not supported yet.');
        } else */ if (this.options.shardingType === ShardingType.RANGE) {
            const idx = this.options.shards.findIndex((item) => shardingFunc(entity, item.minKey, item.maxKey));
            if (idx < 0) return this.dataSources[this.dataSources.length - 1];
            return this.dataSources[idx];
        } else throw new Error('ShardingManager: Unsupported sharding type');
    }

    getDataSourceById(id: unknown, shardingFuncById: Function): DataSource {
        if (this.options.shardingType === ShardingType.RANGE) {
            const idx = this.options.shards.findIndex((item) => shardingFuncById(id, item.minKey, item.maxKey));
            if (idx < 0) return this.dataSources[this.dataSources.length - 1];
            return this.dataSources[idx];
        } else throw new Error('ShardingManager: Unsupported sharding type');
    }

    async destroy() {
        this._destroyed = true;
        await Promise.all(this.dataSources.map((dataSource) => dataSource.destroy()));
    }
}
