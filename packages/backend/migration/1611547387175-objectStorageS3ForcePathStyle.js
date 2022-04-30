

export class objectStorageS3ForcePathStyle1611547387175 {
    constructor() {
        this.name = 'objectStorageS3ForcePathStyle1611547387175';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "objectStorageS3ForcePathStyle" boolean NOT NULL DEFAULT true`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "objectStorageS3ForcePathStyle"`);
    }
}
