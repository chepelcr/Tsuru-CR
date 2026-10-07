import 'dotenv/config';
import { db } from './server/src/config/database.js';
import { organizations } from './server/src/entities/index.js';
import { eq } from 'drizzle-orm';

const TEMPLATE_SUBDOMAINS = [
  { slug: 'tsuru-demo-example', subdomain: 'tsuru-demo-example' },
  { slug: 'tech-gadgets-example', subdomain: 'tech-gadgets-example' },
  { slug: 'vintage-fashion-example', subdomain: 'vintage-fashion-example' },
  { slug: 'artisan-crafts-example', subdomain: 'artisan-crafts-example' },
  { slug: 'gourmet-foods-example', subdomain: 'gourmet-foods-example' },
  { slug: 'fitness-hub-example', subdomain: 'fitness-hub-example' },
  { slug: 'pet-care-example', subdomain: 'pet-care-example' },
];

async function updateSubdomains() {
  console.log('🔄 Updating template organization subdomains...\n');

  for (const template of TEMPLATE_SUBDOMAINS) {
    try {
      const result = await db
        .update(organizations)
        .set({ subdomain: template.subdomain })
        .where(eq(organizations.slug, template.slug))
        .returning();

      if (result.length > 0) {
        console.log(`✅ Updated ${template.slug} with subdomain: ${template.subdomain}`);
      } else {
        console.log(`⚠️  Organization ${template.slug} not found`);
      }
    } catch (error) {
      console.error(`❌ Error updating ${template.slug}:`, error);
    }
  }

  console.log('\n✅ Subdomain update complete!');
  process.exit(0);
}

updateSubdomains();
