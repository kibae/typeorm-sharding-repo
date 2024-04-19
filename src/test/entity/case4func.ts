import { Column, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ShardingEntity } from '../../sharding-data-source.decorator';
import { FunctionShardingRule, ShardingType } from '../../types/typeorm-sharding.type';
import { ShardingBaseEntity } from '../../sharding-base-entity';

@ShardingEntity<Case4, number>({
    type: ShardingType.FUNCTION,
    findShard: (entity: Case4, shardIndex: number, shard: FunctionShardingRule<string[]>) => shard.userData!.includes(entity.firstName),
})
export class Case4 extends ShardingBaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    @Index()
    firstName!: string;

    @Column()
    lastName!: string;

    @Column()
    age!: number;
}
