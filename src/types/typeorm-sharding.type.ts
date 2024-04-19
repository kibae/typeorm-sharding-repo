import { DataSource } from 'typeorm';
import { BaseDataSourceOptions } from 'typeorm/data-source/BaseDataSourceOptions';
import { AuroraMysqlConnectionOptions } from 'typeorm/driver/aurora-mysql/AuroraMysqlConnectionOptions';
import { AuroraPostgresConnectionOptions } from 'typeorm/driver/aurora-postgres/AuroraPostgresConnectionOptions';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { OracleConnectionOptions } from 'typeorm/driver/oracle/OracleConnectionOptions';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import { BetterSqlite3ConnectionOptions } from 'typeorm/driver/better-sqlite3/BetterSqlite3ConnectionOptions';

export interface AbstractShardingDataSource<S, T extends BaseDataSourceOptions> extends BaseDataSourceOptions {
    shards: Array<
        Omit<T, keyof BaseDataSourceOptions> & {
            onInitialize?: (dataSource: DataSource) => Promise<void>;
        } & S
    >;
}

export interface PostgresShardingDataSource<S> extends AbstractShardingDataSource<S, PostgresConnectionOptions> {
    type: 'postgres';
}

export interface AuroraPostgresShardingDataSource<S> extends AbstractShardingDataSource<S, AuroraPostgresConnectionOptions> {
    type: 'aurora-postgres';
}

export interface MysqlShardingDataSource<S> extends AbstractShardingDataSource<S, MysqlConnectionOptions> {
    type: 'mysql' | 'mariadb';
}

export interface AuroraMysqlShardingDataSource<S> extends AbstractShardingDataSource<S, AuroraMysqlConnectionOptions> {
    type: 'aurora-mysql';
}

export interface OracleShardingDataSource<S> extends AbstractShardingDataSource<S, OracleConnectionOptions> {
    type: 'oracle';
}

export interface SqliteShardingDataSource<S> extends AbstractShardingDataSource<S, SqliteConnectionOptions> {
    type: 'sqlite';
}

export interface BetterSqlite3ShardingDataSource<S> extends AbstractShardingDataSource<S, BetterSqlite3ConnectionOptions> {
    type: 'better-sqlite3';
}

// ... "cockroachdb" | "sap" | "cordova" | "react-native" | "nativescript" | "sqljs" | "mssql" | "mongodb" | "expo" | "capacitor" | "spanner"

export type AbstractShardingDataSourceOptions<S = {}> =
    | PostgresShardingDataSource<S>
    | AuroraPostgresShardingDataSource<S>
    | MysqlShardingDataSource<S>
    | AuroraMysqlShardingDataSource<S>
    | OracleShardingDataSource<S>
    | SqliteShardingDataSource<S>
    | BetterSqlite3ShardingDataSource<S>;

export enum ShardingType {
    RANGE = 'RANGE',
    FUNCTION = 'FUNCTION',
    // MODULAR = 'MODULAR',
}

export type DefaultShardingKeyType = number | string;

//.______          ___      .__   __.   _______  _______
// |   _  \        /   \     |  \ |  |  /  _____||   ____|
// |  |_)  |      /  ^  \    |   \|  | |  |  __  |  |__
// |      /      /  /_\  \   |  . `  | |  | |_ | |   __|
// |  |\  \----./  _____  \  |  |\   | |  |__| | |  |____
// | _| `._____/__/     \__\ |__| \__|  \______| |_______|
export interface RangeShardingRule<T> {
    /**
     * greater or equals
     */
    minKey: T;

    /**
     * lesser
     */
    maxKey: T;
}

export type RangeShardingDataSourceOptions<T = DefaultShardingKeyType> = AbstractShardingDataSourceOptions<RangeShardingRule<T>> & {
    shardingType: ShardingType.RANGE;
};

//  _______  __    __  .__   __.   ______ .___________. __    ______   .__   __.
// |   ____||  |  |  | |  \ |  |  /      ||           ||  |  /  __  \  |  \ |  |
// |  |__   |  |  |  | |   \|  | |  ,----'`---|  |----`|  | |  |  |  | |   \|  |
// |   __|  |  |  |  | |  . `  | |  |         |  |     |  | |  |  |  | |  . `  |
// |  |     |  `--'  | |  |\   | |  `----.    |  |     |  | |  `--'  | |  |\   |
// |__|      \______/  |__| \__|  \______|    |__|     |__|  \______/  |__| \__|
export interface FunctionShardingRule<U = any> {
    userData?: U;
}

export type FunctionShardingDataSourceOptions<U = any> = AbstractShardingDataSourceOptions<FunctionShardingRule<U>> & {
    shardingType: ShardingType.FUNCTION;
};

export type ShardingDataSourceOptions<T = DefaultShardingKeyType> = RangeShardingDataSourceOptions<T> | FunctionShardingDataSourceOptions;
