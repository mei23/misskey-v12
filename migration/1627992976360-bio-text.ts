import {MigrationInterface, QueryRunner} from "typeorm";

export class bioText1627992976360 implements MigrationInterface {
    name = 'bioText1627992976360'

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "description" TYPE text`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "description" TYPE character varying(2048)`, undefined);
    }
}
