import { UserProfiles } from '@/models/index.js';

export async function validateEmailForAccount(emailAddress: string): Promise<{
	available: boolean;
	reason: null | 'used' | 'format' | 'disposable' | 'mx' | 'smtp';
}> {
	const exist = await UserProfiles.countBy({
		emailVerified: true,
		email: emailAddress,
	});

	const available = exist === 0;

	return {
		available,
		reason: available ? null :
			exist !== 0 ? 'used' :
			null,
	};
}
