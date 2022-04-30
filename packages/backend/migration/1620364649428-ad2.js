

export class ad21620364649428 {
    constructor() {
        this.name = 'ad21620364649428';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "ad" ADD "ratio" integer NOT NULL DEFAULT '1'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "ad" DROP COLUMN "ratio"`);
    }
}
