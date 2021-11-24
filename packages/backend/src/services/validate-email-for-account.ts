import { UserProfiles } from '@/models';

export async function validateEmailForAccount(emailAddress: string): Promise<{
	available: boolean;
	reason: null | 'used' | 'format' | 'disposable' | 'mx' | 'smtp';
}> {
	const exist = await UserProfiles.count({
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
