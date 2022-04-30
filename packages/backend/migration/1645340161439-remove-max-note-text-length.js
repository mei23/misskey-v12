

export class removeMaxNoteTextLength1645340161439 {
    name = 'removeMaxNoteTextLength1645340161439'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "maxNoteTextLength"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "maxNoteTextLength" integer NOT NULL DEFAULT '500'`);
    }
}
