import fs from 'node:fs';
import path from 'node:path';
import { and, eq, notInArray, sql } from 'drizzle-orm';
import { db, runMigrations } from './index';
import {
  activationCodes,
  adminUsers,
  codeBatches,
  lessons,
  productCategories,
  products,
  siteSettings,
  stages,
} from './schema';
import { env } from '@/lib/env';
import { hashPassword, passwordIssues } from '@/lib/security/password';
import {
  activationCodeHint,
  encryptActivationCode,
  hashActivationCode,
  normalizeActivationCode,
} from '@/lib/security/crypto';
import { defaultSettings, mergeSettings, SETTINGS_KEY } from '@/lib/settings/defaults';
import { seedCategories, seedProducts, seedStages } from './seed-data';

async function seedAdmin() {
  const email = env.seedAdmin.email.toLowerCase();
  const [existing] = await db.select().from(adminUsers).limit(1);
  if (existing) {
    console.log(`  · admin user already exists (${existing.email}) — left untouched`);
    return;
  }

  const password = env.seedAdmin.password;
  if (!password) {
    console.warn('  ! SEED_ADMIN_PASSWORD is empty — skipping admin creation.');
    console.warn('    Set it in .env.local and re-run `npm run db:seed`.');
    return;
  }

  const issues = passwordIssues(password);
  if (issues.length > 0) {
    throw new Error(
      `SEED_ADMIN_PASSWORD is too weak (${issues.join(', ')}). Use 12+ characters with upper, lower and a digit.`,
    );
  }

  await db.insert(adminUsers).values({
    email,
    name: env.seedAdmin.name,
    passwordHash: await hashPassword(password),
    role: 'owner',
  });
  console.log(`  · admin owner created: ${email}`);
}

async function seedStaff() {
  const email = env.seedStaff.email.toLowerCase();
  const [existing] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  if (existing) {
    console.log(`  · staff user already exists (${existing.email}) — left untouched`);
    return;
  }

  const password = env.seedStaff.password;
  if (!password) {
    console.warn('  ! SEED_STAFF_PASSWORD is empty — skipping staff creation.');
    return;
  }

  const issues = passwordIssues(password);
  if (issues.length > 0) {
    throw new Error(
      `SEED_STAFF_PASSWORD is too weak (${issues.join(', ')}). Use 12+ characters with upper, lower and a digit.`,
    );
  }

  await db.insert(adminUsers).values({
    email,
    name: env.seedStaff.name,
    passwordHash: await hashPassword(password),
    role: 'staff',
  });
  console.log(`  · staff user created: ${email}`);
}

async function seedSettings() {
  const [existing] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, SETTINGS_KEY))
    .limit(1);

  if (!existing) {
    await db.insert(siteSettings).values({ key: SETTINGS_KEY, value: defaultSettings });
    console.log('  · site settings created (currency IQD)');
    return;
  }

  const merged = mergeSettings(existing.value);
  merged.store.currency = defaultSettings.store.currency;
  merged.store.enabled = false;
  await db
    .update(siteSettings)
    .set({ value: merged, updatedAt: new Date() })
    .where(eq(siteSettings.key, SETTINGS_KEY));
  console.log(`  · site settings currency set to ${merged.store.currency}`);
}

async function seedCourses() {
  for (const stage of seedStages) {
    const [existing] = await db.select().from(stages).where(eq(stages.slug, stage.slug)).limit(1);

    const stageId =
      existing?.id ??
      (
        await db
          .insert(stages)
          .values({
            number: stage.number,
            slug: stage.slug,
            titleAr: stage.titleAr,
            titleEn: stage.titleEn,
            subtitleAr: stage.subtitleAr,
            subtitleEn: stage.subtitleEn,
            descriptionAr: stage.descriptionAr,
            descriptionEn: stage.descriptionEn,
            accent: stage.accent,
            sortOrder: stage.number,
          })
          .returning({ id: stages.id })
      )[0].id;

    const existingLessons = await db.select().from(lessons).where(eq(lessons.stageId, stageId));
    if (existingLessons.length > 0) {
      let linked = 0;
      for (const [index, lesson] of stage.lessons.entries()) {
        if (!lesson.vimeoVideoId) continue;
        await db
          .update(lessons)
          .set({
            titleAr: lesson.titleAr,
            titleEn: lesson.titleEn,
            vimeoVideoId: lesson.vimeoVideoId,
            vimeoHash: lesson.vimeoHash ?? null,
            updatedAt: new Date(),
          })
          .where(and(eq(lessons.stageId, stageId), eq(lessons.position, index + 1)));
        linked += 1;
      }
      console.log(
        `  · ${stage.slug}: ${existingLessons.length} lessons already present${linked ? ` — ${linked} video(s) linked` : ' — skipped'}`,
      );
      continue;
    }

    await db.insert(lessons).values(
      stage.lessons.map((lesson, index) => ({
        stageId,
        position: index + 1,
        titleAr: lesson.titleAr,
        titleEn: lesson.titleEn,
        descriptionAr: lesson.descriptionAr,
        descriptionEn: lesson.descriptionEn,
        durationSeconds: lesson.durationSeconds,
        vimeoVideoId: lesson.vimeoVideoId ?? null,
        vimeoHash: lesson.vimeoHash ?? null,
        isPublished: true,
        isPreview: index === 0,
      })),
    );
    console.log(`  · ${stage.slug}: ${stage.lessons.length} demo lessons created`);
  }
}

async function seedStore() {
  const categoryIds = new Map<string, string>();
  const categorySlugs = seedCategories.map((category) => category.slug);

  for (const [index, category] of seedCategories.entries()) {
    const [existing] = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.slug, category.slug))
      .limit(1);

    if (existing) {
      await db
        .update(productCategories)
        .set({
          nameAr: category.nameAr,
          nameEn: category.nameEn,
          descriptionAr: category.descriptionAr,
          descriptionEn: category.descriptionEn,
          imageUrl: category.image,
          sortOrder: index,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(productCategories.id, existing.id));
      categoryIds.set(category.slug, existing.id);
      continue;
    }

    const [created] = await db
      .insert(productCategories)
      .values({
        slug: category.slug,
        nameAr: category.nameAr,
        nameEn: category.nameEn,
        descriptionAr: category.descriptionAr,
        descriptionEn: category.descriptionEn,
        imageUrl: category.image,
        sortOrder: index,
      })
      .returning({ id: productCategories.id });

    categoryIds.set(category.slug, created.id);
  }

  await db
    .update(productCategories)
    .set({ isActive: false, updatedAt: new Date() })
    .where(notInArray(productCategories.slug, categorySlugs));

  const productSlugs = seedProducts.map((product) => product.slug);
  let created = 0;
  let updated = 0;

  for (const [index, product] of seedProducts.entries()) {
    const values = {
      slug: product.slug,
      categoryId: categoryIds.get(product.categorySlug) ?? null,
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      shortDescriptionAr: product.shortAr,
      shortDescriptionEn: product.shortEn,
      descriptionAr: product.descAr,
      descriptionEn: product.descEn,
      priceCents: product.priceCents,
      compareAtPriceCents: product.compareAtCents,
      currency: defaultSettings.store.currency,
      stock: product.stock,
      images: [product.image],
      specs: product.specs ?? [],
      isFeatured: product.featured,
      isNew: product.isNew,
      comingSoon: product.comingSoon ?? false,
      isActive: true,
      salesCount: product.salesCount,
      sortOrder: index,
      updatedAt: new Date(),
    };

    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.slug, product.slug))
      .limit(1);

    if (existing) {
      await db.update(products).set(values).where(eq(products.id, existing.id));
      updated += 1;
      continue;
    }

    await db.insert(products).values(values);
    created += 1;
  }

  await db
    .update(products)
    .set({ isActive: false, updatedAt: new Date() })
    .where(notInArray(products.slug, productSlugs));

  console.log(
    `  · store: ${categoryIds.size} categories, ${created} products created, ${updated} updated`,
  );
}

async function seedCodesFromExport() {
  const csvPath = path.resolve(process.cwd(), 'exports/PATIENCE_COURSE_CODES.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('  · no exports/PATIENCE_COURSE_CODES.csv — skipping code import');
    return;
  }

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(activationCodes);
  if (Number(total) > 0) {
    console.log(`  · activation codes already present (${total}) — left untouched`);
    return;
  }

  const stageRows = await db.select({ id: stages.id, number: stages.number, titleEn: stages.titleEn }).from(stages);
  const byTitle = new Map(stageRows.map((row) => [row.titleEn.toLowerCase(), row.id]));
  const byNumber = new Map(stageRows.map((row) => [row.number, row.id]));

  const lines = fs.readFileSync(csvPath, 'utf8').split(/\r?\n/).slice(1).filter(Boolean);
  const parsed: { code: string; stageId: string }[] = [];

  for (const line of lines) {
    const [rawCode, rawStage] = line.split(',');
    const code = normalizeActivationCode(rawCode ?? '');
    if (!code) continue;
    const stageLabel = (rawStage ?? '').trim().toLowerCase();
    const numberMatch = stageLabel.match(/(\d+)/);
    const stageId =
      byTitle.get(stageLabel) ?? (numberMatch ? byNumber.get(Number(numberMatch[1])) : undefined);
    if (!stageId) continue;
    parsed.push({ code, stageId });
  }

  if (parsed.length === 0) {
    console.log('  · export CSV was empty or unreadable — skipping code import');
    return;
  }

  const [batch] = await db
    .insert(codeBatches)
    .values({ label: 'Imported from PATIENCE_COURSE_CODES.csv', quantity: parsed.length })
    .returning({ id: codeBatches.id });

  const chunk = 250;
  let inserted = 0;
  for (let index = 0; index < parsed.length; index += chunk) {
    const slice = parsed.slice(index, index + chunk);
    const result = await db
      .insert(activationCodes)
      .values(
        slice.map(({ code, stageId }) => ({
          codeHash: hashActivationCode(code),
          codeCipher: encryptActivationCode(code),
          codeHint: activationCodeHint(code),
          stageId,
          batchId: batch.id,
          status: 'unused' as const,
        })),
      )
      .onConflictDoNothing({ target: activationCodes.codeHash })
      .returning({ id: activationCodes.id });
    inserted += result.length;
  }

  console.log(`  · imported ${inserted} activation codes from exports/PATIENCE_COURSE_CODES.csv`);
}

async function main() {
  console.log('→ Running migrations');
  await runMigrations();

  console.log('→ Seeding');
  await seedSettings();
  await seedAdmin();
  await seedStaff();
  await seedCourses();
  await seedStore();
  await seedCodesFromExport();

  console.log('');
  console.log('✓ Seed complete.');
  process.exit(0);
}

main().catch((error) => {
  console.error('✗ Seed failed:', error);
  process.exit(1);
});
