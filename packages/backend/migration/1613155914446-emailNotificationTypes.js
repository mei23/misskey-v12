

export class emailNotificationTypes1613155914446 {
    constructor() {
        this.name = 'emailNotificationTypes1613155914446';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "emailNotificationTypes" jsonb NOT NULL DEFAULT '["follow","receiveFollowRequest","groupInvited"]'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "emailNotificationTypes"`);
    }
}
