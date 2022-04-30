

export class driveFileWebpublicType1642613870898 {
    name = 'driveFileWebpublicType1642613870898'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "drive_file" ADD "webpublicType" character varying(128)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "drive_file" DROP COLUMN "webpublicType"`);
    }
}
