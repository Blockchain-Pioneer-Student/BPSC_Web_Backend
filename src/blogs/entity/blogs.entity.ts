/* eslint-disable prettier/prettier */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    JoinTable,
    ManyToMany,
    JoinColumn
} from 'typeorm';
import { BlogCategory } from './blog_categories.entity';
import { BlogTag } from './blog_tags.entity';

@Entity('blogs')
export class Blog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'uuid', unique: true, nullable: false, default: () => 'gen_random_uuid()' })
    blog_uuid: string;

    @Column({ type: 'varchar', length: 200, nullable: false })
    title: string;

    @Column({ type: 'varchar', length: 200, unique: true, nullable: false })
    slug: string;

    @Column({ type: 'text', nullable: true })
    thumbnail_url: string;

    @Column({ type: 'text', nullable: false })
    short_description: string;

    @Column({ type: 'text', nullable: false })
    content: string;

    @Column({ type: 'int', nullable: false })
    category_id: number;

    @Column({ type: 'varchar', length: 150, nullable: false })
    author: string;

    @Column({ type: 'timestamp', nullable: true })
    published_at: Date;

    @Column({ type: 'boolean', default: false })
    is_published: boolean;

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    @Column({ type: 'int', default: 0, nullable: false })
    views: number;

    @ManyToOne(() => BlogCategory, (category) => category.id, {
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: "category_id" }) // FIX quan trọng
    category: BlogCategory;

    @ManyToMany(() => BlogTag, (tag) => tag.id)
    @JoinTable({
        name: 'blog_to_tags', // bảng trung gian đúng trong DB
        joinColumn: {
            name: 'blog_id',       // cột FK trỏ về Blog
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'tag_id',        // cột FK trỏ về Tag
            referencedColumnName: 'id',
        },
    })
    tags: BlogTag[];
}