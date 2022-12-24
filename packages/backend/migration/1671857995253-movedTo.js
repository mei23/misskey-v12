export class activeEmailValidation1657346559800 {
    name = 'movedTo1671857995253'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "movedToUserId" character varying(32)`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_cbf3496973acfd942402035ceaa" UNIQUE ("movedToUserId")`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."movedToUserId" IS 'Moved to user ID'`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_cbf3496973acfd942402035ceaa" FOREIGN KEY ("movedToUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_cbf3496973acfd942402035ceaa"`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."movedToUserId" IS 'Moved to user ID'`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_cbf3496973acfd942402035ceaa"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "movedToUserId"`);
    }
}
