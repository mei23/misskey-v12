

export class instanceImages1605965516823 {
    constructor() {
        this.name = 'instanceImages1605965516823';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "backgroundImageUrl" character varying(512)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "logoImageUrl" character varying(512)`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "logoImageUrl"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "backgroundImageUrl"`);
    }
}
