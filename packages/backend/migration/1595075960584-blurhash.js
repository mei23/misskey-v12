

export class blurhash1595075960584 {
    constructor() {
        this.name = 'blurhash1595075960584';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "drive_file" ADD "blurhash" character varying(128)`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "drive_file" DROP COLUMN "blurhash"`);
    }
}
