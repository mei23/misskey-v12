

export class antennaExclude1582210532752 {
    constructor() {
        this.name = 'antennaExclude1582210532752';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "antenna" ADD "excludeKeywords" jsonb NOT NULL DEFAULT '[]'`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "antenna" DROP COLUMN "excludeKeywords"`, undefined);
    }
}
