import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.js';
import { DriveFolder } from './drive-folder.js';
import { id } from '../id.js';

@Entity()
@Index(['userId', 'folderId', 'id'])
export class DriveFile {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the DriveFile.',
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
	})
	@JoinColumn()
	public user: User | null;

	@Index()
	@Column('varchar', {
		length: 128, nullable: true,
		comment: 'The host of owner. It will be null if the user in local.',
	})
	public userHost: string | null;

	@Index()
	@Column('varchar', {
		length: 32,
		comment: 'The MD5 hash of the DriveFile.',
	})
	public md5: string;

	@Column('varchar', {
		length: 256,
		comment: 'The file name of the DriveFile.',
	})
	public name: string;

	@Index()
	@Column('varchar', {
		length: 128,
		comment: 'The content type (MIME) of the DriveFile.',
	})
	public type: string;

	@Column('integer', {
		comment: 'The file size (bytes) of the DriveFile.',
	})
	public size: number;

	@Column('varchar', {
		length: 512, nullable: true,
		comment: 'The comment of the DriveFile.',
	})
	public comment: string | null;

	@Column('varchar', {
		length: 128, nullable: true,
		comment: 'The BlurHash string.',
	})
	public blurhash: string | null;

	@Column('jsonb', {
		default: {},
		comment: 'The any properties of the DriveFile. For example, it includes image width/height.',
	})
	public properties: { width?: number; height?: number; orientation?: number; avgColor?: string };

	@Column('boolean')
	public storedInternal: boolean;

	@Column('varchar', {
		length: 512,
		comment: 'The URL of the DriveFile.',
	})
	public url: string;

	@Column('varchar', {
		length: 512, nullable: true,
		comment: 'The URL of the thumbnail of the DriveFile.',
	})
	public thumbnailUrl: string | null;

	@Column('varchar', {
		length: 512, nullable: true,
		comment: 'The URL of the webpublic of the DriveFile.',
	})
	public webpublicUrl: string | null;

	@Column('varchar', {
		length: 128, nullable: true,
	})
	public webpublicType: string | null;

	@Index({ unique: true })
	@Column('varchar', {
		length: 256, nullable: true,
	})
	public accessKey: string | null;

	@Index({ unique: true })
	@Column('varchar', {
		length: 256, nullable: true,
	})
	public thumbnailAccessKey: string | null;

	@Index({ unique: true })
	@Column('varchar', {
		length: 256, nullable: true,
	})
	public webpublicAccessKey: string | null;

	@Index()
	@Column('varchar', {
		length: 512, nullable: true,
		comment: 'The URI of the DriveFile. it will be null when the DriveFile is local.',
	})
	public uri: string | null;

	@Column('varchar', {
		length: 512, nullable: true,
	})
	public src: string | null;

	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: 'The parent folder ID. If null, it means the DriveFile is located in root.',
	})
	public folderId: DriveFolder['id'] | null;

	@ManyToOne(type => DriveFolder, {
		onDelete: 'SET NULL',
	})
	@JoinColumn()
	public folder: DriveFolder | null;

	@Index()
	@Column('boolean', {
		default: false,
		comment: 'Whether the DriveFile is NSFW.',
	})
	public isSensitive: boolean;

	/**
	 * 外部の(信頼されていない)URLへの直リンクか否か
	 */
	@Index()
	@Column('boolean', {
		default: false,
		comment: 'Whether the DriveFile is direct link to remote server.',
	})
	public isLink: boolean;
}
