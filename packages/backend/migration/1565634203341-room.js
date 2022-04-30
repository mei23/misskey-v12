

export class room1565634203341 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "room" jsonb NOT NULL DEFAULT '{}'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "room"`);
    }
}
