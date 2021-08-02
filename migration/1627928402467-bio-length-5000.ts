import {MigrationInterface, QueryRunner} from "typeorm";

export class bioLength50001627928402467 implements MigrationInterface {
    name = 'bioLength50001627928402467'

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "description" TYPE character varying(5120)`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "description" TYPE character varying(2048)`, undefined);
    }

}
