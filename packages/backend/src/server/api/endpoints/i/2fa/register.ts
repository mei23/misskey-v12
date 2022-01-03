import $ from 'cafy';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import config from '@/config/index';
import define from '../../../define';
import { UserProfiles } from '@/models/index';

export const meta = {
	requireCredential: true as const,

	secure: true,

	params: {
		password: {
			validator: $.str,
		},
	},
};

export default define(meta, async (ps, user) => {
	const profile = await UserProfiles.findOneOrFail(user.id);

	// Compare password
	const same = await bcrypt.compare(ps.password, profile.password!);

	if (!same) {
		throw new Error('incorrect password');
	}

	// Generate user's secret key
	const secret = speakeasy.generateSecret({
		length: 32,
	});

	await UserProfiles.update(user.id, {
		twoFactorTempSecret: secret.base32,
	});

	// Get the data URL of the authenticator URL
	const dataUrl = await QRCode.toDataURL(speakeasy.otpauthURL({
		secret: secret.base32,
		encoding: 'base32',
		label: user.username,
		issuer: config.host,
	}));

	return {
		qr: dataUrl,
		secret: secret.base32,
		label: user.username,
		issuer: config.host,
	};
});
