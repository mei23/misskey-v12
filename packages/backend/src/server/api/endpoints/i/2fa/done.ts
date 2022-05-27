import $ from 'cafy';
import * as speakeasy from 'speakeasy';
import define from '../../../define';
import { UserProfiles } from '@/models/index';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		token: {
			validator: $.str,
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	const token = ps.token.replace(/\s/g, '');

	const profile = await UserProfiles.findOneOrFail(user.id);

	if (profile.twoFactorTempSecret == null) {
		throw new Error('二段階認証の設定が開始されていません');
	}

	const verified = (speakeasy as any).totp.verify({
		secret: profile.twoFactorTempSecret,
		encoding: 'base32',
		token: token,
	});

	if (!verified) {
		throw new Error('not verified');
	}

	await UserProfiles.update(user.id, {
		twoFactorSecret: profile.twoFactorTempSecret,
		twoFactorEnabled: true,
	});
});
