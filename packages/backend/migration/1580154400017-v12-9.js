

export class v1291580154400017 {
    constructor() {
        this.name = 'v1291580154400017';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "antenna" ADD "withReplies" boolean NOT NULL DEFAULT false`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "antenna" DROP COLUMN "withReplies"`, undefined);
    }
}
