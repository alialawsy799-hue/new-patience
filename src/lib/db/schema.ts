import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/* -------------------------------------------------------------------------- */
/*                                   Enums                                    */
/* -------------------------------------------------------------------------- */

export const localeEnum = pgEnum('locale', ['ar', 'en']);
export const adminRoleEnum = pgEnum('admin_role', ['owner', 'admin', 'editor', 'staff']);
export const codeStatusEnum = pgEnum('code_status', ['unused', 'activated', 'revoked']);
export const studentTitleEnum = pgEnum('student_title', ['doctor_male', 'doctor_female', 'none']);
export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'completed',
  'cancelled',
]);
export const messageStatusEnum = pgEnum('message_status', ['new', 'read', 'archived']);
export const actorTypeEnum = pgEnum('actor_type', ['admin', 'student', 'system', 'anonymous']);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

/* -------------------------------------------------------------------------- */
/*                              Admin & settings                              */
/* -------------------------------------------------------------------------- */

export const adminUsers = pgTable(
  'admin_users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    /** scrypt: `scrypt$N$r$p$salt$derivedKey` — never a raw or reversible value. */
    passwordHash: text('password_hash').notNull(),
    role: adminRoleEnum('role').notNull().default('admin'),
    isActive: boolean('is_active').notNull().default(true),
    /** Bumped on password change / forced logout to invalidate live sessions. */
    sessionVersion: integer('session_version').notNull().default(1),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [uniqueIndex('admin_users_email_unique').on(sql`lower(${table.email})`)],
);

export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*                             Courses & lessons                              */
/* -------------------------------------------------------------------------- */

export const stages = pgTable(
  'stages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** 1..5 — the human-facing "المرحلة الأولى … الخامسة". */
    number: integer('number').notNull(),
    slug: text('slug').notNull(),
    titleAr: text('title_ar').notNull(),
    titleEn: text('title_en').notNull(),
    subtitleAr: text('subtitle_ar').notNull().default(''),
    subtitleEn: text('subtitle_en').notNull().default(''),
    descriptionAr: text('description_ar').notNull().default(''),
    descriptionEn: text('description_en').notNull().default(''),
    /** Design-system accent key (see `src/lib/design/stage-accents.ts`). */
    accent: text('accent').notNull().default('orange'),
    coverImageUrl: text('cover_image_url'),
    isPublished: boolean('is_published').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('stages_number_unique').on(table.number),
    uniqueIndex('stages_slug_unique').on(table.slug),
  ],
);

export const lessons = pgTable(
  'lessons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    stageId: uuid('stage_id')
      .notNull()
      .references(() => stages.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    titleAr: text('title_ar').notNull(),
    titleEn: text('title_en').notNull(),
    descriptionAr: text('description_ar').notNull().default(''),
    descriptionEn: text('description_en').notNull().default(''),
    /** Numeric Vimeo id, e.g. "123456789". Never sent to the client directly
     *  unless the viewer passed the server-side authorisation check. */
    vimeoVideoId: text('vimeo_video_id'),
    /** Optional privacy hash for unlisted videos ("/123456789/abc123"). */
    vimeoHash: text('vimeo_hash'),
    thumbnailUrl: text('thumbnail_url'),
    durationSeconds: integer('duration_seconds').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(true),
    isPreview: boolean('is_preview').notNull().default(false),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('lessons_stage_position_unique').on(table.stageId, table.position),
    index('lessons_stage_idx').on(table.stageId),
  ],
);

/* -------------------------------------------------------------------------- */
/*                                  Students                                  */
/* -------------------------------------------------------------------------- */

export const students = pgTable(
  'students',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    title: studentTitleEnum('title').notNull().default('none'),
    locale: localeEnum('locale').notNull().default('ar'),
    email: text('email'),
    phone: text('phone'),
    isActive: boolean('is_active').notNull().default(true),
    /** Bumped by an admin revoke so every issued cookie stops validating. */
    sessionVersion: integer('session_version').notNull().default(1),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [index('students_created_idx').on(table.createdAt)],
);

/* -------------------------------------------------------------------------- */
/*                              Activation codes                              */
/* -------------------------------------------------------------------------- */

export const codeBatches = pgTable('code_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: text('label').notNull(),
  stageId: uuid('stage_id').references(() => stages.id, { onDelete: 'set null' }),
  quantity: integer('quantity').notNull().default(0),
  createdByAdminId: uuid('created_by_admin_id').references(() => adminUsers.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const activationCodes = pgTable(
  'activation_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** HMAC-SHA256(code, CODE_HASH_PEPPER) — the only lookup key. Unique. */
    codeHash: text('code_hash').notNull(),
    /** AES-256-GCM ciphertext so an admin can re-export codes later.
     *  Decrypted exclusively inside admin-authenticated export routes. */
    codeCipher: text('code_cipher').notNull(),
    /** Last 4 characters, safe to show in admin lists (e.g. "••••-Q8F2"). */
    codeHint: text('code_hint').notNull(),
    stageId: uuid('stage_id')
      .notNull()
      .references(() => stages.id, { onDelete: 'restrict' }),
    batchId: uuid('batch_id').references(() => codeBatches.id, { onDelete: 'set null' }),
    status: codeStatusEnum('status').notNull().default('unused'),
    studentId: uuid('student_id').references(() => students.id, { onDelete: 'set null' }),
    activatedAt: timestamp('activated_at', { withTimezone: true }),
    activatedIp: text('activated_ip'),
    activatedUserAgent: text('activated_user_agent'),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revokedReason: text('revoked_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('activation_codes_hash_unique').on(table.codeHash),
    index('activation_codes_stage_status_idx').on(table.stageId, table.status),
    index('activation_codes_student_idx').on(table.studentId),
  ],
);

export const studentStageAccess = pgTable(
  'student_stage_access',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    stageId: uuid('stage_id')
      .notNull()
      .references(() => stages.id, { onDelete: 'cascade' }),
    activationCodeId: uuid('activation_code_id').references(() => activationCodes.id, {
      onDelete: 'set null',
    }),
    /** 'activation' | 'admin_grant' */
    source: text('source').notNull().default('activation'),
    isRevoked: boolean('is_revoked').notNull().default(false),
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('student_stage_access_unique').on(table.studentId, table.stageId),
    index('student_stage_access_stage_idx').on(table.stageId),
  ],
);

/* -------------------------------------------------------------------------- */
/*                                  Progress                                  */
/* -------------------------------------------------------------------------- */

export const lessonProgress = pgTable(
  'lesson_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    watchedSeconds: integer('watched_seconds').notNull().default(0),
    /** Furthest position reached, used to resume playback. */
    lastPositionSeconds: integer('last_position_seconds').notNull().default(0),
    durationSeconds: integer('duration_seconds').notNull().default(0),
    progressPercent: integer('progress_percent').notNull().default(0),
    completed: boolean('completed').notNull().default(false),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    lastWatchedAt: timestamp('last_watched_at', { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('lesson_progress_unique').on(table.studentId, table.lessonId),
    index('lesson_progress_student_idx').on(table.studentId),
    index('lesson_progress_lesson_idx').on(table.lessonId),
  ],
);

export const stageCompletions = pgTable(
  'stage_completions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    stageId: uuid('stage_id')
      .notNull()
      .references(() => stages.id, { onDelete: 'cascade' }),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
    lessonsCompleted: integer('lessons_completed').notNull().default(0),
    /** Reserved for the future certificate system. */
    certificateSerial: text('certificate_serial'),
  },
  (table) => [uniqueIndex('stage_completions_unique').on(table.studentId, table.stageId)],
);

/* -------------------------------------------------------------------------- */
/*                                   Store                                    */
/* -------------------------------------------------------------------------- */

export const productCategories = pgTable(
  'product_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    nameAr: text('name_ar').notNull(),
    nameEn: text('name_en').notNull(),
    descriptionAr: text('description_ar').notNull().default(''),
    descriptionEn: text('description_en').notNull().default(''),
    imageUrl: text('image_url'),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex('product_categories_slug_unique').on(table.slug)],
);

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    categoryId: uuid('category_id').references(() => productCategories.id, {
      onDelete: 'set null',
    }),
    nameAr: text('name_ar').notNull(),
    nameEn: text('name_en').notNull(),
    shortDescriptionAr: text('short_description_ar').notNull().default(''),
    shortDescriptionEn: text('short_description_en').notNull().default(''),
    descriptionAr: text('description_ar').notNull().default(''),
    descriptionEn: text('description_en').notNull().default(''),
    /** Money is stored in minor units (integer) — never floats. */
    priceCents: integer('price_cents').notNull().default(0),
    compareAtPriceCents: integer('compare_at_price_cents'),
    currency: text('currency').notNull().default('IQD'),
    stock: integer('stock').notNull().default(0),
    images: jsonb('images').$type<string[]>().notNull().default([]),
    specs: jsonb('specs').$type<{ labelAr: string; labelEn: string; valueAr: string; valueEn: string }[]>()
      .notNull()
      .default([]),
    isActive: boolean('is_active').notNull().default(true),
    isFeatured: boolean('is_featured').notNull().default(false),
    isNew: boolean('is_new').notNull().default(false),
    comingSoon: boolean('coming_soon').notNull().default(false),
    salesCount: integer('sales_count').notNull().default(0),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('products_slug_unique').on(table.slug),
    index('products_category_idx').on(table.categoryId),
    index('products_active_idx').on(table.isActive),
  ],
);

export const carts = pgTable(
  'carts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** SHA-256 of the opaque cart token held in an http-only cookie. */
    tokenHash: text('token_hash').notNull(),
    studentId: uuid('student_id').references(() => students.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (table) => [uniqueIndex('carts_token_unique').on(table.tokenHash)],
);

export const cartItems = pgTable(
  'cart_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cartId: uuid('cart_id')
      .notNull()
      .references(() => carts.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
    ...timestamps,
  },
  (table) => [uniqueIndex('cart_items_unique').on(table.cartId, table.productId)],
);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: text('order_number').notNull(),
    studentId: uuid('student_id').references(() => students.id, { onDelete: 'set null' }),
    customerName: text('customer_name').notNull(),
    customerEmail: text('customer_email').notNull(),
    customerPhone: text('customer_phone').notNull(),
    addressLine: text('address_line').notNull().default(''),
    city: text('city').notNull().default(''),
    country: text('country').notNull().default(''),
    notes: text('notes').notNull().default(''),
    subtotalCents: integer('subtotal_cents').notNull().default(0),
    shippingCents: integer('shipping_cents').notNull().default(0),
    totalCents: integer('total_cents').notNull().default(0),
    currency: text('currency').notNull().default('IQD'),
    status: orderStatusEnum('status').notNull().default('pending'),
    locale: localeEnum('locale').notNull().default('ar'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('orders_number_unique').on(table.orderNumber),
    index('orders_status_idx').on(table.status),
    index('orders_created_idx').on(table.createdAt),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
    /** Snapshots: an order must stay readable after the product changes. */
    nameAr: text('name_ar').notNull(),
    nameEn: text('name_en').notNull(),
    imageUrl: text('image_url'),
    unitPriceCents: integer('unit_price_cents').notNull(),
    quantity: integer('quantity').notNull(),
    lineTotalCents: integer('line_total_cents').notNull(),
  },
  (table) => [index('order_items_order_idx').on(table.orderId)],
);

/* -------------------------------------------------------------------------- */
/*                          Contact, audit, rate limits                       */
/* -------------------------------------------------------------------------- */

export const contactMessages = pgTable(
  'contact_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull().default(''),
    subject: text('subject').notNull().default(''),
    message: text('message').notNull(),
    locale: localeEnum('locale').notNull().default('ar'),
    status: messageStatusEnum('status').notNull().default('new'),
    ipAddress: text('ip_address'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('contact_messages_status_idx').on(table.status, table.createdAt)],
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorType: actorTypeEnum('actor_type').notNull().default('system'),
    actorId: uuid('actor_id'),
    actorLabel: text('actor_label').notNull().default(''),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull().default(''),
    entityId: text('entity_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('audit_logs_created_idx').on(table.createdAt),
    index('audit_logs_action_idx').on(table.action),
  ],
);

export const rateLimitBuckets = pgTable('rate_limit_buckets', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

/* -------------------------------------------------------------------------- */
/*                                 Relations                                  */
/* -------------------------------------------------------------------------- */

export const stagesRelations = relations(stages, ({ many }) => ({
  lessons: many(lessons),
  activationCodes: many(activationCodes),
  access: many(studentStageAccess),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  stage: one(stages, { fields: [lessons.stageId], references: [stages.id] }),
  progress: many(lessonProgress),
}));

export const studentsRelations = relations(students, ({ many }) => ({
  access: many(studentStageAccess),
  progress: many(lessonProgress),
  completions: many(stageCompletions),
}));

export const activationCodesRelations = relations(activationCodes, ({ one }) => ({
  stage: one(stages, { fields: [activationCodes.stageId], references: [stages.id] }),
  student: one(students, { fields: [activationCodes.studentId], references: [students.id] }),
  batch: one(codeBatches, { fields: [activationCodes.batchId], references: [codeBatches.id] }),
}));

export const studentStageAccessRelations = relations(studentStageAccess, ({ one }) => ({
  student: one(students, { fields: [studentStageAccess.studentId], references: [students.id] }),
  stage: one(stages, { fields: [studentStageAccess.stageId], references: [stages.id] }),
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  student: one(students, { fields: [lessonProgress.studentId], references: [students.id] }),
  lesson: one(lessons, { fields: [lessonProgress.lessonId], references: [lessons.id] }),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
}));

export const cartsRelations = relations(carts, ({ many }) => ({
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type AdminUser = typeof adminUsers.$inferSelect;
export type Stage = typeof stages.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Student = typeof students.$inferSelect;
export type ActivationCode = typeof activationCodes.$inferSelect;
export type StudentStageAccess = typeof studentStageAccess.$inferSelect;
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type StageCompletion = typeof stageCompletions.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductCategory = typeof productCategories.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type StudentTitle = (typeof studentTitleEnum.enumValues)[number];
export type CodeStatus = (typeof codeStatusEnum.enumValues)[number];
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type MessageStatus = (typeof messageStatusEnum.enumValues)[number];
