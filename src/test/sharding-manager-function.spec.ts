import { ShardingManager } from '../sharding-manager';
import { ShardingType } from '../types/typeorm-sharding.type';
import { DataSource } from 'typeorm';
import { Case4 } from './entity/case4func';

async function updateSeq(dataSource: DataSource, val: number): Promise<void> {
    await dataSource.query(`INSERT INTO sqlite_sequence(name, seq) VALUES('case4', ${val})`);
}

async function getDataSource(): Promise<ShardingManager> {
    return ShardingManager.init({
        shardingType: ShardingType.FUNCTION,
        type: 'sqlite',
        synchronize: true,
        logging: 'all',
        entities: [Case4],
        shards: [
            { database: ':memory:', userData: ['Typeorm'], onInitialize: (dataSource) => updateSeq(dataSource, 0) },
            { database: ':memory:', userData: ['John'], onInitialize: (dataSource) => updateSeq(dataSource, 1000) },
            { database: ':memory:', userData: ['typeORM'], onInitialize: (dataSource) => updateSeq(dataSource, 2000) },
        ],
    });
}

let dataSource: ShardingManager;
describe('ShardingManager-Function', () => {
    beforeEach(async () => {
        dataSource = await getDataSource();
    });

    afterEach(async () => {
        if (dataSource) {
            await dataSource.destroy();
            dataSource.dataSources.forEach((dataSource) => expect(dataSource.isInitialized).toEqual(false));
        }
    });

    it('DataSource', async () => {
        expect(dataSource).toBeDefined();
        expect(dataSource.dataSources.length).toBe(3);
    });

    it('Case1 - insert into first shard', async () => {
        let entity;
        entity = await Case4.save({
            firstName: 'Typeorm',
            lastName: 'Sharding',
            age: 10,
        });

        const dataSources = Case4.getAllDataSource();
        expect((await dataSources[0].manager.query(`SELECT * FROM case4`)).length).toBe(1);
        expect((await dataSources[1].manager.query(`SELECT * FROM case4`)).length).toBe(0);
        expect((await dataSources[2].manager.query(`SELECT * FROM case4`)).length).toBe(0);

        expect((await Case4.find()).length).toBe(1);
        expect(await Case4.findOneBy({ firstName: 'Typeorm' })).toBeDefined();
        expect(await Case4.findOneBy({ firstName: 'John' })).toBeUndefined();

        // expect((await Case4.findOneById(1))?.firstName).toBeDefined();
        // expect((await Case4.findOneById(1001))?.firstName).toBeUndefined();
        // expect((await Case4.findOneById(2001))?.firstName).toBeUndefined();
    });

    it('Case1 - insert into second shard', async () => {
        let entity;
        entity = await Case4.save({
            firstName: 'typeORM',
            lastName: 'Sharding',
            age: 10,
        });

        const dataSources = Case4.getAllDataSource();
        expect((await dataSources[0].manager.query(`SELECT * FROM case4`)).length).toBe(0);
        expect((await dataSources[1].manager.query(`SELECT * FROM case4`)).length).toBe(0);
        expect((await dataSources[2].manager.query(`SELECT * FROM case4`)).length).toBe(1);

        expect((await Case4.find()).length).toBe(1);
        expect(await Case4.findOneBy({ firstName: 'typeORM' })).toBeDefined();
        expect(await Case4.findOneBy({ firstName: 'John' })).toBeUndefined();

        // expect((await Case4.findOneById(1))?.firstName).toBeUndefined();
        // expect((await Case4.findOneById(1001))?.firstName).toBeUndefined();
        // expect((await Case4.findOneById(2001))?.firstName).toBeDefined();
    });
});
