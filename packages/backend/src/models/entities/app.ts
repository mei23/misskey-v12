import { Entity, PrimaryColumn, Column, Index, ManyToOne } from 'typeorm';
import { User } from './user.js';
import { id } from '../id.js';

@Entity()
export class App {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the App.',
	})
	public createdAt: Date;

	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: 'The owner ID.',
	})
	public userId: User['id'] | null;

	@ManyToOne(type => User, {
		onDelete: 'SET NULL',
		nullable: true,
	})
	public user: User | null;

	@Index()
	@Column('varchar', {
		length: 64,
		comment: 'The secret key of the App.',
	})
	public secret: string;

	@Column('varchar', {
		length: 128,
		comment: 'The name of the App.',
	})
	public name: string;

	@Column('varchar', {
		length: 512,
		comment: 'The description of the App.',
	})
	public description: string;

	@Column('varchar', {
		length: 64, array: true,
		comment: 'The permission of the App.',
	})
	public permission: string[];

	@Column('varchar', {
		length: 512, nullable: true,
		comment: 'The callbackUrl of the App.',
	})
	public callbackUrl: string | null;
}
